import { AnimatePresence, motion } from "framer-motion";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaBookOpen,
  FaClock,
  FaLayerGroup,
  FaPlay,
  FaCheckCircle,
  FaRobot,
  FaTimes,
} from "react-icons/fa";
import {
  createAiVideoLecture,
  getAiVideoLectureStatus,
  getMedicineUsmleContent,
  getMedicineUsmleVideoDetails,
} from "../utils/authApi";
import { VideoMetaSkeleton, VideoPageSkeleton } from "../components/DataLoaderSkeletons";
import { getPlaybackRate, trackAnalyticsEvent, useAppSettings } from "../utils/settings";
import { getStoredUser, isSchoolTrack } from "../utils/schoolTrack";

// ─── watch tracking ────────────────────────────────────────────────────────

function markWatched(videoId) {
  if (!videoId) return;
  try {
    const watched = JSON.parse(localStorage.getItem("kanthastWatched") || "{}");
    if (watched[videoId]) return;
    watched[videoId] = true;
    localStorage.setItem("kanthastWatched", JSON.stringify(watched));

    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const streak = JSON.parse(localStorage.getItem("kanthastStreak") || '{"lastDate":"","count":0}');
    if (streak.lastDate !== today) {
      streak.count = streak.lastDate === yesterday ? streak.count + 1 : 1;
      streak.lastDate = today;
      localStorage.setItem("kanthastStreak", JSON.stringify(streak));
    }
  } catch {
    return;
  }
}

// ─── YouTube IFrame API loader (module-level singleton) ────────────────────

let ytApiPromise = null;
function loadYouTubeApi() {
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) { resolve(); return; }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(); };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
  return ytApiPromise;
}

// Reset so a failed load can be retried on next mount
function resetYtApiPromise() { ytApiPromise = null; }

// ─── helpers ───────────────────────────────────────────────────────────────

function useLectureQuery() {
  const { search } = useLocation();
  const query = new URLSearchParams(search);
  return {
    module: query.get("module") || "Module",
    section: query.get("section") || "Section",
    title: query.get("title") || "Lecture",
    duration: query.get("duration") || "--:--",
    subjectId: query.get("subjectId") || "",
    chapterId: query.get("chapterId") || "",
    videoId: query.get("videoId") || "",
  };
}

function parseVideoUrl(rawUrl) {
  if (!rawUrl) return { type: "none" };
  const url = rawUrl.trim();
  const lower = url.toLowerCase();

  if (/\.(mp4|webm|ogg|m3u8)(\?.*)?$/.test(lower)) return { type: "file", url };

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "").toLowerCase();

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      let ytId = "";
      if (host.includes("youtu.be")) ytId = parsed.pathname.slice(1);
      else if (parsed.pathname === "/watch") ytId = parsed.searchParams.get("v") || "";
      else if (parsed.pathname.startsWith("/shorts/")) ytId = parsed.pathname.split("/shorts/")[1];
      else if (parsed.pathname.startsWith("/embed/")) ytId = parsed.pathname.split("/embed/")[1];
      if (ytId) return { type: "youtube", ytId };
    }

    if (host.includes("vimeo.com")) {
      const segments = parsed.pathname.split("/").filter(Boolean);
      const vimeoId = segments[segments.length - 1];
      if (vimeoId && /^\d+$/.test(vimeoId)) return { type: "vimeo", vimeoId };
    }
  } catch {
    return;
  }

  return { type: "unknown", url };
}

function findNextLecture(content, subjectId, chapterId, videoId) {
  const subjects = content?.subjects || [];
  const subjectIndex = subjects.findIndex((subject) => String(subject._id) === String(subjectId));
  if (subjectIndex < 0) return null;

  const subject = subjects[subjectIndex];
  const chapters = subject?.chapters || [];
  const chapterIndex = chapters.findIndex((chapter) => String(chapter._id) === String(chapterId));
  if (chapterIndex < 0) return null;

  const chapter = chapters[chapterIndex];
  const videos = chapter?.videos || [];
  const videoIndex = videos.findIndex((video) => String(video._id) === String(videoId));
  if (videoIndex < 0) return null;

  const nextVideo = videos[videoIndex + 1];
  if (nextVideo) {
    return {
      subjectId: subject._id,
      chapterId: chapter._id,
      videoId: nextVideo._id,
      module: subject.name || "Module",
      section: chapter.name || "Section",
      title: nextVideo.name || "Lecture",
      duration: nextVideo.duration || "--:--",
    };
  }

  const nextChapter = chapters[chapterIndex + 1];
  if (nextChapter?.videos?.length) {
    const firstVideo = nextChapter.videos[0];
    return {
      subjectId: subject._id,
      chapterId: nextChapter._id,
      videoId: firstVideo._id,
      module: subject.name || "Module",
      section: nextChapter.name || "Section",
      title: firstVideo.name || "Lecture",
      duration: firstVideo.duration || "--:--",
    };
  }

  const nextSubject = subjects[subjectIndex + 1];
  if (nextSubject?.chapters?.length) {
    for (const nextChapterCandidate of nextSubject.chapters) {
      if (nextChapterCandidate?.videos?.length) {
        const firstVideo = nextChapterCandidate.videos[0];
        return {
          subjectId: nextSubject._id,
          chapterId: nextChapterCandidate._id,
          videoId: firstVideo._id,
          module: nextSubject.name || "Module",
          section: nextChapterCandidate.name || "Section",
          title: firstVideo.name || "Lecture",
          duration: firstVideo.duration || "--:--",
        };
      }
    }
  }

  return null;
}

const AI_VIDEO_TOPICS = [
  "Photosynthesis",
  "Chlorophyll",
  "Bacteria",
  "Cell membrane",
  "Human heart",
];

function getStudentFirstName() {
  const user = getStoredUser();
  const firstName = String(user?.firstName || "").trim();
  return firstName || "Student";
}

function isSchoolVideoCreatorEnabled() {
  const user = getStoredUser();
  return isSchoolTrack() || user?.track === "school";
}

function buildVideoGreeting(name) {
  return `Hey ${name}, I am your AI assistant and I can help you create a video related to any topic you find difficult understanding.`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function AiLectureLoader({ progress = 0, topic = "" }) {
  const storyStep = progress >= 75 ? 3 : progress >= 35 ? 2 : 1;
  return (
    <div className="relative overflow-hidden rounded-3xl border border-cyan-100 bg-[radial-gradient(circle_at_top_left,_#eff6ff,_#ffffff_46%,_#f0f9ff_100%)] p-6 text-slate-900 shadow-[0_24px_80px_rgba(2,6,23,0.14)]">
      <FloatingSparkles />
      <div className="flex items-center gap-3">
        <CartoonAssistantAvatar />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">Creating lecture</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">Please wait</h3>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-700">
        We are creating your AI lecture for <span className="font-semibold text-slate-950">{topic || "this topic"}</span>.
      </p>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-blue-500"
          initial={{ width: "12%" }}
          animate={{ width: `${Math.max(12, Math.min(progress, 100))}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-600">
        <TypingDotsSmall />
        <span>Building your mini lesson</span>
      </div>
      <p className="mt-2 text-xs text-cyan-700">{Math.max(0, Math.min(progress, 100))}% complete</p>
      <div className="mt-5">
        <LectureStoryPanel step={storyStep} />
      </div>
    </div>
  );
}

function FloatingSparkles() {
  const sparkles = [
    { className: "left-5 top-5 h-2.5 w-2.5 bg-amber-300", delay: 0 },
    { className: "right-8 top-10 h-2 w-2 bg-cyan-300", delay: 0.15 },
    { className: "left-10 bottom-10 h-3 w-3 bg-blue-300", delay: 0.3 },
    { className: "right-16 bottom-14 h-2.5 w-2.5 bg-emerald-300", delay: 0.45 },
  ];

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {sparkles.map((item, index) => (
        <motion.span
          key={`${item.className}-${index}`}
          className={`absolute rounded-full shadow-sm ${item.className}`}
          animate={{ y: [0, -8, 0], scale: [1, 1.25, 1], opacity: [0.5, 1, 0.6] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut", delay: item.delay }}
        />
      ))}
    </div>
  );
}

function CartoonAssistantAvatar() {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-cyan-200 via-sky-200 to-blue-200 shadow-inner shadow-white/70">
      <span className="absolute inset-0 rounded-[1.25rem] border border-white/70" />
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
        <div className="absolute left-3 top-4 h-1.5 w-1.5 rounded-full bg-slate-900" />
        <div className="absolute right-3 top-4 h-1.5 w-1.5 rounded-full bg-slate-900" />
        <div className="absolute top-6 h-2.5 w-5 rounded-b-full border-b-2 border-slate-900" />
        <div className="absolute -top-2 h-4 w-6 rounded-full bg-cyan-500 shadow-[0_8px_16px_rgba(34,211,238,0.35)]" />
      </div>
      <motion.span
        className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-300 text-[10px] font-black text-slate-900 shadow-md"
        animate={{ y: [0, -4, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      >
        AI
      </motion.span>
    </div>
  );
}

function LectureStoryPanel({ step = 1 }) {
  const items = [
    {
      number: "1",
      title: "Topic chosen",
      detail: "We understand the idea you want explained.",
    },
    {
      number: "2",
      title: "Lecture is being shaped",
      detail: "Simple language, visuals, and kid-friendly storytelling.",
    },
    {
      number: "3",
      title: "Video is ready to watch",
      detail: "The finished lesson will appear in your chat thread.",
    },
  ];

  return (
    <div className="rounded-3xl border border-cyan-100 bg-white/95 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Lecture story</p>
      <div className="mt-3 space-y-3">
        {items.map((item, index) => {
          const active = step === index + 1;
          const done = step > index + 1;
          return (
            <div
              key={item.number}
              className={`flex gap-3 rounded-2xl border px-3 py-3 transition ${
                active
                  ? "border-cyan-200 bg-cyan-50 shadow-sm"
                  : done
                  ? "border-emerald-100 bg-emerald-50/70"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-black ${
                  active
                    ? "bg-cyan-500 text-white"
                    : done
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {item.number}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{item.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TypingDotsSmall() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 140, 280].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce"
          style={{ animationDelay: `${delay}ms`, animationDuration: "0.9s" }}
        />
      ))}
    </div>
  );
}

function QuickTopicChip({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-slate-900"
    >
      {label}
    </button>
  );
}

// ─── YouTube player component ──────────────────────────────────────────────
// Root cause of the old bug: YT.Player REPLACES the target element with an
// iframe, so passing containerRef.current caused React's ref to become
// detached. Fix: keep wrapperRef (React-owned, never replaced) and
// imperatively create a fresh inner div for YT.Player to replace each time.

function YouTubePlayer({ ytId, onEnded, title, playbackRate }) {
  const wrapperRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    // Fresh div each effect run — YT replaces this, not wrapperRef
    const mountDiv = document.createElement("div");
    mountDiv.style.cssText = "width:100%;height:100%;";
    wrapper.appendChild(mountDiv);

    let cancelled = false;

    loadYouTubeApi()
      .then(() => {
        if (cancelled || !mountDiv.isConnected) return;
        playerRef.current = new window.YT.Player(mountDiv, {
          videoId: ytId,
          playerVars: { rel: 0, modestbranding: 1 },
          events: {
            onReady(e) {
              // Size the injected iframe to fill the wrapper
              const iframe = e.target.getIframe();
              if (iframe) {
                iframe.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
              }
              if (playbackRate && typeof e.target.setPlaybackRate === "function") {
                try {
                  e.target.setPlaybackRate(playbackRate);
                } catch {
                  return;
                }
              }
            },
            onStateChange(e) {
              if (e.data === 0) onEnded(); // 0 = YT.PlayerState.ENDED
            },
            onError() {
              resetYtApiPromise(); // allow retry on next mount
            },
          },
        });
      });

    return () => {
      cancelled = true;
      try { playerRef.current?.destroy(); } catch {
        return;
      }
      playerRef.current = null;
      if (mountDiv.isConnected) mountDiv.remove();
    };
  }, [ytId, onEnded, playbackRate]);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black aspect-video relative" title={title}>
      <div ref={wrapperRef} className="absolute inset-0" />
    </div>
  );
}

// ─── Vimeo player component ────────────────────────────────────────────────

function VimeoPlayer({ vimeoId, onEnded, title }) {
  const iframeRef = useRef(null);

  useEffect(() => {
    const origin = "https://player.vimeo.com";

    function onMessage(e) {
      if (e.origin !== origin) return;
      try {
        const msg = JSON.parse(e.data);
        if (msg.event === "ready") {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ method: "addEventListener", value: "finish" }),
            origin
          );
        }
        if (msg.event === "finish") onEnded();
      } catch {
        return;
      }
    }

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [vimeoId, onEnded]);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black">
      <iframe
        ref={iframeRef}
        src={`https://player.vimeo.com/video/${vimeoId}?api=1`}
        className="w-full aspect-video"
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

// ─── page ──────────────────────────────────────────────────────────────────

export default function VideoPage() {
  const settings = useAppSettings();
  const navigate = useNavigate();
  const data = useLectureQuery();
  const videoRef = useRef(null);
  const pollTimerRef = useRef(null);
  const [videoLink, setVideoLink] = useState("");
  const [dbTitle, setDbTitle] = useState("");
  const [courseContent, setCourseContent] = useState(null);
  const [loading, setLoading] = useState(Boolean(data.subjectId && data.chapterId && data.videoId));
  const [isWatched, setIsWatched] = useState(() => {
    try {
      const w = JSON.parse(localStorage.getItem("kanthastWatched") || "{}");
      return Boolean(data.videoId && w[data.videoId]);
    } catch { return false; }
  });
  const [lectureOpen, setLectureOpen] = useState(false);
  const [lectureTopic, setLectureTopic] = useState("");
  const [lectureState, setLectureState] = useState("idle");
  const [lectureProgress, setLectureProgress] = useState(0);
  const [lectureError, setLectureError] = useState("");
  const [lectureJob, setLectureJob] = useState(null);
  const studentName = getStudentFirstName();
  const lectureGreeting = buildVideoGreeting(studentName);

  const parsed = parseVideoUrl(videoLink);
  const playbackRate = getPlaybackRate(settings.defaultPlaybackSpeed);
  const MotionDiv = motion.div;
  const nextLecture = courseContent
    ? findNextLecture(courseContent, data.subjectId, data.chapterId, data.videoId)
    : null;
  const schoolVideoCreatorEnabled = isSchoolVideoCreatorEnabled();

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, []);

  const clearLecturePolling = useCallback(() => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    pollTimerRef.current = null;
  }, []);

  const scheduleLectureStatusPoll = useCallback(
    (token, jobId) => {
      clearLecturePolling();

      const poll = async () => {
        try {
          const data = await getAiVideoLectureStatus(token, jobId);
          const job = data.job || null;
          if (!job) {
            setLectureState("error");
            setLectureError("Unable to read the lecture status.");
            return;
          }

          setLectureJob(job);
          setLectureProgress(job.progress || 0);

          if (job.status === "completed") {
            setLectureState("completed");
            setLectureProgress(100);
            clearLecturePolling();
            return;
          }

          if (job.status === "failed") {
            setLectureState("error");
            setLectureError(job.errorMessage || "Lecture generation failed.");
            clearLecturePolling();
            return;
          }

          pollTimerRef.current = setTimeout(poll, 1800);
        } catch (error) {
          setLectureState("error");
          setLectureError(error.message || "Failed to check lecture progress.");
        }
      };

      poll();
    },
    [clearLecturePolling]
  );

  const startAiLecture = useCallback(async () => {
    if (!schoolVideoCreatorEnabled) {
      setLectureError("AI Video Creator is available only in Kanthast School.");
      setLectureState("error");
      return;
    }

    const token = localStorage.getItem("kanthastToken");
    const topic = lectureTopic.trim();
    if (!token) {
      setLectureError("Please log in to create an AI lecture.");
      setLectureState("error");
      return;
    }
    if (!topic) {
      setLectureError("Please enter a topic first.");
      setLectureState("error");
      return;
    }

    setLectureError("");
    setLectureState("starting");
    setLectureProgress(0);
    setLectureJob(null);

    try {
      const result = await createAiVideoLecture(token, {
        topic,
        sessionId: lectureJob?.sessionId || "",
      });
      const job = {
        jobId: result.jobId,
        sessionId: result.sessionId,
        status: result.status,
        progress: result.progress,
      };
      setLectureJob(job);
      setLectureState("processing");
      setLectureProgress(result.progress || 0);
      scheduleLectureStatusPoll(token, result.jobId);
    } catch (error) {
      setLectureState("error");
      setLectureError(error.message || "Failed to start the AI lecture.");
    }
  }, [lectureTopic, lectureJob?.sessionId, scheduleLectureStatusPoll, schoolVideoCreatorEnabled]);

  const openLectureCreator = useCallback(() => {
    if (!schoolVideoCreatorEnabled) return;
    setLectureOpen(true);
    setLectureError("");
    if (lectureState !== "processing" && lectureState !== "starting") {
      setLectureState("idle");
      setLectureProgress(0);
      setLectureJob(null);
    }
  }, [lectureState, schoolVideoCreatorEnabled]);

  const closeLectureCreator = useCallback(() => {
    setLectureOpen(false);
    setLectureTopic("");
    setLectureError("");
    if (lectureState !== "processing" && lectureState !== "starting") {
      setLectureJob(null);
      setLectureProgress(0);
      setLectureState("idle");
    }
  }, [lectureState]);

  const handleWatched = useCallback(() => {
    markWatched(data.videoId);
    setIsWatched(true);
    trackAnalyticsEvent("video_watched", {
      videoId: data.videoId,
      chapterId: data.chapterId,
      subjectId: data.subjectId,
    });
  }, [data.videoId, data.chapterId, data.subjectId]);

  const handleEnded = useCallback(() => {
    handleWatched();
    if (settings.autoplayNextLecture && nextLecture) {
      const params = new URLSearchParams({
        module: nextLecture.module,
        section: nextLecture.section,
        title: nextLecture.title,
        duration: nextLecture.duration,
        subjectId: nextLecture.subjectId,
        chapterId: nextLecture.chapterId,
        videoId: nextLecture.videoId,
      });
      sessionStorage.setItem("kanthastSkipNextLoader", "true");
      navigate(`/video?${params.toString()}`, { replace: true });
    }
  }, [handleWatched, nextLecture, settings.autoplayNextLecture, navigate]);

  useEffect(() => {
    let mounted = true;
    if (!data.subjectId || !data.chapterId || !data.videoId) {
      setLoading(false);
      return undefined;
    }
    (async () => {
      try {
        setLoading(true);
        const [response, catalog] = await Promise.all([
          getMedicineUsmleVideoDetails({
            subjectId: data.subjectId,
            chapterId: data.chapterId,
            videoId: data.videoId,
          }),
          getMedicineUsmleContent().catch(() => null),
        ]);
        if (!mounted) return;
        setCourseContent(catalog?.content || null);
        setVideoLink(response.video?.videoLink || "");
        setDbTitle(response.video?.name || "");
      } catch {
        if (!mounted) return;
        setVideoLink("");
        setDbTitle("");
        setCourseContent(null);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [data.subjectId, data.chapterId, data.videoId]);

  useEffect(() => {
    if (parsed.type !== "file" || !videoRef.current) return;
    videoRef.current.playbackRate = playbackRate;
  }, [parsed.type, playbackRate, videoLink]);

  const displayTitle = dbTitle || data.title;
  const lectureResult = lectureJob?.status === "completed" ? lectureJob : null;
  const lectureActive = lectureState === "starting" || lectureState === "processing";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#dbeafe,_#f8fafc_35%,_#eef2ff_85%)] px-4 md:px-8 py-8">
      {schoolVideoCreatorEnabled && (
        <motion.button
          type="button"
          onClick={openLectureCreator}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="fixed bottom-6 right-4 z-40 flex items-center gap-3 rounded-full border border-cyan-300/60 bg-slate-950 px-4 py-3 text-white shadow-[0_18px_50px_rgba(2,132,199,0.35)] md:bottom-8 md:right-8"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-400 text-slate-950">
            <FaRobot />
          </span>
          <span className="text-left">
            <span className="block text-[11px] uppercase tracking-[0.2em] text-cyan-200">AI Video Creator</span>
            <span className="block text-sm font-semibold">{studentName ? `Hey ${studentName}` : "Create a lecture"}</span>
          </span>
        </motion.button>
      )}

      <div className="max-w-7xl mx-auto">
        <Link
          to="/lists"
          className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium"
        >
          <FaArrowLeft /> Back to Lists
        </Link>

        <MotionDiv
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mt-4 grid lg:grid-cols-[1.4fr_0.8fr] gap-6"
        >
          {loading ? (
            <VideoPageSkeleton />
          ) : (
          <section className="rounded-3xl border border-slate-200 bg-white p-4 md:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
              {parsed.type === "file" ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black">
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full aspect-video"
                    src={parsed.url}
                    ref={videoRef}
                    onLoadedMetadata={() => {
                      if (videoRef.current) {
                        videoRef.current.playbackRate = playbackRate;
                      }
                    }}
                    onEnded={handleEnded}
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
              ) : parsed.type === "youtube" ? (
                <YouTubePlayer ytId={parsed.ytId} onEnded={handleEnded} title={displayTitle} playbackRate={playbackRate} />
              ) : parsed.type === "vimeo" ? (
                <VimeoPlayer vimeoId={parsed.vimeoId} onEnded={handleEnded} title={displayTitle} />
              ) : parsed.type === "unknown" ? (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-6">
                  <p className="text-slate-700">This link type cannot be embedded. Open directly:</p>
                  <a href={parsed.url} target="_blank" rel="noreferrer" className="text-blue-700 underline break-all">
                    {parsed.url}
                  </a>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-br from-[#0b1324] via-[#10214b] to-[#12395f] aspect-video relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(125,211,252,0.18),transparent_40%)]" />
                  <div className="absolute inset-0 grid place-items-center">
                    <button type="button" className="w-20 h-20 rounded-full bg-white/20 backdrop-blur border border-white/40 text-white text-2xl grid place-items-center hover:scale-105 transition">
                      <FaPlay className="ml-1" />
                    </button>
                  </div>
                  <div className="absolute left-4 right-4 bottom-4 text-white">
                    <p className="text-sm text-cyan-100">{data.module} — {data.section}</p>
                    <h1 className="text-xl md:text-3xl font-bold mt-1">{displayTitle}</h1>
                  </div>
                </div>
              )}
              <div className="mt-3 text-sm text-slate-500">Duration: {data.duration}</div>
            </section>
          )}

          {loading ? (
            <VideoMetaSkeleton />
          ) : (
            <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <h2 className="text-xl font-bold text-slate-900">Lecture Context</h2>
              <div className="mt-4 space-y-3">
                <MetaCard icon={<FaLayerGroup />} label="Module" value={data.module} />
                <MetaCard icon={<FaBookOpen />} label="Section" value={data.section} />
                <MetaCard icon={<FaClock />} label="Duration" value={data.duration} />
              </div>

              {data.videoId && (
                <button
                  onClick={handleWatched}
                  disabled={isWatched}
                  className={`mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border font-semibold text-sm transition ${
                    isWatched
                      ? "bg-green-50 border-green-200 text-green-700 cursor-default"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <FaCheckCircle className={isWatched ? "text-green-500" : "text-slate-400"} />
                  {isWatched ? "Marked as Watched" : "Mark as Watched"}
                </button>
              )}

              <div className="mt-5 rounded-2xl bg-cyan-50/60 border border-cyan-100 border-l-4 border-l-cyan-500 p-4">
                <h3 className="text-slate-900 font-semibold">Focus Mode Tip</h3>
                <p className="text-slate-700 text-sm mt-2">
                  Watch in 1.25x, pause at transitions, and summarize each segment in one line.
                </p>
              </div>
            </aside>
          )}
        </MotionDiv>
      </div>

      <AnimatePresence>
        {lectureOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 px-4 py-4 backdrop-blur-sm md:items-center md:py-8"
            onClick={closeLectureCreator}
          >
            <motion.div
              initial={{ y: 36, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/15 bg-white shadow-[0_30px_120px_rgba(2,6,23,0.45)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
                <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_#fef3c7,_#ffffff_35%,_#eff6ff_80%)] p-5 md:p-7 text-slate-900">
                  <div className="pointer-events-none absolute -top-8 -right-8 h-24 w-24 rounded-full bg-cyan-200/50 blur-2xl" />
                  <div className="pointer-events-none absolute bottom-10 -left-10 h-28 w-28 rounded-full bg-amber-200/60 blur-2xl" />
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">AI Video Creator</p>
                      <h2 className="mt-2 text-3xl font-black leading-tight text-slate-950">Hey {studentName}</h2>
                      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
                        {lectureGreeting}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeLectureCreator}
                      className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
                      aria-label="Close video creator"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <div className="mt-6 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">
                      Topic
                    </label>
                    <input
                      value={lectureTopic}
                      onChange={(e) => setLectureTopic(e.target.value)}
                      placeholder="Type a topic like photosynthesis"
                      className="mt-3 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
                    />

                    <div className="mt-4 flex flex-wrap gap-2">
                      {AI_VIDEO_TOPICS.map((topic) => (
                        <QuickTopicChip key={topic} label={topic} onClick={() => setLectureTopic(topic)} />
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={startAiLecture}
                      disabled={lectureActive}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <FaRobot />
                      {lectureActive ? "Creating your lecture..." : "Create AI Lecture"}
                    </button>

                    {lectureError && (
                      <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {lectureError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-[linear-gradient(180deg,#f8fbff_0%,#f0f9ff_100%)] p-5 md:p-7">
                  {lectureActive ? (
                    <AiLectureLoader progress={lectureProgress} topic={lectureTopic} />
                  ) : lectureResult ? (
                    <div className="rounded-3xl border border-cyan-100 bg-white p-4 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">Delivered to chat</p>
                      <h3 className="mt-2 text-2xl font-black text-slate-900">{lectureResult.title || lectureTopic}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        Your AI lecture is now saved in the chat thread and can be replayed anytime.
                      </p>
                      <video
                        className="mt-4 w-full rounded-2xl border border-slate-200 bg-black aspect-video"
                        controls
                        playsInline
                        poster={lectureResult.thumbnailUrl || ""}
                        src={lectureResult.mediaUrl || ""}
                      >
                        Your browser does not support video playback.
                      </video>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => navigate(`/chatbot?sessionId=${encodeURIComponent(lectureResult.sessionId || lectureJob?.sessionId || "")}`)}
                          className="rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Open chat thread
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLectureState("idle");
                            setLectureJob(null);
                            setLectureProgress(0);
                            setLectureTopic("");
                          }}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          Create another
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[360px] flex-col justify-between rounded-3xl border border-dashed border-cyan-200 bg-white p-5 shadow-sm">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          Ready when you are
                        </p>
                        <h3 className="mt-2 text-2xl font-black text-slate-900">
                          Type a topic and I will build a mini lecture video
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-slate-600">
                          Try topics like photosynthesis, chlorophyll, bacteria, digestion, or the human heart.
                        </p>
                      </div>

                      <div className="rounded-3xl bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-4">
                        <p className="text-sm font-semibold text-slate-900">What happens next?</p>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                          <li>1. I turn your topic into a kid-friendly AI lecture.</li>
                          <li>2. You see a progress animation while the video is prepared.</li>
                          <li>3. The finished video is sent to your chat thread.</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MetaCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
        {icon} {label}
      </p>
      <p className="text-slate-900 font-semibold mt-1">{value}</p>
    </div>
  );
}

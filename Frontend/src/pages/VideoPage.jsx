import { motion } from "framer-motion";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaBookOpen,
  FaClock,
  FaLayerGroup,
  FaPlay,
  FaCheckCircle,
} from "react-icons/fa";
import { getMedicineUsmleContent, getMedicineUsmleVideoDetails } from "../utils/authApi";
import { VideoMetaSkeleton, VideoPageSkeleton } from "../components/DataLoaderSkeletons";
import { getPlaybackRate, trackAnalyticsEvent, useAppSettings } from "../utils/settings";

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

  const parsed = parseVideoUrl(videoLink);
  const playbackRate = getPlaybackRate(settings.defaultPlaybackSpeed);
  const MotionDiv = motion.div;
  const nextLecture = courseContent
    ? findNextLecture(courseContent, data.subjectId, data.chapterId, data.videoId)
    : null;

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#dbeafe,_#f8fafc_35%,_#eef2ff_85%)] px-4 md:px-8 py-8">
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

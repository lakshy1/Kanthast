import { AnimatePresence, motion } from "framer-motion";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaClock,
  FaPlay,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLock,
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
import {
  getResumeSeconds,
  saveProgress,
  shouldPersist,
} from "../utils/progress";

// ─── watch tracking ────────────────────────────────────────────────────────

const WATCHED_KEY = "kanthastWatched";
const SHORTCUT_HINT_KEY = "kanthastShortcutHintDismissed";

function readWatchedMap() {
  try {
    const parsed = JSON.parse(localStorage.getItem(WATCHED_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function markWatched(videoId) {
  if (!videoId) return;
  try {
    const watched = readWatchedMap();
    if (watched[videoId]) return;
    watched[videoId] = true;
    localStorage.setItem(WATCHED_KEY, JSON.stringify(watched));

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

// Undo for "Mark as Watched". The streak is left alone: it records that the
// student studied today, which stays true even if they un-tick one lecture.
function unmarkWatched(videoId) {
  if (!videoId) return;
  try {
    const watched = readWatchedMap();
    if (!watched[videoId]) return;
    delete watched[videoId];
    localStorage.setItem(WATCHED_KEY, JSON.stringify(watched));
  } catch {
    return;
  }
}

function readHasSubscription() {
  try {
    const user = JSON.parse(localStorage.getItem("kanthastUser") || "null");
    return Boolean(user?.subscriptionPurchased);
  } catch {
    return false;
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

// Speed steps for the native player, shared by the buttons and the
// Shift+< / Shift+> shortcuts.
const SPEED_STEPS = [0.75, 1, 1.25, 1.5, 1.75, 2];

function useLectureQuery() {
  const { search } = useLocation();
  const query = new URLSearchParams(search);
  return {
    module: query.get("module") || "",
    section: query.get("section") || "",
    title: query.get("title") || "Lecture",
    duration: query.get("duration") || "",
    subjectId: query.get("subjectId") || "",
    chapterId: query.get("chapterId") || "",
    videoId: query.get("videoId") || "",
  };
}

const MEDIA_FILE_RE = /\.(mp4|webm|ogg|m3u8)$/i;

function toUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

/**
 * Classify a lecture's video link. Always returns an object with a `type`
 * ("file" | "youtube" | "vimeo" | "unknown" | "none"), so callers can read
 * `parsed.type` without guarding: a malformed admin-entered link used to make
 * this return undefined and crash the page on render.
 */
function parseVideoUrl(rawUrl) {
  if (typeof rawUrl !== "string") return { type: "none" };
  const url = rawUrl.trim();
  if (!url) return { type: "none" };

  // Same-origin path to a self-hosted file ("/media/lecture.mp4").
  if (url.startsWith("/") && !url.startsWith("//")) {
    const path = url.split(/[?#]/)[0];
    return MEDIA_FILE_RE.test(path) ? { type: "file", url } : { type: "none" };
  }

  // Admins often paste links without a scheme ("youtube.com/watch?v=…").
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(url);
  const parsed = toUrl(url) || (!hasScheme ? toUrl(`https://${url.replace(/^\/\//, "")}`) : null);
  if (!parsed) return { type: "none" };

  // Only web links are embedded or linked; anything else (javascript:, data:,
  // mailto:) is treated as no video at all.
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return { type: "none" };
  if (!parsed.hostname) return { type: "none" };

  const href = parsed.href;
  const host = parsed.hostname.replace(/^www\./, "").replace(/^m\./, "").toLowerCase();

  if (MEDIA_FILE_RE.test(parsed.pathname)) return { type: "file", url: href };

  if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be" || host === "youtube-nocookie.com") {
    let ytId = "";
    if (host === "youtu.be") ytId = parsed.pathname.slice(1).split("/")[0];
    else if (parsed.pathname === "/watch") ytId = parsed.searchParams.get("v") || "";
    else if (parsed.pathname.startsWith("/shorts/")) ytId = parsed.pathname.split("/shorts/")[1].split("/")[0];
    else if (parsed.pathname.startsWith("/embed/")) ytId = parsed.pathname.split("/embed/")[1].split("/")[0];
    else if (parsed.pathname.startsWith("/live/")) ytId = parsed.pathname.split("/live/")[1].split("/")[0];
    if (/^[\w-]{6,}$/.test(ytId)) return { type: "youtube", ytId };
  }

  if (host === "vimeo.com" || host.endsWith(".vimeo.com")) {
    const segments = parsed.pathname.split("/").filter(Boolean);
    const vimeoId = segments.find((segment) => /^\d+$/.test(segment));
    if (vimeoId) return { type: "vimeo", vimeoId };
  }

  return { type: "unknown", url: href };
}

function hasPlayableLink(video) {
  return parseVideoUrl(video?.videoLink).type !== "none";
}

/** Subject, chapter and lecture position for the current ids, from the catalog. */
function locateLecture(content, subjectId, chapterId, videoId) {
  const subjects = content?.subjects || [];
  const subject = subjects.find((item) => String(item._id) === String(subjectId)) || null;
  const chapter = subject?.chapters?.find((item) => String(item._id) === String(chapterId)) || null;
  const videos = chapter?.videos || [];
  const index = videos.findIndex((item) => String(item._id) === String(videoId));
  return { subject, chapter, videos, index };
}

function buildLectureHref(lecture) {
  const params = new URLSearchParams({
    module: lecture.module || "",
    section: lecture.section || "",
    title: lecture.title || "Lecture",
    duration: lecture.duration || "",
    subjectId: lecture.subjectId || "",
    chapterId: lecture.chapterId || "",
    videoId: lecture.videoId || "",
  });
  return `/video?${params.toString()}`;
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

function formatClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function isTypingTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
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
  return isSchoolTrack();
}

function buildVideoGreeting(name) {
  return `Hey ${name}, I am your AI assistant and I can help you create a video related to any topic you find difficult understanding.`;
}

function AiLectureLoader({ progress = 0, topic = "" }) {
  const storyStep = progress >= 75 ? 3 : progress >= 35 ? 2 : 1;
  const clamped = Math.max(0, Math.min(progress, 100));
  return (
    <div className="rounded-card border border-line bg-surface p-6 text-ink shadow-e2">
      <div className="flex items-center gap-3">
        <CartoonAssistantAvatar />
        <div>
          <p className="text-sm font-semibold text-brand">Creating lecture</p>
          <h3 className="mt-1 text-xl font-bold tracking-tight text-ink">Please wait</h3>
        </div>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-ink-muted">
        We are creating your AI lecture for <span className="font-semibold text-ink">{topic || "this topic"}</span>.
      </p>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-surface-sunken">
        <motion.div
          className="h-full rounded-full bg-brand"
          initial={{ width: "12%" }}
          animate={{ width: `${Math.max(12, clamped)}%` }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        />
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs font-medium text-ink-muted">
        <TypingDotsSmall />
        <span>Building your mini lesson</span>
      </div>
      <p className="mt-2 text-xs tabular-nums text-ink-subtle">{clamped}% complete</p>
      <div className="mt-5">
        <LectureStoryPanel step={storyStep} />
      </div>
    </div>
  );
}

function CartoonAssistantAvatar() {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center rounded-card bg-brand-soft">
      <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-surface shadow-e1">
        <div className="absolute left-3 top-4 h-1.5 w-1.5 rounded-full bg-ink" />
        <div className="absolute right-3 top-4 h-1.5 w-1.5 rounded-full bg-ink" />
        <div className="absolute top-6 h-2.5 w-5 rounded-b-full border-b-2 border-ink" />
        <div className="absolute -top-2 h-4 w-6 rounded-full bg-brand" />
      </div>
      <motion.span
        className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-micro font-bold text-brand-fg shadow-e1"
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
      key: "topic",
      title: "Topic chosen",
      detail: "We understand the idea you want explained.",
    },
    {
      key: "shape",
      title: "Lecture is being shaped",
      detail: "Simple language, visuals, and kid-friendly storytelling.",
    },
    {
      key: "ready",
      title: "Video is ready to watch",
      detail: "The finished lesson will appear in your chat thread.",
    },
  ];

  return (
    <div className="rounded-card border border-line bg-surface-sunken p-4">
      <p className="text-sm font-semibold text-ink">Lecture story</p>
      <ol className="mt-3 space-y-2">
        {items.map((item, index) => {
          const active = step === index + 1;
          const done = step > index + 1;
          return (
            <li
              key={item.key}
              aria-current={active ? "step" : undefined}
              className={`flex gap-3 rounded-control border px-3 py-3 transition-colors duration-fast ease-brand ${
                active
                  ? "border-brand bg-brand-soft"
                  : done
                  ? "border-line bg-positive-soft"
                  : "border-line bg-surface"
              }`}
            >
              <span
                aria-hidden="true"
                className={`mt-0.5 flex-shrink-0 text-sm ${
                  active ? "text-brand" : done ? "text-positive" : "text-ink-subtle"
                }`}
              >
                {done ? <FaCheckCircle /> : active ? <FaPlay /> : <FaClock />}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{item.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function TypingDotsSmall() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      {[0, 140, 280].map((delay) => (
        <span
          key={delay}
          className="h-2 w-2 rounded-full bg-brand animate-pulse motion-reduce:animate-none"
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
      className="min-h-touch rounded-full border border-line-strong bg-surface px-3 text-sm font-medium text-ink-muted transition-colors duration-fast ease-brand hover:border-brand hover:bg-brand-soft hover:text-ink"
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
    <div className="relative aspect-video overflow-hidden rounded-card border border-line bg-black" title={title}>
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
    <div className="overflow-hidden rounded-card border border-line bg-black">
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

// ─── status panels (no video / failed load) ───────────────────────────────
// Flow layout, not an absolutely positioned overlay inside aspect-video: at
// 390px the 16:9 box is ~200px tall, which clipped the old overlay's own
// "Back to lectures" button. The box keeps the player's 16:9 shape from `sm`
// up and simply grows on phones.

function PlayerStatusPanel({ tone = "neutral", icon, heading, children, actions }) {
  const iconClass =
    tone === "critical"
      ? "border-critical/35 bg-critical-soft text-critical"
      : "border-line bg-surface text-ink-subtle";
  return (
    <div
      className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-card border border-line bg-surface-sunken px-5 py-8 text-center sm:aspect-video sm:min-h-0"
      role={tone === "critical" ? "alert" : undefined}
    >
      <span
        aria-hidden="true"
        className={`grid h-12 w-12 place-items-center rounded-full border text-lg ${iconClass}`}
      >
        {icon}
      </span>
      <div>
        <p className="text-base font-semibold text-ink">{heading}</p>
        <div className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-ink-muted">{children}</div>
      </div>
      {actions && <div className="flex flex-wrap items-center justify-center gap-3">{actions}</div>}
    </div>
  );
}

// ─── chapter rail ("In this chapter") ─────────────────────────────────────

function ChapterRail({
  subject,
  chapter,
  videos,
  currentIndex,
  watchedMap,
  hasSubscription,
  onNavigate,
}) {
  const listRef = useRef(null);
  const currentRef = useRef(null);

  // Keep the current lecture in view inside the scrolling list without
  // scrolling the page itself.
  useEffect(() => {
    const list = listRef.current;
    const current = currentRef.current;
    if (!list || !current) return;
    const top = current.offsetTop - list.offsetTop;
    if (top + current.offsetHeight > list.clientHeight) {
      list.scrollTop = Math.max(0, top - list.clientHeight / 3);
    }
  }, [currentIndex]);

  const watchedCount = videos.filter((video) => watchedMap[video._id]).length;

  return (
    <aside className="card p-4 md:p-5" aria-labelledby="chapter-rail-heading">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="chapter-rail-heading" className="text-lg font-bold tracking-tight text-ink">
          In this chapter
        </h2>
        <p className="shrink-0 text-sm tabular-nums text-ink-subtle">
          {watchedCount}/{videos.length} watched
        </p>
      </div>
      <p className="mt-0.5 text-sm text-ink-muted">{chapter.name}</p>

      <ol
        ref={listRef}
        className="mt-3 max-h-[28rem] space-y-1 overflow-y-auto overscroll-contain border-t border-line pt-3 lg:max-h-[calc(100vh-14rem)]"
      >
        {videos.map((video, index) => {
          const isCurrent = index === currentIndex;
          const isWatched = Boolean(watchedMap[video._id]);
          // Mirrors the library's rule for the medical track: without a
          // subscription only the first two lectures of a chapter open.
          const isLocked = !hasSubscription && index >= 2 && !isCurrent;
          const playable = hasPlayableLink(video);
          const lecture = {
            module: subject.name || "Module",
            section: chapter.name || "Section",
            title: video.name || "Lecture",
            duration: video.duration || "--:--",
            subjectId: subject._id,
            chapterId: chapter._id,
            videoId: video._id,
          };

          const status = isCurrent
            ? "Now playing"
            : isLocked
            ? "Locked, subscribe to unlock"
            : isWatched
            ? "Watched"
            : "";

          const body = (
            <>
              <span
                aria-hidden="true"
                className={`mt-0.5 w-5 shrink-0 text-center text-sm tabular-nums ${
                  isCurrent
                    ? "text-brand"
                    : isLocked
                    ? "text-caution"
                    : isWatched
                    ? "text-positive"
                    : "text-ink-subtle"
                }`}
              >
                {isCurrent ? (
                  <FaPlay className="mx-auto text-xs" />
                ) : isLocked ? (
                  <FaLock className="mx-auto text-xs" />
                ) : isWatched ? (
                  <FaCheckCircle className="mx-auto" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-sm leading-snug ${
                    isCurrent ? "font-semibold text-ink" : "text-ink-muted group-hover:text-ink"
                  }`}
                >
                  {video.name || "Lecture"}
                </span>
                {(!playable || isLocked) && (
                  <span className="mt-0.5 block text-micro text-ink-subtle">
                    {isLocked ? "Subscribe to unlock" : "In production"}
                  </span>
                )}
                {status && <span className="sr-only">, {status}</span>}
              </span>
              {video.duration && (
                <span className="mt-0.5 shrink-0 text-xs tabular-nums text-ink-subtle">{video.duration}</span>
              )}
            </>
          );

          const rowClass = `group flex min-h-touch items-start gap-3 rounded-control px-3 py-2.5 transition-colors duration-fast ease-brand ${
            isCurrent ? "bg-brand-soft" : "hover:bg-surface-sunken"
          }`;

          return (
            <li key={video._id || index} ref={isCurrent ? currentRef : undefined}>
              {isCurrent ? (
                <div className={rowClass} aria-current="true">
                  {body}
                </div>
              ) : isLocked ? (
                <Link to="/subscription" className={rowClass}>
                  {body}
                </Link>
              ) : (
                <Link
                  to={buildLectureHref(lecture)}
                  onClick={onNavigate}
                  className={rowClass}
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

// ─── page ──────────────────────────────────────────────────────────────────

// Keyed on the lecture id: moving to another lecture (autoplay, the chapter
// rail) keeps the same route element mounted, which used to carry the old
// lecture's watched state, resume notice and player errors across.
export default function VideoPage() {
  const { search } = useLocation();
  const videoId = new URLSearchParams(search).get("videoId") || "";
  return <LecturePage key={videoId} />;
}

function LecturePage() {
  const settings = useAppSettings();
  const navigate = useNavigate();
  const data = useLectureQuery();
  const videoRef = useRef(null);
  const pollTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const flashTimerRef = useRef(null);
  const [videoLink, setVideoLink] = useState("");
  const [dbTitle, setDbTitle] = useState("");
  const [courseContent, setCourseContent] = useState(null);
  const [loading, setLoading] = useState(Boolean(data.subjectId && data.chapterId && data.videoId));
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // Player feedback state: buffering spinner, load failure, resume notice.
  // Seeded from the Settings default, then overridable per-lecture in-player.
  const [activeRate, setActiveRate] = useState(() =>
    getPlaybackRate(settings.defaultPlaybackSpeed)
  );
  const activeRateRef = useRef(activeRate);
  const [buffering, setBuffering] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [resumedFrom, setResumedFrom] = useState(0);
  const [shortcutFlash, setShortcutFlash] = useState("");
  const [hintDismissed, setHintDismissed] = useState(() => {
    try {
      return localStorage.getItem(SHORTCUT_HINT_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [watchedMap, setWatchedMap] = useState(readWatchedMap);
  const [hasSubscription] = useState(readHasSubscription);
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
  const located = locateLecture(courseContent, data.subjectId, data.chapterId, data.videoId);
  const schoolVideoCreatorEnabled = isSchoolVideoCreatorEnabled();
  const isWatched = Boolean(data.videoId && watchedMap[data.videoId]);

  const subjectName = located.subject?.name || data.module;
  const chapterName = located.chapter?.name || data.section;
  const catalogVideo = located.index >= 0 ? located.videos[located.index] : null;
  const displayTitle = dbTitle || catalogVideo?.name || data.title;
  const displayDuration = catalogVideo?.duration || data.duration;
  const otherLecturesReady = located.videos.some(
    (video, index) => index !== located.index && hasPlayableLink(video)
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
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
          // Unmounted while the request was in flight: do not touch state
          // and, above all, do not schedule another poll.
          if (!mountedRef.current) return;
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
          if (!mountedRef.current) return;
          setLectureState("error");
          setLectureError(error.message || "Failed to check lecture progress.");
        }
      };

      poll();
    },
    [clearLecturePolling]
  );

  const lectureSessionId = lectureJob?.sessionId || "";
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
        sessionId: lectureSessionId,
      });
      if (!mountedRef.current) return;
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
      if (!mountedRef.current) return;
      setLectureState("error");
      setLectureError(error.message || "Failed to start the AI lecture.");
    }
  }, [lectureTopic, lectureSessionId, scheduleLectureStatusPoll, schoolVideoCreatorEnabled]);

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
    setWatchedMap(readWatchedMap());
    trackAnalyticsEvent("video_watched", {
      videoId: data.videoId,
      chapterId: data.chapterId,
      subjectId: data.subjectId,
    });
  }, [data.videoId, data.chapterId, data.subjectId]);

  const handleUnwatched = useCallback(() => {
    unmarkWatched(data.videoId);
    setWatchedMap(readWatchedMap());
    trackAnalyticsEvent("video_unwatched", {
      videoId: data.videoId,
      chapterId: data.chapterId,
      subjectId: data.subjectId,
    });
  }, [data.videoId, data.chapterId, data.subjectId]);

  const handleEnded = useCallback(() => {
    handleWatched();
    if (settings.autoplayNextLecture && nextLecture) {
      sessionStorage.setItem("kanthastSkipNextLoader", "true");
      navigate(buildLectureHref(nextLecture), { replace: true });
    }
  }, [handleWatched, nextLecture, settings.autoplayNextLecture, navigate]);

  // Chapter-rail clicks navigate like autoplay-next: same URL shape, and no
  // full-page loader between lectures.
  const handleRailNavigate = useCallback(() => {
    sessionStorage.setItem("kanthastSkipNextLoader", "true");
  }, []);

  useEffect(() => {
    let mounted = true;
    // Without ids there is nothing to fetch; `loading` starts false then.
    if (!data.subjectId || !data.chapterId || !data.videoId) return undefined;
    (async () => {
      // The catalog only feeds the chapter rail and next-lecture lookup, so
      // its failure must never block the lecture itself.
      const catalogPromise = getMedicineUsmleContent().catch(() => null);
      try {
        const response = await getMedicineUsmleVideoDetails({
          subjectId: data.subjectId,
          chapterId: data.chapterId,
          videoId: data.videoId,
        });
        if (!mounted) return;
        setVideoLink(response.video?.videoLink || "");
        setDbTitle(response.video?.name || "");
      } catch {
        // A failed request (offline, server down) is not the same as a
        // lecture with no video: say so and offer a retry.
        if (!mounted) return;
        setVideoLink("");
        setDbTitle("");
        setLoadError(true);
      }
      const catalog = await catalogPromise;
      if (!mounted) return;
      setCourseContent(catalog?.content || null);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [data.subjectId, data.chapterId, data.videoId, reloadKey]);

  // One source of truth for the native player's speed: the buttons and the
  // keyboard shortcuts both only set state.
  useEffect(() => {
    activeRateRef.current = activeRate;
    if (parsed.type !== "file" || !videoRef.current) return;
    videoRef.current.playbackRate = activeRate;
  }, [parsed.type, activeRate, videoLink]);

  const flash = useCallback((message) => {
    setShortcutFlash(message);
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setShortcutFlash(""), 900);
  }, []);

  // Keyboard shortcuts for the self-hosted player only. YouTube and Vimeo run
  // in cross-origin iframes with their own shortcuts, so nothing is bound for
  // them.
  useEffect(() => {
    if (parsed.type !== "file" || lectureOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      const el = videoRef.current;
      if (!el) return;

      const target = event.target instanceof HTMLElement ? event.target : null;
      const onOtherControl =
        target && target !== el && target.closest("button, a, summary, [role='button']");

      const seekBy = (delta) => {
        const end = Number.isFinite(el.duration) ? el.duration : Infinity;
        el.currentTime = Math.min(Math.max(0, el.currentTime + delta), end);
        flash(`${delta > 0 ? "+" : "−"}${Math.abs(delta)}s`);
      };
      const stepSpeed = (direction) => {
        const current = activeRateRef.current;
        let index = SPEED_STEPS.indexOf(current);
        if (index < 0) index = SPEED_STEPS.findIndex((step) => step >= current);
        if (index < 0) index = SPEED_STEPS.length - 1;
        const next = SPEED_STEPS[Math.min(Math.max(index + direction, 0), SPEED_STEPS.length - 1)];
        activeRateRef.current = next;
        setActiveRate(next);
        flash(`${next}×`);
      };

      const key = event.key;
      if (key === " " || key === "Spacebar" || key === "k" || key === "K") {
        // Space on a focused button or link should press that control.
        if (key !== "k" && key !== "K" && onOtherControl) return;
        event.preventDefault();
        if (el.paused) {
          el.play().catch(() => {});
          flash("Play");
        } else {
          el.pause();
          flash("Pause");
        }
      } else if (key === "j" || key === "J") {
        event.preventDefault();
        seekBy(-10);
      } else if (key === "l" || key === "L") {
        event.preventDefault();
        seekBy(10);
      } else if (key === "ArrowLeft") {
        event.preventDefault();
        seekBy(-5);
      } else if (key === "ArrowRight") {
        event.preventDefault();
        seekBy(5);
      } else if (key === ">" || (event.shiftKey && key === ".")) {
        event.preventDefault();
        stepSpeed(1);
      } else if (key === "<" || (event.shiftKey && key === ",")) {
        event.preventDefault();
        stepSpeed(-1);
      } else if (key === "m" || key === "M") {
        event.preventDefault();
        el.muted = !el.muted;
        flash(el.muted ? "Muted" : "Sound on");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [parsed.type, lectureOpen, flash]);

  const dismissHint = () => {
    setHintDismissed(true);
    try {
      localStorage.setItem(SHORTCUT_HINT_KEY, "true");
    } catch {
      /* per-device convenience only */
    }
  };

  const lectureResult = lectureJob?.status === "completed" ? lectureJob : null;
  const lectureActive = lectureState === "starting" || lectureState === "processing";
  const breadcrumb = [subjectName, chapterName].filter(Boolean);
  const showRail = Boolean(located.chapter && located.videos.length > 0);

  let player;
  if (loadError) {
    player = (
      <PlayerStatusPanel
        tone="critical"
        icon={<FaExclamationTriangle />}
        heading="We couldn't load this lecture"
        actions={
          <>
            <button type="button" onClick={() => {
              setLoadError(false);
              setLoading(true);
              setReloadKey((key) => key + 1);
            }} className="btn-primary">
              Retry
            </button>
            <Link to="/lists" className="btn-ghost">
              Back to lectures
            </Link>
          </>
        }
      >
        <p>Check your connection and try again. Your progress is saved on this device.</p>
      </PlayerStatusPanel>
    );
  } else if (parsed.type === "file") {
    player = (
      <div className="relative overflow-hidden rounded-card border border-line bg-black">
        <video
          controls
          playsInline
          preload="metadata"
          className="w-full aspect-video"
          src={parsed.url}
          ref={videoRef}
          aria-label={displayTitle}
          onLoadedMetadata={() => {
            const el = videoRef.current;
            if (!el) return;
            el.playbackRate = activeRate;
            // Resume where the student left off.
            const resumeAt = getResumeSeconds(data.videoId);
            if (resumeAt > 0 && resumeAt < el.duration) {
              el.currentTime = resumeAt;
              setResumedFrom(resumeAt);
            }
            setMediaError("");
          }}
          onTimeUpdate={() => {
            const el = videoRef.current;
            if (!el || !el.duration) return;
            if (shouldPersist(el.currentTime)) {
              saveProgress(data.videoId, el.currentTime, el.duration, {
                title: displayTitle,
                module: subjectName,
                section: chapterName,
                subjectId: data.subjectId,
                chapterId: data.chapterId,
                // Display label only. Must not be named `duration`: the meta is spread
                // over the pointer and would replace the numeric seconds saveProgress
                // stores, leaving getLastWatched() with NaN percent/remaining.
                durationLabel: displayDuration,
              });
            }
          }}
          onWaiting={() => setBuffering(true)}
          onPlaying={() => setBuffering(false)}
          onCanPlay={() => setBuffering(false)}
          onError={() =>
            setMediaError(
              "This lecture could not be loaded. Check your connection and try again."
            )
          }
          onEnded={handleEnded}
        >
          Your browser does not support video playback.
        </video>

        {buffering && !mediaError && (
          <div
            className="pointer-events-none absolute inset-0 grid place-items-center bg-black/30"
            role="status"
            aria-live="polite"
          >
            <span className="sr-only">Buffering</span>
            <span
              aria-hidden="true"
              className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/40 border-t-white"
            />
          </div>
        )}

        <div
          className="pointer-events-none absolute inset-x-0 top-4 flex justify-center"
          role="status"
          aria-live="polite"
        >
          {shortcutFlash && (
            <span className="rounded-full bg-black/65 px-3 py-1 text-sm font-semibold tabular-nums text-white">
              {shortcutFlash}
            </span>
          )}
        </div>

        {mediaError && (
          <div
            className="absolute inset-0 grid place-items-center bg-black/85 px-6 text-center"
            role="alert"
          >
            <div>
              <p className="text-sm font-semibold text-white">{mediaError}</p>
              <button
                type="button"
                onClick={() => {
                  setMediaError("");
                  videoRef.current?.load();
                }}
                className="btn-secondary mt-4"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    );
  } else if (parsed.type === "youtube") {
    player = (
      <YouTubePlayer ytId={parsed.ytId} onEnded={handleEnded} title={displayTitle} playbackRate={playbackRate} />
    );
  } else if (parsed.type === "vimeo") {
    player = <VimeoPlayer vimeoId={parsed.vimeoId} onEnded={handleEnded} title={displayTitle} />;
  } else if (parsed.type === "unknown") {
    player = (
      <PlayerStatusPanel
        icon={<FaPlay />}
        heading="This video opens on another site"
        actions={
          <a href={parsed.url} target="_blank" rel="noreferrer" className="btn-secondary">
            Open video
          </a>
        }
      >
        <p className="break-all">{parsed.url}</p>
      </PlayerStatusPanel>
    );
  } else {
    // No video link. Only point at other lectures when the chapter really
    // has one with a video; most of the catalog is still in production.
    player = (
      <PlayerStatusPanel
        icon={<FaClock />}
        heading="This lecture isn't available yet"
        actions={
          <Link to="/lists" className="btn-secondary">
            Back to lectures
          </Link>
        }
      >
        <p>
          {otherLecturesReady
            ? "The video is still being prepared. Other lectures in this chapter are ready to watch."
            : "This lecture is still being produced."}
        </p>
      </PlayerStatusPanel>
    );
  }

  return (
    <div className="min-h-screen bg-surface-sunken px-4 py-6 md:px-8 md:py-8">
      {schoolVideoCreatorEnabled && (
        <motion.button
          type="button"
          onClick={openLectureCreator}
          whileHover={{ y: -3, scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="fixed bottom-6 right-4 z-40 flex items-center gap-3 rounded-full border border-line bg-surface-raised px-4 py-3 text-ink shadow-e4 md:bottom-8 md:right-8"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-brand-fg">
            <FaRobot />
          </span>
          <span className="text-left">
            <span className="block text-micro font-semibold text-brand">AI Video Creator</span>
            <span className="block text-sm font-semibold">{studentName ? `Hey ${studentName}` : "Create a lecture"}</span>
          </span>
        </motion.button>
      )}

      <div className="page-frame">
        <Link
          to="/lists"
          className="-ml-2 inline-flex min-h-touch items-center gap-2 rounded-control px-2 text-sm font-medium text-ink-muted transition-colors duration-fast ease-brand hover:text-ink"
        >
          <FaArrowLeft aria-hidden="true" /> Back to lectures
        </Link>

        <header className="mt-2">
          {breadcrumb.length > 0 && (
            <p className="text-sm text-ink-subtle">
              {breadcrumb.map((part, index) => (
                <span key={`${part}-${index}`}>
                  {index > 0 && <span aria-hidden="true" className="mx-1.5">›</span>}
                  {part}
                </span>
              ))}
            </p>
          )}
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink text-balance md:text-3xl">
            {displayTitle}
          </h1>
          {(displayDuration || located.index >= 0) && (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums text-ink-muted">
              {displayDuration && (
                <span className="inline-flex items-center gap-1.5">
                  <FaClock aria-hidden="true" className="text-xs text-ink-subtle" />
                  <span className="sr-only">Duration</span>
                  {displayDuration}
                </span>
              )}
              {located.index >= 0 && (
                <span>
                  Lecture {located.index + 1} of {located.videos.length}
                </span>
              )}
            </p>
          )}
        </header>

        <MotionDiv
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className={`mt-5 grid items-start gap-6 ${
            loading || showRail ? "lg:grid-cols-[minmax(0,1fr)_360px]" : "max-w-5xl"
          }`}
        >
          {loading ? (
            <VideoPageSkeleton />
          ) : (
            <section className="card min-w-0 p-3 md:p-5" aria-label="Lecture player">
              {player}

              {resumedFrom > 0 && (
                <div
                  className="mt-3 flex flex-wrap items-center gap-3 rounded-control bg-brand-soft px-4 py-2.5 text-sm text-ink"
                  role="status"
                >
                  <span>
                    Resumed from{" "}
                    <strong className="font-semibold tabular-nums">{formatClock(resumedFrom)}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (videoRef.current) videoRef.current.currentTime = 0;
                      setResumedFrom(0);
                    }}
                    className="min-h-touch font-semibold text-brand underline underline-offset-2"
                  >
                    Start from beginning
                  </button>
                </div>
              )}

              {/* Nothing to mark or tune when there is no video to watch. */}
              {!loadError && parsed.type !== "none" && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  {data.videoId ? (
                    isWatched ? (
                      <div
                        className="inline-flex min-h-touch items-center gap-1 rounded-control bg-positive-soft pl-4 pr-1 text-sm font-semibold text-ink"
                        role="status"
                      >
                        <FaCheckCircle aria-hidden="true" className="text-positive" />
                        <span className="ml-1">Watched</span>
                        <span aria-hidden="true" className="mx-1 text-ink-subtle">·</span>
                        <button
                          type="button"
                          onClick={handleUnwatched}
                          className="min-h-touch rounded-control px-3 font-semibold text-ink-muted underline underline-offset-2 transition-colors duration-fast ease-brand hover:text-ink"
                        >
                          Undo
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={handleWatched} className="btn-secondary">
                        <FaCheckCircle aria-hidden="true" className="text-ink-subtle" />
                        Mark as watched
                      </button>
                    )
                  ) : (
                    <span />
                  )}

                  {/* In-player speed control, native player only; YouTube
                      and Vimeo expose their own. */}
                  {parsed.type === "file" && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span id="speed-label" className="text-sm text-ink-subtle">
                        Speed
                      </span>
                      <div
                        role="group"
                        aria-labelledby="speed-label"
                        className="inline-flex overflow-hidden rounded-control border border-line"
                      >
                        {SPEED_STEPS.map((rate) => {
                          const isActive = activeRate === rate;
                          return (
                            <button
                              key={rate}
                              type="button"
                              aria-pressed={isActive}
                              onClick={() => setActiveRate(rate)}
                              className={`min-h-touch px-2.5 text-sm font-semibold tabular-nums transition-colors duration-fast ease-brand sm:px-3 ${
                                isActive
                                  ? "bg-brand text-brand-fg"
                                  : "bg-surface text-ink-muted hover:bg-surface-sunken"
                              }`}
                            >
                              {rate}&times;
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {parsed.type === "file" && !loadError && !hintDismissed && (
                <div className="mt-3 hidden items-center justify-between gap-3 border-t border-line pt-3 md:flex">
                  <p className="text-mini text-ink-subtle">
                    <span className="font-semibold text-ink-muted">Keyboard:</span>{" "}
                    <Kbd>Space</Kbd> or <Kbd>K</Kbd> play/pause · <Kbd>J</Kbd> <Kbd>L</Kbd> back/forward 10s ·{" "}
                    <Kbd>←</Kbd> <Kbd>→</Kbd> 5s · <Kbd>Shift</Kbd>+<Kbd>&lt;</Kbd> <Kbd>&gt;</Kbd> slower/faster ·{" "}
                    <Kbd>M</Kbd> mute
                  </p>
                  <button
                    type="button"
                    onClick={dismissHint}
                    className="btn-icon text-ink-subtle hover:bg-surface-sunken hover:text-ink"
                    aria-label="Hide keyboard shortcuts"
                  >
                    <FaTimes aria-hidden="true" />
                  </button>
                </div>
              )}
            </section>
          )}

          {loading ? (
            <VideoMetaSkeleton />
          ) : showRail ? (
            <ChapterRail
              subject={located.subject}
              chapter={located.chapter}
              videos={located.videos}
              currentIndex={located.index}
              watchedMap={watchedMap}
              hasSubscription={hasSubscription}
              onNavigate={handleRailNavigate}
            />
          ) : null}
        </MotionDiv>
      </div>

      <AnimatePresence>
        {lectureOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 px-4 py-4 backdrop-blur-sm md:items-center md:py-8"
            onClick={closeLectureCreator}
          >
            <motion.div
              initial={{ y: 36, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="max-h-full w-full max-w-3xl overflow-y-auto rounded-sheet border border-line bg-surface-raised shadow-e5"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ai-creator-heading"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
                <div className="p-5 text-ink md:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-brand">AI Video Creator</p>
                      <h2 id="ai-creator-heading" className="mt-2 text-3xl font-bold leading-tight tracking-tight text-ink">
                        Hey {studentName}
                      </h2>
                      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
                        {lectureGreeting}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeLectureCreator}
                      className="btn-icon border border-line bg-surface text-ink-muted hover:bg-surface-sunken hover:text-ink"
                      aria-label="Close video creator"
                    >
                      <FaTimes />
                    </button>
                  </div>

                  <div className="mt-6 rounded-card border border-line bg-surface p-4">
                    <label htmlFor="ai-lecture-topic" className="label">
                      Topic
                    </label>
                    <input
                      id="ai-lecture-topic"
                      value={lectureTopic}
                      onChange={(e) => setLectureTopic(e.target.value)}
                      placeholder="Type a topic like photosynthesis"
                      className="field mt-2"
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
                      className="btn-primary mt-5 w-full"
                    >
                      <FaRobot aria-hidden="true" />
                      {lectureActive ? "Creating your lecture..." : "Create AI Lecture"}
                    </button>

                    {lectureError && (
                      <p className="mt-3 rounded-control border border-critical/35 bg-critical-soft px-4 py-3 text-sm text-critical" role="alert">
                        {lectureError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-line bg-surface-sunken p-5 md:border-l md:border-t-0 md:p-7">
                  {lectureActive ? (
                    <AiLectureLoader progress={lectureProgress} topic={lectureTopic} />
                  ) : lectureResult ? (
                    <div className="rounded-card border border-line bg-surface p-4 shadow-e2">
                      <p className="text-sm font-semibold text-positive">Delivered to chat</p>
                      <h3 className="mt-2 text-2xl font-bold tracking-tight text-ink">{lectureResult.title || lectureTopic}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                        Your AI lecture is now saved in the chat thread and can be replayed anytime.
                      </p>
                      <video
                        className="mt-4 w-full rounded-control border border-line bg-black aspect-video"
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
                          className="btn-primary"
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
                          className="btn-secondary"
                        >
                          Create another
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full min-h-[360px] flex-col justify-between gap-6 rounded-card border border-dashed border-line-strong bg-surface p-5">
                      <div>
                        <p className="text-sm font-semibold text-ink-subtle">Ready when you are</p>
                        <h3 className="mt-2 text-2xl font-bold tracking-tight text-ink">
                          Type a topic and I will build a mini lecture video
                        </h3>
                        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                          Try topics like photosynthesis, chlorophyll, bacteria, digestion, or the human heart.
                        </p>
                      </div>

                      <div className="rounded-control bg-surface-sunken p-4">
                        <p className="text-sm font-semibold text-ink">What happens next?</p>
                        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-muted">
                          <li>I turn your topic into a kid-friendly AI lecture.</li>
                          <li>You see a progress animation while the video is prepared.</li>
                          <li>The finished video is sent to your chat thread.</li>
                        </ol>
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

function Kbd({ children }) {
  return (
    <kbd className="rounded-control border border-line bg-surface-sunken px-1 font-sans text-micro font-semibold text-ink-muted">
      {children}
    </kbd>
  );
}

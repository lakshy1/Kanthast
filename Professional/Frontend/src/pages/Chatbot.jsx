import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import Markdown from "../components/Markdown";
import { Modal, Button } from "../components/ui";
import { useNetwork } from "../hooks/useNetwork";
import {
  FaBars,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPlay,
  FaPaperPlane,
  FaPaperclip,
  FaPlus,
  FaRedo,
  FaRegCircle,
  FaRobot,
  FaTimes,
  FaTrash,
  FaUser,
} from "react-icons/fa";
import {
  createChatSession,
  deleteChatSession,
  getChatHistory,
  sendChatMessage,
  uploadChatFile,
} from "../utils/authApi";

// The assistant answers medical questions AND platform questions, so the
// starters lead with study prompts and keep one account/playback prompt.
const SUGGESTIONS = [
  { label: "Explain the mechanism of statins", text: "Explain the mechanism of action of statins." },
  { label: "Mnemonic for thiamine deficiency signs", text: "Give me a mnemonic for the signs of thiamine deficiency." },
  { label: "Difference between Wernicke and Korsakoff", text: "What is the difference between Wernicke encephalopathy and Korsakoff syndrome?" },
  { label: "Why is a video locked?", text: "My video is locked. What subscription is needed?" },
];

const NETWORK_MESSAGE = "We couldn't reach the assistant. Check your connection and try again.";
const RATE_LIMIT_MESSAGE = "You're sending messages quickly — wait a few seconds and try again.";

// Turns whatever the API layer threw into something a student can act on.
// fetch() rejects with a TypeError ("Failed to fetch" / "NetworkError…" /
// "Load failed") when the server is unreachable; the backend's rate limiter
// replies "Too many chat requests. Try again in N seconds."
function describeError(err, fallback) {
  const raw = String(err?.message || "");
  if (
    err instanceof TypeError ||
    /failed to fetch|networkerror|load failed|network request failed/i.test(raw)
  ) {
    return { kind: "network", text: NETWORK_MESSAGE };
  }
  if (/too many chat requests/i.test(raw)) return { kind: "rate", text: RATE_LIMIT_MESSAGE };
  if (/session expired|login required/i.test(raw)) return { kind: "auth", text: raw };
  return { kind: "server", text: fallback };
}

const CONNECTION = {
  idle: {
    label: "Ready",
    short: "Ready",
    Icon: FaRegCircle,
    className: "text-ink-muted bg-surface-sunken border-line",
  },
  online: {
    label: "Online",
    short: "Online",
    Icon: FaCheckCircle,
    className: "text-positive bg-positive-soft border-positive/35",
  },
  down: {
    label: "Can't reach the assistant",
    short: "Can't connect",
    Icon: FaExclamationTriangle,
    className: "text-critical bg-critical-soft border-critical/35",
  },
};

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

function isVideoMessage(msg = {}) {
  return Boolean(msg.mediaUrl && String(msg.mediaType || "").startsWith("video"));
}

function VideoMessageCard({ msg }) {
  return (
    <div className="mb-3 overflow-hidden rounded-card border border-line bg-surface-sunken">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div>
          <p className="text-micro font-semibold text-ink-subtle">AI video lecture</p>
          <h3 className="mt-1 text-sm font-bold text-ink">
            {msg.topic || "Your lesson"}
          </h3>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-micro font-semibold text-brand">
          <FaPlay size={9} aria-hidden="true" />
          Playable
        </div>
      </div>
      <div className="p-3">
        <video
          className="w-full rounded-control border border-line bg-black aspect-video"
          controls
          playsInline
          preload="metadata"
          poster={msg.thumbnailUrl || ""}
          src={msg.mediaUrl || ""}
        >
          Your browser does not support video playback.
        </video>
        {msg.caption && <p className="mt-3 text-sm text-ink-muted">{msg.caption}</p>}
      </div>
    </div>
  );
}

// ─── Typing indicator ──────────────────────────────────────────────────────
// A calm staggered opacity pulse (Tailwind's animate-pulse) rather than
// bouncing dots. Reduced motion stops it entirely; the dots stay visible and
// the sr-only text carries the meaning.
function TypingDots() {
  return (
    <div className="flex justify-start px-4 md:px-6 py-1" role="status" aria-live="polite">
      <div className="flex items-center gap-1.5 bg-surface border border-line shadow-e1 rounded-card rounded-tl-sm px-4 py-3">
        {[0, 300, 600].map((delay) => (
          <span
            key={delay}
            aria-hidden="true"
            className="w-2 h-2 rounded-full bg-ink-subtle animate-pulse motion-reduce:animate-none"
            style={{ animationDelay: `${delay}ms`, animationDuration: "1.6s" }}
          />
        ))}
        <span className="sr-only">The assistant is writing a reply…</span>
      </div>
    </div>
  );
}

// ─── Sidebar content (shared between desktop and mobile drawer) ────────────
// The history rail is a navy stage in both themes, so it keeps its on-navy
// white-alpha palette; only the brand mark moves to tokens.
function SidebarContent({ sessions, activeSessionId, onLoad, onNew, onDelete, onClose }) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand + close (mobile) */}
      <div className="flex items-center justify-between p-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-control bg-brand flex items-center justify-center">
            <FaRobot className="text-brand-fg text-sm" aria-hidden="true" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">Kanthast Assistant</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="h-touch w-touch rounded-control text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
            aria-label="Close sidebar"
          >
            <FaTimes size={14} />
          </button>
        )}
      </div>

      {/* New chat */}
      <div className="px-3 pb-4 flex-shrink-0">
        <button
          onClick={onNew}
          className="w-full min-h-touch flex items-center gap-2 px-4 py-2.5 rounded-control bg-white/10 hover:bg-white/18 border border-white/10 text-white/90 text-sm font-medium transition group"
        >
          <FaPlus size={11} className="group-hover:rotate-90 transition-transform duration-200" aria-hidden="true" />
          New conversation
        </button>
      </div>

      <div className="px-4 pb-2 flex-shrink-0">
        <p className="text-micro font-semibold uppercase tracking-[0.12em] text-slate-400">Recent</p>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5" style={{ scrollbarWidth: "none" }}>
        {sessions.length === 0 && (
          <p className="text-slate-400 text-xs px-3 py-2">No conversations yet.</p>
        )}
        {sessions.map((session) => {
          const active = activeSessionId === session.sessionId;
          return (
            <div
              key={session.sessionId}
              className={`group relative rounded-control transition-all duration-150 ${
                active ? "bg-white/15" : "hover:bg-white/8"
              }`}
            >
              <button
                onClick={() => onLoad(session.sessionId)}
                aria-current={active ? "true" : undefined}
                className="w-full text-left px-3 py-2.5 pr-12 rounded-control"
              >
                <p className={`text-sm truncate font-medium leading-snug ${active ? "text-white" : "text-slate-300"}`}>
                  {session.title || "New Chat"}
                </p>
                <p className="text-micro text-slate-400 mt-0.5 truncate">
                  {session.preview || formatTime(session.lastMessageAt) || "No messages yet"}
                </p>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(session.sessionId); }}
                className="absolute right-0 top-1/2 -translate-y-1/2 h-touch w-touch rounded-control text-slate-400 hover:text-red-300 hover:bg-red-400/10 flex items-center justify-center transition"
                title="Delete conversation"
                aria-label={`Delete conversation ${session.title || "New Chat"}`}
              >
                <FaTrash size={10} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Custom scrollbar ─────────────────────────────────────────────────────
function useCustomScrollbar(elRef) {
  const thumbRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const updateThumb = () => {
      const thumb = thumbRef.current;
      if (!thumb) return;
      const ratio = el.clientHeight / el.scrollHeight;
      if (ratio >= 1) { setVisible(false); return; }
      const thumbH = Math.max(ratio * el.clientHeight, 28);
      const maxScroll = el.scrollHeight - el.clientHeight;
      const thumbTop = maxScroll > 0 ? (el.scrollTop / maxScroll) * (el.clientHeight - thumbH) : 0;
      thumb.style.height = thumbH + "px";
      thumb.style.top = thumbTop + "px";
    };

    const onScroll = () => {
      updateThumb();
      setVisible(true);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setVisible(false), 1500);
    };

    updateThumb();
    el.addEventListener("scroll", onScroll);
    const ro = new ResizeObserver(updateThumb);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [elRef]);

  return { thumbRef, visible };
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function Chatbot() {
  const token = localStorage.getItem("kanthastToken");
  const location = useLocation();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  // { text, kind, retry? } — kind drives nothing visual beyond the copy; retry
  // is the action behind the "Try again" button when one makes sense.
  const [error, setError] = useState(null);
  const [status, setStatus] = useState("loading");
  // Result of the last request: "idle" before any, "online" after a success,
  // "down" after a network failure. The pill used to read "Online" whatever
  // happened, including while every request was failing to fetch.
  const [connection, setConnection] = useState("idle");
  // Bumped by "Try again" on a failed initial load to re-run the loader.
  const [reloadKey, setReloadKey] = useState(0);
  // True when a reply arrived while the user was scrolled up reading history.
  const [hasUnreadBelow, setHasUnreadBelow] = useState(false);
  // Session id staged for deletion; drives the confirmation Modal.
  const [pendingDelete, setPendingDelete] = useState(null);
  const { offline } = useNetwork();
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [uploadNotice, setUploadNotice] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fileInputRef = useRef(null);
  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const noticeTimer = useRef(null);

  const { thumbRef, visible: scrollbarVisible } = useCustomScrollbar(listRef);

  // Records the outcome of a request for the header status pill. Only an
  // unreachable server counts as "down": a rate limit or a server error still
  // proves the assistant answered.
  const noteSuccess = () => setConnection("online");
  const noteFailure = (err, fallback, retry = null) => {
    const described = describeError(err, fallback);
    if (described.kind === "network") setConnection("down");
    else setConnection("online");
    setError({ ...described, retry: described.kind === "auth" ? null : retry });
    return described;
  };

  // Clear the "new message" pill once the user scrolls back down themselves.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return undefined;

    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceFromBottom < 120) setHasUnreadBelow(false);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Prevent the page from scrolling behind the chatbot (fixes keyboard-scroll on mobile)
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }, [input]);

  // Load initial chat
  useEffect(() => {
    let mounted = true;
    if (!token) {
      setStatus("error");
      setError({ kind: "auth", text: "Log in to use the assistant.", retry: null });
      return undefined;
    }
    const querySessionId = new URLSearchParams(location.search).get("sessionId") || "";
    (async () => {
      try {
        const data = await getChatHistory(token, querySessionId);
        if (!mounted) return;
        setSessions(data.sessions || []);
        setMessages(data.messages || []);
        setActiveSessionId(data.currentSessionId || "");
        setStatus("ready");
        setError(null);
        setConnection("online");
      } catch (err) {
        if (!mounted) return;
        setStatus("error");
        const described = describeError(err, "We couldn't load your conversations. Try again in a moment.");
        setConnection(described.kind === "network" ? "down" : "online");
        setError({
          ...described,
          retry: described.kind === "auth" ? null : () => {
            setError(null);
            setStatus("loading");
            setReloadKey((k) => k + 1);
          },
        });
      }
    })();
    return () => { mounted = false; };
  }, [token, location.search, reloadKey]);

  // Scroll to bottom on new message — but only if the user is already near the
  // bottom. Previously this fired unconditionally, so scrolling up to re-read
  // an earlier answer yanked you back down on every status change.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom < 120;

    if (isNearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      setHasUnreadBelow(true);
    }
  }, [messages, status]);

  useEffect(() => () => { if (noticeTimer.current) clearTimeout(noticeTimer.current); }, []);

  const displayedSessions = useMemo(() => [...sessions].reverse(), [sessions]);
  const canSend = useMemo(
    () => input.trim().length > 0 && status !== "sending" && !uploading,
    [input, status, uploading]
  );

  const showNotice = (type, message) => {
    setUploadNotice({ type, message });
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setUploadNotice(null), 2600);
  };

  const loadSession = async (sessionId) => {
    if (!token || !sessionId) return;
    setStatus("loadingSession");
    setError(null);
    try {
      const data = await getChatHistory(token, sessionId);
      setSessions(data.sessions || []);
      setMessages(data.messages || []);
      setActiveSessionId(data.currentSessionId || sessionId);
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setStatus("ready");
      setSidebarOpen(false);
      noteSuccess();
    } catch (err) {
      setStatus("ready");
      noteFailure(err, "We couldn't open that conversation. Try again in a moment.", () => loadSession(sessionId));
    }
  };

  const handleNewChat = async () => {
    if (!token) return;
    setError(null);
    try {
      const data = await createChatSession(token);
      setSessions(data.sessions || []);
      setActiveSessionId(data.currentSessionId || data.session?.sessionId || "");
      setMessages(data.messages || []);
      setAttachment(null);
      setInput("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSidebarOpen(false);
      setStatus("ready");
      noteSuccess();
    } catch (err) {
      noteFailure(err, "We couldn't start a new conversation. Try again in a moment.", handleNewChat);
    }
  };

  // Two-step: the row's delete button sets pendingDelete, which opens the
  // shared Modal. window.confirm was inconsistent with every other surface and
  // is unstyleable.
  const handleDeleteSession = async (sessionId) => {
    if (!token || !sessionId) return;
    setPendingDelete(null);
    setError(null);
    try {
      const data = await deleteChatSession(token, sessionId, activeSessionId);
      setSessions(data.sessions || []);
      setActiveSessionId(data.currentSessionId || "");
      setMessages(data.messages || []);
      if (activeSessionId === sessionId) {
        setAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
      noteSuccess();
    } catch (err) {
      noteFailure(err, "We couldn't delete that conversation. Try again in a moment.", () => handleDeleteSession(sessionId));
    }
  };

  // `retry` resends the message whose bubble is already on screen (marked
  // "Not sent") instead of appending a duplicate.
  const sendMessage = async (overrideText = "", { retry = false } = {}) => {
    const text = (overrideText || input).trim();
    if (!text || !token || status === "sending") return;
    setStatus("sending");
    setError(null);
    if (retry) {
      setMessages((prev) => prev.map((m) => (m.failed ? { ...m, failed: false } : m)));
    } else {
      setMessages((prev) => [...prev, {
        role: "user", content: text,
        fileName: attachment?.fileName || "", fileUrl: attachment?.fileUrl || "",
        createdAt: new Date().toISOString(),
      }]);
      setInput("");
    }
    try {
      const data = await sendChatMessage(token, {
        message: text, fileUrl: attachment?.fileUrl || "",
        fileName: attachment?.fileName || "", sessionId: activeSessionId,
      });
      setSessions(data.sessions || []);
      setMessages(data.messages || []);
      setActiveSessionId(data.currentSessionId || data.sessionId || activeSessionId);
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setStatus("ready");
      noteSuccess();
    } catch (err) {
      setStatus("ready");
      // Mark the optimistic bubble so it doesn't pose as delivered.
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i -= 1) {
          if (next[i].role === "user") { next[i] = { ...next[i], failed: true }; break; }
        }
        return next;
      });
      noteFailure(
        err,
        "The assistant couldn't answer just now. Try again in a moment.",
        () => sendMessage(text, { retry: true })
      );
    }
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    setError(null);
    showNotice("loading", `Uploading ${file.name}…`);
    try {
      const data = await uploadChatFile(token, file);
      setAttachment({ fileUrl: data.fileUrl, fileName: data.fileName });
      showNotice("success", `Attached: ${data.fileName || file.name}`);
      noteSuccess();
    } catch (err) {
      const described = noteFailure(err, "That file didn't upload. Try again, or pick a smaller file.");
      showNotice("error", described.text);
    } finally {
      setUploading(false);
    }
  };

  const isIdle = status !== "loading" && status !== "loadingSession";
  const conn = CONNECTION[offline ? "down" : connection];
  const ConnIcon = conn.Icon;

  return (
    // Height fills the viewport below the navbar. On phones the fixed bottom
    // dock takes another 4rem; from md there is no dock, so --chat-dock drops
    // to 0. (This used an inline height that overrode the md: class, leaving a
    // 4rem gap on desktop through which the site footer showed.)
    <div
      className="flex bg-surface-sunken overflow-hidden md:[--chat-dock:0px]"
      style={{
        height:
          "calc(100dvh - var(--navbar-h, 4rem) - var(--chat-dock, calc(4rem + env(safe-area-inset-bottom))))",
      }}
    >
      {/* ── Desktop sidebar ── */}
      <div className="hidden lg:flex w-64 xl:w-72 flex-col bg-slate-950 border-r border-slate-800 flex-shrink-0">
        <SidebarContent
          sessions={displayedSessions}
          activeSessionId={activeSessionId}
          onLoad={loadSession}
          onNew={handleNewChat}
          onDelete={(id) => setPendingDelete(id)}
        />
      </div>

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface-sunken">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-line bg-surface flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden h-touch w-touch -ml-2 rounded-control text-ink-muted hover:text-ink hover:bg-surface-sunken flex items-center justify-center transition flex-shrink-0"
            aria-label="Open conversation history"
          >
            <FaBars size={16} />
          </button>

          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-control bg-brand flex items-center justify-center flex-shrink-0">
              <FaRobot className="text-brand-fg text-xs" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-ink text-sm md:text-base leading-tight truncate">Kanthast Assistant</h1>
              <p className="text-micro text-ink-subtle leading-tight truncate">
                Ask about a medical concept or about using Kanthast.
              </p>
            </div>
          </div>

          {/* Reflects the outcome of the last request (and device offline
              state), with an icon and words so it isn't colour-only. */}
          <div
            role="status"
            aria-live="polite"
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full font-medium flex-shrink-0 border ${conn.className}`}
          >
            <ConnIcon aria-hidden="true" size={11} />
            <span className="sm:hidden">{conn.short}</span>
            <span className="hidden sm:inline">{conn.label}</span>
          </div>
        </div>

        {/* Messages */}
        <div className="relative flex-1 min-h-0">
        <div
          ref={listRef}
          className="h-full overflow-y-auto py-6 space-y-1 no-scrollbar"
        >
          {(status === "loading" || status === "loadingSession") && (
            <div className="flex items-center justify-center h-full gap-3 text-ink-muted" role="status">
              <span className="w-5 h-5 rounded-full border-2 border-line-strong border-t-brand animate-spin" aria-hidden="true" />
              <span className="text-sm">{status === "loading" ? "Loading conversations…" : "Loading messages…"}</span>
            </div>
          )}

          {/* Empty state */}
          {messages.length === 0 && isIdle && (
            <Motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center h-full px-6 text-center"
            >
              <div className="mb-5 w-16 h-16 rounded-card bg-brand-soft border border-brand/20 flex items-center justify-center">
                <FaRobot className="text-brand text-2xl" aria-hidden="true" />
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-ink mb-2 tracking-tight">How can I help?</h2>
              <p className="text-ink-muted text-sm max-w-sm leading-relaxed">
                Ask me to explain a mechanism, check a mnemonic or compare two
                conditions — or for help with your account and videos.
              </p>
            </Motion.div>
          )}

          {/* Message list */}
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            // Pass the assistant's RAW text through — <Markdown> parses it.
            // This used to run renderContent() first, which stripped the very
            // syntax the renderer needs, so headings/bold/code never rendered.
            const content = msg.content;
            return (
              <Motion.div
                key={`${msg.createdAt || idx}-${idx}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 px-4 md:px-6 py-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-xs ${
                  isUser ? "bg-ink text-ink-inverse" : "bg-brand text-brand-fg"
                }`} aria-hidden="true">
                  {isUser ? <FaUser size={10} /> : <FaRobot size={10} />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[78%] md:max-w-[70%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  {/* Hierarchy: the assistant's ANSWER carries the visual
                      weight (raised surface + shadow); the user's own message
                      sits quieter on a sunken fill. */}
                  <div className={`px-4 py-3 rounded-card text-sm leading-relaxed ${
                    isUser
                      ? `bg-surface text-ink border rounded-tr-sm ${msg.failed ? "border-critical/35" : "border-line"}`
                      : "bg-surface text-ink border border-line shadow-e2 rounded-tl-sm"
                  }`}>
                    {!isUser && isVideoMessage(msg) ? (
                      <VideoMessageCard msg={msg} />
                    ) : isUser ? (
                      <span className="whitespace-pre-wrap">{content}</span>
                    ) : (
                      <Markdown>{content}</Markdown>
                    )}
                    {msg.fileUrl && (
                      <a
                        href={msg.fileUrl} target="_blank" rel="noreferrer"
                        className="text-xs mt-2 flex items-center gap-1.5 underline underline-offset-2 text-brand"
                      >
                        <FaPaperclip size={10} aria-hidden="true" />
                        {msg.fileName || "Attachment"}
                      </a>
                    )}
                  </div>
                  <p className="text-micro text-ink-subtle px-1">
                    {isUser ? "You" : "Assistant"} · {formatTime(msg.createdAt)}
                    {msg.failed && (
                      <span className="text-critical font-semibold"> · Not sent</span>
                    )}
                  </p>
                </div>
              </Motion.div>
            );
          })}

          {/* Typing indicator */}
          {status === "sending" && <TypingDots />}
        </div>

        {/* Jump to latest — shown only when a reply landed off-screen, so the
            user is never stranded above a new answer. */}
        {hasUnreadBelow && (
          <button
            type="button"
            onClick={() => {
              listRef.current?.scrollTo({
                top: listRef.current.scrollHeight,
                behavior: "smooth",
              });
              setHasUnreadBelow(false);
            }}
            className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 inline-flex items-center gap-2
                       rounded-full bg-brand px-4 py-2.5 text-sm font-semibold text-brand-fg shadow-glow-brand
                       transition-colors duration-fast ease-brand hover:bg-brand-hover"
          >
            New message
            <span aria-hidden="true">↓</span>
          </button>
        )}

        {/* Custom scrollbar overlay */}
        <div
          className="absolute right-1 top-2 bottom-2 w-1.5 rounded-full pointer-events-none transition-opacity duration-300"
          style={{ opacity: scrollbarVisible ? 1 : 0 }}
        >
          <div ref={thumbRef} className="absolute w-full rounded-full bg-ink-subtle/45" />
        </div>
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-line bg-surface px-4 md:px-6 pt-3 pb-7 md:pb-4">

          {/* Quick suggestion pills — shown only on empty chat */}
          {messages.length === 0 && isIdle && (
            <div className="flex gap-2 mb-3 w-full overflow-x-auto no-scrollbar" aria-label="Suggested questions">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.text}
                  type="button"
                  onClick={() => sendMessage(s.text)}
                  className="flex-shrink-0 min-h-touch flex items-center justify-center px-4 py-2 rounded-full border border-line bg-surface text-xs font-medium text-ink-muted whitespace-nowrap transition-colors duration-fast ease-brand hover:border-brand/45 hover:bg-brand-soft hover:text-ink"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}

          {/* Attachment preview */}
          {attachment && (
            <div className="mb-3 flex items-center gap-2 bg-brand-soft border border-brand/35 rounded-control pl-3 text-sm text-ink">
              <FaPaperclip size={12} className="text-brand flex-shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate font-medium">{attachment.fileName}</span>
              <button
                type="button"
                onClick={() => {
                  setAttachment(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  showNotice("success", "Attachment removed");
                }}
                className="h-touch w-touch rounded-control text-ink-muted hover:text-ink hover:bg-brand/15 flex items-center justify-center transition"
                aria-label={`Remove attachment ${attachment.fileName}`}
              >
                <FaTimes size={11} />
              </button>
            </div>
          )}

          {uploading && (
            <div className="mb-3 flex items-center gap-2 bg-surface-sunken border border-line rounded-control px-3 py-2 text-sm text-ink-muted" role="status">
              <span className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin flex-shrink-0" aria-hidden="true" />
              Uploading file…
            </div>
          )}

          {/* Input box */}
          <div className="relative flex items-end gap-1 bg-surface border border-line-strong rounded-card focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 transition-colors duration-fast">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex-shrink-0 h-touch w-touch m-0.5 self-end rounded-control text-ink-subtle hover:text-ink hover:bg-surface-sunken flex items-center justify-center transition disabled:cursor-not-allowed"
              aria-label="Attach a file"
            >
              <FaPaperclip size={15} className={uploading ? "animate-pulse" : ""} />
            </button>
            <input ref={fileInputRef} type="file" className="hidden" onChange={onFileChange} tabIndex={-1} />

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask the Kanthast Assistant"
              aria-label="Message the assistant"
              className="flex-1 bg-transparent text-ink placeholder:text-ink-subtle text-sm py-3 outline-none focus-visible:!outline-none resize-none leading-relaxed"
              rows={1}
              style={{ maxHeight: 180, overflowY: "auto" }}
            />

            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={!canSend}
              className="flex-shrink-0 h-touch w-touch rounded-control bg-brand text-brand-fg flex items-center justify-center hover:bg-brand-hover transition-colors duration-fast ease-brand self-end m-0.5 disabled:bg-disabled disabled:text-disabled-fg disabled:cursor-not-allowed"
              aria-label="Send message"
              title="Send"
            >
              <FaPaperPlane size={12} />
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-2 flex items-center gap-2 rounded-control border border-critical/35 bg-critical-soft pl-3 text-sm text-critical"
            >
              <FaExclamationTriangle size={12} className="flex-shrink-0" aria-hidden="true" />
              <p className="flex-1 py-2.5 leading-snug">{error.text}</p>
              {error.retry && (
                <button
                  type="button"
                  onClick={error.retry}
                  disabled={status === "sending"}
                  className="flex-shrink-0 min-h-touch inline-flex items-center gap-1.5 rounded-control px-3 font-semibold text-critical hover:bg-critical/12 transition-colors duration-fast disabled:cursor-not-allowed"
                >
                  <FaRedo size={10} aria-hidden="true" />
                  Try again
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile sidebar drawer ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <Motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
            <Motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="absolute left-0 top-0 h-full w-72 bg-slate-950 shadow-e5"
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent
                sessions={displayedSessions}
                activeSessionId={activeSessionId}
                onLoad={loadSession}
                onNew={handleNewChat}
                onDelete={(id) => setPendingDelete(id)}
                onClose={() => setSidebarOpen(false)}
              />
            </Motion.div>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* ── Upload toast ── */}
      <AnimatePresence>
        {uploadNotice && (
          <Motion.div
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            className={`fixed bottom-24 md:bottom-6 right-4 md:right-5 z-[60] rounded-card border px-4 py-3 text-sm font-medium shadow-e4 flex items-center gap-2 ${
              uploadNotice.type === "success"
                ? "bg-positive-soft text-positive border-positive/35"
                : uploadNotice.type === "error"
                ? "bg-critical-soft text-critical border-critical/35"
                : "bg-surface-raised text-ink-muted border-line"
            }`}
          >
            {uploadNotice.type === "loading" && (
              <span className="w-4 h-4 rounded-full border-2 border-line-strong border-t-transparent animate-spin" aria-hidden="true" />
            )}
            {uploadNotice.type === "success" && <FaCheckCircle size={12} aria-hidden="true" />}
            {uploadNotice.type === "error" && <FaExclamationTriangle size={12} aria-hidden="true" />}
            {uploadNotice.message}
          </Motion.div>
        )}
      </AnimatePresence>

      <Modal
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Delete this conversation?"
        description="This removes the conversation and its messages permanently. It can't be undone."
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Keep it
            </Button>
            <Button variant="danger" onClick={() => handleDeleteSession(pendingDelete)}>
              Delete conversation
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-muted">
          You&apos;ll lose the full history of this chat, including any files you
          shared in it.
        </p>
      </Modal>
    </div>
  );
}

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Markdown from "../components/Markdown";
import { Modal, Button } from "../components/ui";
import { Accent } from "../components/ui/Brandmarks";
import {
  FiCpu, FiArrowUpRight, FiSearch, FiCopy, FiCheck,
  FiVolume2, FiVolumeX, FiX, FiSidebar
} from "react-icons/fi";
import {
  FaBars,
  FaCheckCircle,
  FaComments,
  FaExclamationTriangle,
  FaPlay,
  FaPaperPlane,
  FaPaperclip,
  FaPlus,
  FaRedo,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import {
  createChatSession,
  deleteChatSession,
  getChatHistory,
  sendChatMessage,
  uploadChatFile,
} from "../utils/authApi";
import { DRAFT_KEY, draftFromChat, getAiQuota } from "../utils/doubtsApi";
import {
  STALE_MS,
  dedupeRequest,
  getAskCache,
  isFresh,
  patchAskCache,
  setAskSessionMessages,
} from "../utils/doubtsStore";

// The assistant answers school-subject questions AND platform questions, so the
// starters lead with study prompts and keep one account/playback prompt.
const SUGGESTIONS = [
  { tag: "Physics", label: "Explain Ohm's law simply", text: "Explain Ohm's law in simple words with an example." },
  { tag: "Maths", label: "Solve a quadratic equation", text: "What are the steps to solve a quadratic equation?" },
  { tag: "History", label: "Causes of the French Revolution", text: "Summarise the main causes of the French Revolution." },
  { tag: "Help", label: "Why is a lesson locked?", text: "My lesson is locked. What subscription is needed?" },
];

const RAIL_KEY = "kanthastChatRail";
function readRailOpen() {
  try {
    return localStorage.getItem(RAIL_KEY) !== "0";
  } catch {
    return true;
  }
}

// "hint" nudges the student toward the answer; "full" explains it. Sent with
// every message and remembered on this device.
const MODE_KEY = "kanthastChatMode";
const MODES = [
  { value: "hint", label: "Hint" },
  { value: "full", label: "Full answer" },
];
function readMode() {
  try {
    return localStorage.getItem(MODE_KEY) === "hint" ? "hint" : "full";
  } catch {
    return "full";
  }
}

// Same words as the server's 429, for when the allowance alone says none are left.
const AI_LIMIT_MESSAGE = "You have used today's AI messages. They reset at midnight.";

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

// Ask AI panel sizing (see the measuring effect in Chatbot).
const MIN_PANEL = 420;
const PANEL_GAP_DESKTOP = 12;
const PANEL_GAP_PHONE = 12;
const DOCK_PX = 64; // the phone bottom dock, 4rem (the CSS adds the safe area)

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
    <div className="mx-auto w-full max-w-3xl px-4 py-2 md:px-6" role="status" aria-live="polite">
      <div className="flex items-center gap-1.5 py-2">
        {[0, 300, 600].map((delay) => (
          <span
            key={delay}
            aria-hidden="true"
            className="h-1.5 w-1.5 rounded-full bg-ink-subtle animate-pulse motion-reduce:animate-none"
            style={{ animationDelay: `${delay}ms`, animationDuration: "1.6s" }}
          />
        ))}
        <span className="sr-only">The assistant is writing a reply…</span>
      </div>
    </div>
  );
}

// ─── Conversation rail (desktop) and drawer (phone and tablet) ────────────
function ConversationRail({ sessions, activeSessionId, onLoad, onNew, onDelete, onClose, onCollapse }) {
  const [query, setQuery] = useState("");
  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) =>
      `${s.title || ""} ${s.preview || ""}`.toLowerCase().includes(q)
    );
  }, [sessions, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-shrink-0 items-center gap-1.5 p-3 pb-2">
        <button
          type="button"
          onClick={onNew}
          className="inline-flex min-h-[38px] flex-1 items-center gap-2 rounded-control border border-line bg-surface px-3 text-xs font-bold text-ink shadow-e1 transition-all duration-fast ease-brand hover:border-brand/40 active:scale-[0.98]"
        >
          <FaPlus size={10} className="text-brand" aria-hidden="true" />
          New chat
        </button>
        {(onClose || onCollapse) && (
          <button
            type="button"
            onClick={onClose || onCollapse}
            className="flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-control text-ink-subtle transition-colors duration-fast hover:bg-surface hover:text-ink"
            aria-label={onClose ? "Close chats" : "Collapse sidebar"}
            title={onClose ? "Close chats" : "Collapse sidebar"}
          >
            {onClose ? <FaTimes size={13} /> : <FiSidebar size={15} />}
          </button>
        )}
      </div>

      {/* Search Chats */}
      {sessions.length > 0 && (
        <div className="px-3 pb-2">
          <div className="relative">
            <FiSearch size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats…"
              aria-label="Search past chats"
              className="h-8 w-full rounded-full border border-line bg-surface pl-8 pr-7 text-xs text-ink placeholder:text-ink-subtle focus:border-brand focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear chat search"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-subtle hover:text-ink"
              >
                <FiX size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      <p className="flex-shrink-0 px-4 pb-1.5 pt-1 text-micro font-bold uppercase tracking-[0.1em] text-ink-subtle">
        Recent {filteredSessions.length > 0 ? `(${filteredSessions.length})` : ""}
      </p>

      <div className="no-scrollbar flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {filteredSessions.length === 0 && (
          <p className="px-2 py-3 text-xs text-ink-subtle">
            {query ? "No matching chats." : "No chats yet."}
          </p>
        )}
        {filteredSessions.map((session) => {
          const active = activeSessionId === session.sessionId;
          return (
            <div
              key={session.sessionId}
              className={`group relative rounded-lg transition-colors duration-fast ${
                active ? "bg-surface text-ink font-semibold" : "hover:bg-surface/60"
              }`}
            >
              <button
                type="button"
                onClick={() => onLoad(session.sessionId)}
                aria-current={active ? "true" : undefined}
                className="w-full rounded-control px-3 py-2.5 pr-10 text-left"
              >
                <p className={`truncate text-sm leading-snug ${active ? "font-bold text-ink" : "font-medium text-ink-muted"}`}>
                  {!session.title || session.title === "New Chat" ? "New chat" : session.title}
                </p>
                <p className="mt-0.5 truncate text-micro text-ink-subtle">
                  {session.preview || formatTime(session.lastMessageAt) || "No messages yet"}
                </p>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(session.sessionId); }}
                className={`absolute right-0 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-control text-ink-subtle transition duration-fast hover:bg-critical-soft hover:text-critical focus-visible:opacity-100 ${
                  active ? "" : "lg:opacity-0 lg:group-hover:opacity-100"
                }`}
                title="Delete conversation"
                aria-label={`Delete conversation ${session.title || "New chat"}`}
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
// Ask AI, rendered by the Doubts page inside its shell (header and tabs).
// `onDraftReady` tells that page a class draft was stored, so its composer
// opens with it.
export default function Chatbot({ onDraftReady }) {
  const token = localStorage.getItem("kanthastSchoolToken");
  const location = useLocation();
  const navigate = useNavigate();

  const initialAsk = getAskCache();
  const initialQuerySid = new URLSearchParams(location.search).get("sessionId") || "";
  const initialSid = initialQuerySid || initialAsk.activeSessionId || "";
  const initialMsgs = initialSid ? initialAsk.messagesBySession?.[initialSid] : null;
  const hasInitialCache = Boolean(token && initialAsk.sessions && Array.isArray(initialMsgs));

  const [sessions, setSessions] = useState(() => initialAsk.sessions || []);
  const [activeSessionId, setActiveSessionId] = useState(() => initialSid);
  const [messages, setMessages] = useState(() => initialMsgs || []);
  // "Ask the AI about this" on a doubt arrives with the question prefilled (not sent);
  // otherwise keep the student's in-progress prompt across module switches.
  const [input, setInput] = useState(() =>
    location.state?.prefill
      ? String(location.state.prefill).slice(0, 4000)
      : String(initialAsk.input || "")
  );
  const [mode, setMode] = useState(readMode);
  // { limit, used, left, paid } from GET /doubts/ai-quota; null until known.
  const [aiQuota, setAiQuota] = useState(() => initialAsk.aiQuota ?? null);
  // Set when the server refuses a send with 429 ai_daily_limit: { message, paid }.
  // The allowance (left === 0) gives the same state without a refused send; see `limit`.
  const [limitHit, setLimitHit] = useState(() => initialAsk.limitHit ?? null);
  const [drafting, setDrafting] = useState(false);
  // { text, kind, retry? } — kind drives nothing visual beyond the copy; retry
  // is the action behind the "Try again" button when one makes sense.
  const [error, setError] = useState(() =>
    token ? null : { kind: "auth", text: "Log in to use the assistant.", retry: null }
  );
  const [status, setStatus] = useState(() => (!token ? "error" : hasInitialCache ? "ready" : "loading"));
  // Bumped by "Try again" on a failed initial load to re-run the loader.
  const [reloadKey, setReloadKey] = useState(0);
  // True when a reply arrived while the user was scrolled up reading history.
  const [hasUnreadBelow, setHasUnreadBelow] = useState(false);
  // Session id staged for deletion; drives the confirmation Modal.
  const [pendingDelete, setPendingDelete] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState(() => initialAsk.attachment ?? null);
  const [uploadNotice, setUploadNotice] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(readRailOpen);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [speakingIdx, setSpeakingIdx] = useState(null);

  const fileInputRef = useRef(null);
  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const noticeTimer = useRef(null);
  const firstScrollRef = useRef(true);

  const { thumbRef, visible: scrollbarVisible } = useCustomScrollbar(listRef);

  // Retain in-progress draft text and pending attachment across module switches.
  useEffect(() => {
    patchAskCache({ input, attachment });
  }, [input, attachment]);

  // Read after every send rather than counting locally: the server does not
  // charge for an empty message or for fixed replies (plans, support and so on).
  const refreshQuota = useCallback(() => {
    dedupeRequest("ai-quota", getAiQuota)
      .then((data) => {
        const ai = data.ai || null;
        setAiQuota(ai);
        const cleared = ai && typeof ai.left === "number" && ai.left > 0;
        if (cleared) setLimitHit(null);
        patchAskCache({ aiQuota: ai, ...(cleared ? { limitHit: null } : {}) });
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    const cached = getAskCache();
    if (cached.aiQuota && isFresh(cached.fetchedAt, STALE_MS.ask)) return;
    refreshQuota();
  }, [refreshQuota]);

  // Use the prefill once: drop it from history so a reload doesn't bring it back.
  const hadPrefill = Boolean(location.state?.prefill);
  useEffect(() => {
    if (!hadPrefill) return;
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    textareaRef.current?.focus();
    // Run once on arrival only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hadPrefill]);

  const chooseMode = (value) => {
    setMode(value);
    try {
      localStorage.setItem(MODE_KEY, value);
    } catch {
      // Storage blocked: the choice still holds for this visit.
    }
  };

  // Turns a failed request into the alert under the input, with a retry
  // where one makes sense.
  const noteFailure = (err, fallback, retry = null) => {
    const described = describeError(err, fallback);
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

  // The panel fills the viewport below the Doubts header and tabs, so the
  // message list scrolls inside it and the input stays pinned. Its top is
  // measured (the header above it is the same on every Doubts page); the
  // height CSS subtracts that, a bottom gap and, below md, the bottom dock.
  // When the viewport is too short for MIN_PANEL the panel keeps that height
  // and the page scrolls instead.
  const panelRef = useRef(null);
  const [panelTop, setPanelTop] = useState(null);
  const [panelFits, setPanelFits] = useState(true);
  useLayoutEffect(() => {
    const measure = () => {
      const el = panelRef.current;
      if (!el) return;
      const top = Math.round(el.getBoundingClientRect().top + window.scrollY);
      const desktop = window.matchMedia("(min-width: 768px)").matches;
      const room = window.innerHeight - top - (desktop ? PANEL_GAP_DESKTOP : PANEL_GAP_PHONE + DOCK_PX);
      setPanelTop(top);
      setPanelFits(room >= MIN_PANEL);
    };
    measure();
    // The navbar settles its height after first paint; measure again then.
    const timer = setTimeout(measure, 350);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Keep the page still behind the chat (fixes keyboard-scroll on mobile),
  // unless the viewport is too short and the page has to scroll to the input.
  useEffect(() => {
    if (!panelFits) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [panelFits]);

  // Auto-grow textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 180) + "px";
  }, [input]);

  // Load initial chat (or silently revalidate cached chat in background).
  useEffect(() => {
    let mounted = true;
    if (!token) {
      return undefined;
    }
    const querySessionId = new URLSearchParams(location.search).get("sessionId") || "";
    const cached = getAskCache();
    const targetSid = querySessionId || cached.activeSessionId || "";
    const hasCachedMsgs = Boolean(
      cached.sessions && targetSid && Array.isArray(cached.messagesBySession?.[targetSid])
    );

    if (reloadKey === 0 && hasCachedMsgs && isFresh(cached.fetchedAt, STALE_MS.ask)) {
      return undefined;
    }

    (async () => {
      try {
        const reqKey = `chat:${querySessionId || cached.activeSessionId || "latest"}`;
        const data = await dedupeRequest(reqKey, () =>
          getChatHistory(token, querySessionId || cached.activeSessionId || "")
        );
        if (!mounted) return;
        const nextSessions = data.sessions || [];
        const nextSid = data.currentSessionId || "";
        const nextMsgs = data.messages || [];
        setSessions(nextSessions);
        setMessages(nextMsgs);
        setActiveSessionId(nextSid);
        setStatus("ready");
        setError(null);
        patchAskCache({
          sessions: nextSessions,
          activeSessionId: nextSid,
          fetchedAt: Date.now(),
        });
        if (nextSid) setAskSessionMessages(nextSid, nextMsgs);
      } catch (err) {
        if (!mounted) return;
        if (hasCachedMsgs) return; // Keep cached conversation visible on transient error.
        setStatus("error");
        const described = describeError(err, "We couldn't load your conversations. Try again in a moment.");
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

  // Scroll to bottom on new message — snaps instantly on cached re-entry so returning
  // to Ask AI never replays a scroll animation; smoothly follows live replies.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    if (firstScrollRef.current) {
      firstScrollRef.current = false;
      el.scrollTop = el.scrollHeight;
      return;
    }

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isNearBottom = distanceFromBottom < 120;

    if (isNearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      setHasUnreadBelow(true);
    }
  }, [messages, status]);

  useEffect(() => () => { if (noticeTimer.current) clearTimeout(noticeTimer.current); }, []);

  // Today's AI messages are used up, from a refused send or from the allowance
  // itself (on load, after a reload, after a send). Free users get "See plans".
  const limit = useMemo(() => {
    if (limitHit) return limitHit;
    if (aiQuota && typeof aiQuota.left === "number" && aiQuota.left <= 0) {
      return { message: AI_LIMIT_MESSAGE, paid: Boolean(aiQuota.paid) };
    }
    return null;
  }, [limitHit, aiQuota]);
  const limitShown = Boolean(limit);

  // The used-up alert renders below the last message (and the unsent one). The
  // effect above only follows new messages, so bring the alert into view
  // whenever it appears or a conversation finishes loading under it.
  const listIdle = status === "ready";
  useEffect(() => {
    if (!limitShown || !listIdle) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [limitShown, listIdle]);

  const displayedSessions = useMemo(() => [...sessions].reverse(), [sessions]);
  const canSend = useMemo(
    () => input.trim().length > 0 && status !== "sending" && !uploading && !limitShown,
    [input, status, uploading, limitShown]
  );

  const showNotice = (type, message) => {
    setUploadNotice({ type, message });
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setUploadNotice(null), 2600);
  };

  const loadSession = async (sessionId) => {
    if (!token || !sessionId) return;
    const cachedMsgs = getAskCache().messagesBySession?.[sessionId];
    setError(null);
    setSidebarOpen(false);
    setActiveSessionId(sessionId);
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (Array.isArray(cachedMsgs)) {
      setMessages(cachedMsgs);
      setStatus("ready");
      patchAskCache({ activeSessionId: sessionId });
    } else {
      setStatus("loadingSession");
    }

    try {
      const data = await dedupeRequest(`chat:${sessionId}`, () => getChatHistory(token, sessionId));
      const nextSessions = data.sessions || [];
      const nextSid = data.currentSessionId || sessionId;
      const nextMsgs = data.messages || [];
      setSessions(nextSessions);
      setMessages(nextMsgs);
      setActiveSessionId(nextSid);
      setStatus("ready");
      patchAskCache({ sessions: nextSessions, activeSessionId: nextSid, fetchedAt: Date.now() });
      setAskSessionMessages(nextSid, nextMsgs);
    } catch (err) {
      setStatus("ready");
      if (!Array.isArray(cachedMsgs)) {
        noteFailure(err, "We couldn't open that conversation. Try again in a moment.", () => loadSession(sessionId));
      }
    }
  };

  const handleNewChat = async () => {
    if (!token) return;
    setError(null);
    try {
      const data = await createChatSession(token);
      const nextSessions = data.sessions || [];
      const nextSid = data.currentSessionId || data.session?.sessionId || "";
      const nextMsgs = data.messages || [];
      setSessions(nextSessions);
      setActiveSessionId(nextSid);
      setMessages(nextMsgs);
      setAttachment(null);
      setInput("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSidebarOpen(false);
      setStatus("ready");
      patchAskCache({ sessions: nextSessions, activeSessionId: nextSid, input: "", attachment: null, fetchedAt: Date.now() });
      if (nextSid) setAskSessionMessages(nextSid, nextMsgs);
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
      const nextSessions = data.sessions || [];
      const nextSid = data.currentSessionId || "";
      const nextMsgs = data.messages || [];
      setSessions(nextSessions);
      setActiveSessionId(nextSid);
      setMessages(nextMsgs);
      if (activeSessionId === sessionId) {
        setAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
      const nextBySession = { ...(getAskCache().messagesBySession || {}) };
      delete nextBySession[sessionId];
      if (nextSid) nextBySession[nextSid] = nextMsgs;
      patchAskCache({
        sessions: nextSessions,
        activeSessionId: nextSid,
        messagesBySession: nextBySession,
        fetchedAt: Date.now(),
      });
    } catch (err) {
      noteFailure(err, "We couldn't delete that conversation. Try again in a moment.", () => handleDeleteSession(sessionId));
    }
  };

  // `retry` resends the message whose bubble is already on screen (marked
  // "Not sent") instead of appending a duplicate.
  const sendMessage = async (overrideText = "", { retry = false } = {}) => {
    const text = (overrideText || input).trim();
    if (!text || !token || status === "sending" || limit) return;
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
        mode,
      });
      const nextSessions = data.sessions || [];
      const nextMsgs = data.messages || [];
      const nextSid = data.currentSessionId || data.sessionId || activeSessionId;
      setSessions(nextSessions);
      setMessages(nextMsgs);
      setActiveSessionId(nextSid);
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setStatus("ready");
      patchAskCache({
        sessions: nextSessions,
        activeSessionId: nextSid,
        attachment: null,
        fetchedAt: Date.now(),
      });
      if (nextSid) setAskSessionMessages(nextSid, nextMsgs);
      refreshQuota();
    } catch (err) {
      setStatus("ready");
      refreshQuota();
      // Mark the optimistic bubble so it doesn't pose as delivered.
      setMessages((prev) => {
        const next = [...prev];
        for (let i = next.length - 1; i >= 0; i -= 1) {
          if (next[i].role === "user") { next[i] = { ...next[i], failed: true }; break; }
        }
        return next;
      });
      if (err?.code === "ai_daily_limit") {
        if (err.data?.ai) setAiQuota(err.data.ai);
        setLimitHit({
          message: err.message,
          paid: Boolean(err.data?.ai?.paid ?? aiQuota?.paid),
        });
        return;
      }
      noteFailure(
        err,
        "The assistant couldn't answer just now. Try again in a moment.",
        () => sendMessage(text, { retry: true })
      );
    }
  };

  useEffect(() => () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const copyMessage = async (idx, text) => {
    if (!text) return;
    try {
      await navigator.clipboard?.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => {
        setCopiedIdx((curr) => (curr === idx ? null : curr));
      }, 1800);
    } catch {
      showNotice("error", "Could not copy to clipboard");
    }
  };

  const toggleSpeak = (idx, text) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    if (speakingIdx === idx) {
      setSpeakingIdx(null);
      return;
    }
    const plain = text
      .replace(/```[\s\S]*?```/g, " code snippet ")
      .replace(/[#*_`>~]/g, "")
      .trim();
    if (!plain) return;
    const utterance = new SpeechSynthesisUtterance(plain);
    utterance.rate = 1;
    utterance.onend = () => setSpeakingIdx((curr) => (curr === idx ? null : curr));
    utterance.onerror = () => setSpeakingIdx((curr) => (curr === idx ? null : curr));
    setSpeakingIdx(idx);
    window.speechSynthesis.speak(utterance);
  };

  // "Still confused? Ask your class": the server drafts a doubt from this
  // conversation; the class composer opens with it (sessionStorage carries it
  // past the class and parent-approval steps if they come first).
  const askClass = async () => {
    if (!activeSessionId || drafting) return;
    setDrafting(true);
    setError(null);
    try {
      const data = await draftFromChat(activeSessionId);
      try {
        // Kept until the student posts it or discards it (see Doubts.jsx).
        sessionStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            ...data.draft,
            sessionId: activeSessionId,
            hasAiAnswer: data.hasAiAnswer === true,
            open: true,
            savedAt: Date.now(),
          })
        );
      } catch {
        // Storage blocked: the composer opens empty instead.
      }
      onDraftReady?.();
      navigate("/doubts/class");
    } catch (err) {
      if (err.code === "ai_daily_limit") {
        if (err.data?.ai) setAiQuota(err.data.ai);
        setLimitHit({ message: err.message, paid: Boolean(err.data?.ai?.paid ?? aiQuota?.paid) });
      } else {
        setError({ kind: "server", text: err.message, retry: null });
      }
    } finally {
      setDrafting(false);
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
    } catch (err) {
      const described = noteFailure(err, "That file didn't upload. Try again, or pick a smaller file.");
      showNotice("error", described.text);
    } finally {
      setUploading(false);
    }
  };

  const isIdle = status !== "loading" && status !== "loadingSession";
  const hasAnswer = messages.some((m) => m.role !== "user");
  const quotaLine =
    aiQuota && typeof aiQuota.left === "number" && typeof aiQuota.limit === "number"
      ? aiQuota.left <= 0
        ? "No AI messages left today"
        : `${aiQuota.left} of ${aiQuota.limit} AI messages left today`
      : "";
  // Phone: the short form fits on one row beside the Hint / Full answer switch.
  const quotaShort =
    aiQuota && typeof aiQuota.left === "number" && aiQuota.left > 0 && typeof aiQuota.limit === "number"
      ? `${aiQuota.left} of ${aiQuota.limit} left today`
      : "";
  const toggleRail = () => {
    setRailOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(RAIL_KEY, next ? "1" : "0");
      } catch {
        // Storage blocked: preference stays in memory for this visit.
      }
      return next;
    });
  };

  const activeSession = sessions.find((s) => s.sessionId === activeSessionId);
  const activeTitle = activeSession?.title || "New conversation";

  const railProps = {
    sessions: displayedSessions,
    activeSessionId,
    onLoad: loadSession,
    onNew: handleNewChat,
    onDelete: (id) => setPendingDelete(id),
  };

  const composerCard = (
    <div className="w-full rounded-2xl border border-line-strong bg-surface shadow-e1 transition-all duration-fast focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15">
      {attachment && (
        <div className="mx-2.5 mt-2.5 flex items-center gap-2 rounded-xl border border-line bg-surface-sunken pl-3 text-xs text-ink">
          <FaPaperclip size={11} className="flex-shrink-0 text-brand" aria-hidden="true" />
          <span className="flex-1 truncate font-medium">{attachment.fileName}</span>
          <button
            type="button"
            onClick={() => {
              setAttachment(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
              showNotice("success", "Attachment removed");
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition hover:bg-surface hover:text-ink"
            aria-label={`Remove attachment ${attachment.fileName}`}
          >
            <FaTimes size={10} />
          </button>
        </div>
      )}

      {uploading && (
        <div className="mx-2.5 mt-2.5 flex items-center gap-2 rounded-xl border border-line bg-surface-sunken px-3 py-2 text-xs text-ink-muted" role="status">
          <span className="h-3.5 w-3.5 flex-shrink-0 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-hidden="true" />
          Uploading file…
        </div>
      )}

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
        placeholder={limitShown ? "You can ask the AI again tomorrow" : "Ask anything from your syllabus…"}
        aria-label="Message the assistant"
        disabled={limitShown}
        className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-sm leading-relaxed text-ink outline-none placeholder:text-ink-subtle focus-visible:!outline-none disabled:cursor-not-allowed"
        rows={1}
        style={{ maxHeight: 180, overflowY: "auto" }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-ink-muted transition hover:bg-surface-sunken hover:text-ink disabled:cursor-not-allowed"
            aria-label="Attach a file"
            title="Attach file"
          >
            <FaPaperclip size={13} className={uploading ? "animate-pulse" : ""} />
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={onFileChange} tabIndex={-1} />

          <div role="group" aria-label="How the AI answers" className="inline-flex h-9 items-center rounded-full bg-surface-sunken p-0.5 ring-1 ring-inset ring-line">
            {MODES.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={mode === option.value}
                onClick={() => chooseMode(option.value)}
                className={`h-full rounded-full px-3 text-xs font-semibold transition-colors duration-fast ease-brand ${
                  mode === option.value ? "bg-surface text-ink shadow-e1 ring-1 ring-inset ring-line" : "text-ink-muted hover:text-ink"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {quotaLine && (
            <p className="text-[0.6875rem] tabular-nums text-ink-subtle" aria-live="polite">
              {quotaShort ? (
                <>
                  <span className="sm:hidden">{quotaShort}</span>
                  <span className="hidden sm:inline">{quotaLine}</span>
                </>
              ) : (
                quotaLine
              )}
            </p>
          )}
          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={!canSend}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-brand text-brand-fg transition-all duration-fast ease-brand hover:bg-brand-hover active:scale-[0.96] disabled:cursor-not-allowed disabled:bg-disabled disabled:text-disabled-fg"
            aria-label="Send message"
            title="Send"
          >
            <FaPaperPlane size={12} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    // One full-viewport workspace panel: collapsible history rail on the left,
    // spacious reading & tutoring canvas on the right.
    <div
      ref={panelRef}
      role="region"
      aria-label="Ask AI"
      className="card flex overflow-hidden [--ask-gap:8px] [--ask-dock:calc(4rem+env(safe-area-inset-bottom))] md:[--ask-dock:0px] md:[--ask-gap:12px]"
      style={{
        height:
          panelTop === null
            ? `${MIN_PANEL}px`
            : `max(${MIN_PANEL}px, calc(100dvh - ${panelTop}px - var(--ask-gap) - var(--ask-dock)))`,
      }}
    >
      {/* ── Collapsible Rail (lg and up) ── */}
      {railOpen && (
        <aside aria-label="Your chats" className="hidden w-[248px] flex-shrink-0 flex-col border-r border-line bg-surface-sunken/60 lg:flex">
          <ConversationRail {...railProps} onCollapse={toggleRail} />
        </aside>
      )}

      {/* ── Conversation Canvas ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact 42px subheader bar: rail toggle + current chat title + new chat */}
        <div className={`flex h-[42px] flex-shrink-0 items-center justify-between gap-2 border-b border-line/70 px-2.5 md:px-4 ${railOpen && messages.length === 0 ? "lg:hidden" : ""}`}>
          <div className="flex min-w-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors duration-fast hover:bg-surface-sunken hover:text-ink lg:hidden"
              aria-label="Open your chats"
              title="Open chats"
            >
              <FaBars size={13} aria-hidden="true" />
            </button>
            {!railOpen && (
              <button
                type="button"
                onClick={toggleRail}
                className="hidden lg:inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted transition-colors duration-fast hover:bg-surface-sunken hover:text-ink"
                aria-label="Show chat history"
                title="Show chat history"
              >
                <FiSidebar size={15} aria-hidden="true" />
              </button>
            )}
            <span className="truncate text-xs font-semibold text-ink-muted">
              {activeTitle}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNewChat}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-ink-muted transition-colors duration-fast hover:bg-surface-sunken hover:text-ink ${railOpen ? "lg:hidden" : ""}`}
          >
            <FaPlus size={10} className="text-brand" aria-hidden="true" />
            New chat
          </button>
        </div>

        {/* Messages */}
        <div className="relative min-h-0 flex-1">
          <div ref={listRef} className="no-scrollbar h-full overflow-y-auto py-4 md:py-5">
            {(status === "loading" || status === "loadingSession") && (
              <div className="flex h-full items-center justify-center gap-3 text-ink-muted" role="status">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-brand" aria-hidden="true" />
                <span className="text-sm">{status === "loading" ? "Loading your chats…" : "Loading messages…"}</span>
              </div>
            )}

            {/* Empty state: centered heading + subject starter chips above the bottom composer. */}
            {messages.length === 0 && isIdle && (
              <Motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="flex min-h-full flex-col items-center justify-center px-4 py-6"
              >
                <div className="w-full max-w-2xl text-center">
                  <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink sm:text-[1.875rem]">
                    What are you <Accent after="?">stuck on</Accent>
                  </h2>
                </div>

                <div role="group" aria-label="Suggested questions" className="mt-5 flex w-full max-w-2xl flex-wrap items-center justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.text}
                      type="button"
                      onClick={() => sendMessage(s.text)}
                      disabled={limitShown}
                      className="group inline-flex items-center gap-2 rounded-full border border-line bg-surface-sunken/70 px-3.5 py-1.5 text-xs font-medium text-ink transition-all duration-fast ease-brand hover:border-brand/45 hover:bg-surface hover:shadow-e1 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="font-bold text-brand">{s.tag}</span>
                      <span className="text-ink-muted group-hover:text-ink">{s.label}</span>
                      <FiArrowUpRight size={12} className="text-ink-subtle group-hover:text-brand" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </Motion.div>
            )}

            {/* Message list: student prompts as compact right-aligned cards;
                tutor replies as full-width editorial prose with actions & follow-ups. */}
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const content = msg.content;
              const isLastAi = !isUser && idx === messages.length - 1;
              const isVideo = !isUser && isVideoMessage(msg);
              const isCopied = copiedIdx === idx;
              const isSpeaking = speakingIdx === idx;
              const followUps = [
                { label: "Give an example", prompt: "Can you give a concrete everyday example of this?" },
                { label: "Quiz me on this", prompt: "Ask me 1 quick practice question on this topic to test my understanding." },
                { label: "Explain simpler", prompt: "Explain this again in simpler words step by step." },
              ];
              return (
                <Motion.div
                  key={`${msg.createdAt || idx}-${idx}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mx-auto w-full max-w-3xl px-4 py-2.5 md:px-6"
                >
                  {isUser ? (
                    <div className="ml-auto flex max-w-[85%] flex-col items-end gap-1 md:max-w-[75%]">
                      <div
                        className={`rounded-2xl rounded-br-sm border border-line bg-surface-sunken px-4 py-2.5 text-sm leading-relaxed text-ink ${
                          msg.failed ? "ring-1 ring-inset ring-critical/45" : ""
                        }`}
                      >
                        <span className="whitespace-pre-wrap">{content}</span>
                        {msg.fileUrl && (
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 flex items-center gap-1.5 text-xs text-brand underline underline-offset-2"
                          >
                            <FaPaperclip size={10} aria-hidden="true" />
                            {msg.fileName || "Attachment"}
                          </a>
                        )}
                      </div>
                      <p className="px-0.5 text-micro text-ink-subtle">
                        You · {formatTime(msg.createdAt)}
                        {msg.failed && <span className="font-semibold text-critical"> · Not sent</span>}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-brand ring-1 ring-brand/20" aria-hidden="true">
                          <FiCpu size={12} />
                        </span>
                        <span className="text-xs font-semibold text-ink">Kanthast AI</span>
                        <span className="text-micro text-ink-subtle">· {formatTime(msg.createdAt)}</span>
                      </div>

                      <div className="w-full text-[0.9375rem] leading-[1.68] text-ink sm:pl-8" aria-live={isLastAi ? "polite" : undefined}>
                        {isVideo ? (
                          <VideoMessageCard msg={msg} />
                        ) : (
                          <Markdown>{content}</Markdown>
                        )}
                        {msg.fileUrl && (
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 flex items-center gap-1.5 text-xs text-brand underline underline-offset-2"
                          >
                            <FaPaperclip size={10} aria-hidden="true" />
                            {msg.fileName || "Attachment"}
                          </a>
                        )}

                        {!isVideo && typeof content === "string" && content.trim().length > 0 && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-1">
                            <button
                              type="button"
                              onClick={() => copyMessage(idx, content)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-ink-subtle transition-colors duration-fast hover:bg-surface-sunken hover:text-ink"
                              aria-label={isCopied ? "Copied answer" : "Copy answer"}
                            >
                              {isCopied ? <FiCheck size={13} className="text-positive" aria-hidden="true" /> : <FiCopy size={13} aria-hidden="true" />}
                              <span>{isCopied ? "Copied" : "Copy"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleSpeak(idx, content)}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors duration-fast ${
                                isSpeaking
                                  ? "bg-brand-soft text-brand"
                                  : "text-ink-subtle hover:bg-surface-sunken hover:text-ink"
                              }`}
                              aria-label={isSpeaking ? "Stop reading aloud" : "Listen to answer"}
                            >
                              {isSpeaking ? <FiVolumeX size={13} aria-hidden="true" /> : <FiVolume2 size={13} aria-hidden="true" />}
                              <span>{isSpeaking ? "Stop" : "Listen"}</span>
                            </button>
                          </div>
                        )}

                        {isLastAi && isIdle && !limitShown && !isVideo && (
                          <div className="mt-3 flex flex-wrap gap-1.5" role="group" aria-label="Follow-up prompts">
                            {followUps.map((chip) => (
                              <button
                                key={chip.label}
                                type="button"
                                onClick={() => sendMessage(chip.prompt)}
                                className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-sunken/70 px-3 py-1.5 text-xs font-medium text-ink-muted transition-all duration-fast hover:border-brand/40 hover:bg-surface hover:text-ink active:scale-[0.98]"
                              >
                                <span>{chip.label}</span>
                                <FiArrowUpRight size={11} className="text-ink-subtle" aria-hidden="true" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Motion.div>
              );
            })}

            {/* Today's AI messages are used up: said where the answer would appear,
                scrolled into view and announced (role="alert") when it appears. */}
            {limit && (
              <div className="mx-auto w-full max-w-3xl px-4 py-2 md:px-6">
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-control border border-critical/35 bg-critical-soft px-3 py-2.5 text-sm text-critical"
                >
                  <FaExclamationTriangle size={12} className="mt-1 flex-shrink-0" aria-hidden="true" />
                  <p className="flex-1 leading-snug">
                    {limit.message}
                    {!limit.paid && (
                      <>
                        {" "}
                        <Link to="/subscription" className="font-semibold underline underline-offset-2">
                          See plans
                        </Link>
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}

            {status === "sending" && <TypingDots />}
          </div>

          {/* Jump to latest: only when a reply landed off-screen. */}
          {hasUnreadBelow && (
            <button
              type="button"
              onClick={() => {
                listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
                setHasUnreadBelow(false);
              }}
              className="absolute bottom-3 left-1/2 z-10 inline-flex min-h-touch -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold text-ink shadow-e2 transition-colors duration-fast ease-brand hover:border-line-strong"
            >
              New message
              <span aria-hidden="true">↓</span>
            </button>
          )}

          {/* Custom scrollbar overlay */}
          <div
            className="pointer-events-none absolute bottom-2 right-1 top-2 w-1.5 rounded-full transition-opacity duration-300"
            style={{ opacity: scrollbarVisible ? 1 : 0 }}
          >
            <div ref={thumbRef} className="absolute w-full rounded-full bg-ink-subtle/45" />
          </div>
        </div>

        {/* Unified composer dock */}
        <div className="flex-shrink-0 border-t border-line/70 bg-surface/95 px-3 pb-3 pt-2.5 backdrop-blur-sm md:px-6 md:pb-3.5">
          <div className="mx-auto w-full max-w-3xl">
            {/* After an answer: take what is still unclear to the class. */}
            {hasAnswer && isIdle && activeSessionId && (
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={askClass}
                  disabled={drafting || status === "sending"}
                  aria-busy={drafting || undefined}
                  className="inline-flex min-h-9 items-center gap-2 rounded-full border border-brand/25 bg-brand-soft/60 px-3 py-1 text-xs font-semibold text-brand transition-colors duration-fast ease-brand hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {drafting ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                  ) : (
                    <FaComments aria-hidden="true" />
                  )}
                  {drafting ? "Writing your doubt…" : "Still confused? Ask your class"}
                </button>
              </div>
            )}

            {composerCard}

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
                    className="inline-flex min-h-touch flex-shrink-0 items-center gap-1.5 rounded-control px-3 font-semibold text-critical transition-colors duration-fast hover:bg-critical/12 disabled:cursor-not-allowed"
                  >
                    <FaRedo size={10} aria-hidden="true" />
                    Try again
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Drawer (below lg) ── */}
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
            <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" />
            <Motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Your chats"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="absolute left-0 top-0 h-full w-72 max-w-[85vw] border-r border-line bg-surface shadow-e5"
              onClick={(e) => e.stopPropagation()}
            >
              <ConversationRail {...railProps} onClose={() => setSidebarOpen(false)} />
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
            className={`fixed bottom-24 right-4 z-[60] flex items-center gap-2 rounded-card border px-4 py-3 text-sm font-medium shadow-e4 md:bottom-6 md:right-5 ${
              uploadNotice.type === "success"
                ? "border-positive/35 bg-positive-soft text-positive"
                : uploadNotice.type === "error"
                ? "border-critical/35 bg-critical-soft text-critical"
                : "border-line bg-surface-raised text-ink-muted"
            }`}
          >
            {uploadNotice.type === "loading" && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-transparent" aria-hidden="true" />
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

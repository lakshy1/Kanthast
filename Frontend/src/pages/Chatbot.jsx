import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FaBars,
  FaPaperPlane,
  FaPaperclip,
  FaPlus,
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

const SUGGESTIONS = [
  { emoji: "🔐", label: "OTP signup issue", text: "I am facing OTP issue during signup. Help me." },
  { emoji: "👤", label: "Update profile", text: "How can I update my profile details?" },
  { emoji: "🎥", label: "Video locked", text: "My video is locked. What subscription is needed?" },
  { emoji: "📎", label: "File upload issue", text: "File upload is not working. Show troubleshooting steps." },
  { emoji: "🔑", label: "Login help", text: "Give me quick steps to fix login issues." },
];

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

function renderContent(text = "") {
  // Convert markdown-lite to readable text with basic structure
  const cleaned = String(text)
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/`/g, ""))
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return cleaned;
}

// ─── Typing dots indicator ─────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex justify-start px-4 md:px-6 py-1">
      <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"
            style={{ animationDelay: `${delay}ms`, animationDuration: "0.9s" }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar content (shared between desktop and mobile drawer) ────────────
function SidebarContent({ sessions, activeSessionId, onLoad, onNew, onDelete, onClose }) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand + close (mobile) */}
      <div className="flex items-center justify-between p-4 pb-3 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <FaRobot className="text-white text-sm" />
          </div>
          <span className="text-white font-bold text-sm tracking-tight">Kanthast AI</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
          >
            <FaTimes size={14} />
          </button>
        )}
      </div>

      {/* New chat */}
      <div className="px-3 pb-4 flex-shrink-0">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/18 border border-white/10 text-white/90 text-sm font-medium transition group"
        >
          <FaPlus size={11} className="group-hover:rotate-90 transition-transform duration-200" />
          New conversation
        </button>
      </div>

      <div className="px-4 pb-2 flex-shrink-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Recent</p>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5" style={{ scrollbarWidth: "none" }}>
        {sessions.length === 0 && (
          <p className="text-slate-600 text-xs px-3 py-2">No conversations yet.</p>
        )}
        {sessions.map((session) => {
          const active = activeSessionId === session.sessionId;
          return (
            <div
              key={session.sessionId}
              className={`group relative rounded-xl transition-all duration-150 ${
                active ? "bg-white/15" : "hover:bg-white/8"
              }`}
            >
              <button
                onClick={() => onLoad(session.sessionId)}
                className="w-full text-left px-3 py-2.5 pr-10 rounded-xl"
              >
                <p className={`text-sm truncate font-medium leading-snug ${active ? "text-white" : "text-slate-300"}`}>
                  {session.title || "New Chat"}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {session.preview || formatTime(session.lastMessageAt) || "No messages yet"}
                </p>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(session.sessionId); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 hidden group-hover:flex items-center justify-center transition"
                title="Delete"
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
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("loading");
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [uploadNotice, setUploadNotice] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fileInputRef = useRef(null);
  const listRef = useRef(null);
  const textareaRef = useRef(null);
  const noticeTimer = useRef(null);

  const { thumbRef, visible: scrollbarVisible } = useCustomScrollbar(listRef);

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
    if (!token) { setStatus("error"); setError("Login required."); return; }
    (async () => {
      try {
        const data = await getChatHistory(token);
        if (!mounted) return;
        setSessions(data.sessions || []);
        setMessages(data.messages || []);
        setActiveSessionId(data.currentSessionId || "");
        setStatus("ready");
      } catch (err) {
        if (!mounted) return;
        setStatus("error");
        setError(err.message || "Failed to load chat");
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
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
    setError("");
    try {
      const data = await getChatHistory(token, sessionId);
      setSessions(data.sessions || []);
      setMessages(data.messages || []);
      setActiveSessionId(data.currentSessionId || sessionId);
      setAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setStatus("ready");
      setSidebarOpen(false);
    } catch (err) {
      setStatus("ready");
      setError(err.message || "Failed to load conversation");
    }
  };

  const handleNewChat = async () => {
    if (!token) return;
    setError("");
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
    } catch (err) {
      setError(err.message || "Failed to create new chat");
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!token || !sessionId) return;
    if (!window.confirm("Delete this conversation permanently?")) return;
    setError("");
    try {
      const data = await deleteChatSession(token, sessionId, activeSessionId);
      setSessions(data.sessions || []);
      setActiveSessionId(data.currentSessionId || "");
      setMessages(data.messages || []);
      if (activeSessionId === sessionId) {
        setAttachment(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err.message || "Failed to delete conversation");
    }
  };

  const sendMessage = async (overrideText = "") => {
    const text = (overrideText || input).trim();
    if (!text || !token || status === "sending") return;
    setStatus("sending");
    setError("");
    setMessages((prev) => [...prev, {
      role: "user", content: text,
      fileName: attachment?.fileName || "", fileUrl: attachment?.fileUrl || "",
      createdAt: new Date().toISOString(),
    }]);
    setInput("");
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
    } catch (err) {
      setStatus("ready");
      setError(err.message || "Failed to send message");
    }
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploading(true);
    setError("");
    showNotice("loading", `Uploading ${file.name}…`);
    try {
      const data = await uploadChatFile(token, file);
      setAttachment({ fileUrl: data.fileUrl, fileName: data.fileName });
      showNotice("success", `Attached: ${data.fileName || file.name}`);
    } catch (err) {
      setError(err.message || "Upload failed");
      showNotice("error", err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const isIdle = status !== "loading" && status !== "loadingSession";

  return (
    <div
      className="flex bg-slate-50 overflow-hidden"
      style={{ height: "calc(100dvh - 4rem)" }}
    >
      {/* ── Desktop sidebar ── */}
      <div className="hidden lg:flex w-64 xl:w-72 flex-col bg-slate-950 border-r border-slate-800 flex-shrink-0">
        <SidebarContent
          sessions={displayedSessions}
          activeSessionId={activeSessionId}
          onLoad={loadSession}
          onNew={handleNewChat}
          onDelete={handleDeleteSession}
        />
      </div>

      {/* ── Main chat area ── */}
      <div className="flex-1 flex flex-col min-w-0" style={{ background: "linear-gradient(160deg,#f5f8ff 0%,#eef3ff 50%,#f8faff 100%)" }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-slate-200/80 bg-white/70 backdrop-blur-md flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-1 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            aria-label="Open sidebar"
          >
            <FaBars size={16} />
          </button>

          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-cyan-500 flex items-center justify-center shadow-sm shadow-cyan-500/30 flex-shrink-0">
              <FaRobot className="text-white text-xs" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-slate-900 text-sm md:text-base leading-tight truncate">Kanthast AI Support</h1>
              <p className="text-[11px] text-slate-500 leading-tight hidden sm:block">Medical platform assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-full font-medium flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="relative flex-1 min-h-0">
        <div
          ref={listRef}
          className="h-full overflow-y-auto py-6 space-y-1 no-scrollbar"
        >
          {(status === "loading" || status === "loadingSession") && (
            <div className="flex items-center justify-center h-full gap-3 text-slate-500">
              <span className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-cyan-500 animate-spin" />
              <span className="text-sm">{status === "loading" ? "Loading conversations…" : "Loading messages…"}</span>
            </div>
          )}

          {/* Empty state */}
          {messages.length === 0 && isIdle && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center h-full px-6 text-center"
            >
              {/* Glow icon */}
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-3xl bg-cyan-400/25 blur-2xl scale-150" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-700 flex items-center justify-center shadow-2xl shadow-cyan-500/30">
                  <FaRobot className="text-white text-3xl" />
                </div>
              </div>

              <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">How can I help?</h2>
              <p className="text-slate-400 text-sm max-w-sm leading-relaxed mb-8">
                Ask about subscriptions, platform features, or anything related to your medical study journey.
              </p>

            </motion.div>
          )}

          {/* Message list */}
          {messages.map((msg, idx) => {
            const isUser = msg.role === "user";
            const content = isUser ? msg.content : renderContent(msg.content);
            return (
              <motion.div
                key={`${msg.createdAt || idx}-${idx}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 px-4 md:px-6 py-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 text-xs ${
                  isUser
                    ? "bg-slate-900 text-white"
                    : "bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-sm"
                }`}>
                  {isUser ? <FaUser size={10} /> : <FaRobot size={10} />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[78%] md:max-w-[70%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    isUser
                      ? "bg-slate-900 text-white rounded-tr-sm shadow-lg shadow-slate-900/20"
                      : "bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-sm"
                  }`}>
                    {content}
                    {msg.fileUrl && (
                      <a
                        href={msg.fileUrl} target="_blank" rel="noreferrer"
                        className={`text-xs mt-2 block underline underline-offset-2 ${isUser ? "text-cyan-300" : "text-cyan-600"}`}
                      >
                        📎 {msg.fileName || "Attachment"}
                      </a>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 px-1">
                    {isUser ? "You" : "AI"} · {formatTime(msg.createdAt)}
                  </p>
                </div>
              </motion.div>
            );
          })}

          {/* Typing indicator */}
          {status === "sending" && <TypingDots />}
        </div>

        {/* Custom scrollbar overlay */}
        <div
          className="absolute right-1 top-2 bottom-2 w-1.5 rounded-full pointer-events-none transition-opacity duration-300"
          style={{ opacity: scrollbarVisible ? 1 : 0 }}
        >
          <div ref={thumbRef} className="absolute w-full rounded-full bg-cyan-400/75" />
        </div>
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-slate-200/80 bg-white/70 backdrop-blur-md px-4 md:px-6 pt-3 pb-4">

          {/* Quick suggestion pills — shown only on empty chat */}
          {messages.length === 0 && isIdle && (
            <div className="flex gap-2 mb-3 w-full overflow-x-auto no-scrollbar">
              {SUGGESTIONS.map((s) => (
                <motion.button
                  key={s.text}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => sendMessage(s.text)}
                  className="flex-shrink-0 md:flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full border border-slate-200 bg-white hover:bg-cyan-50 hover:border-cyan-300 hover:shadow-md transition-all duration-200 text-xs text-slate-600 hover:text-slate-900 shadow-sm"
                >
                  <span>{s.emoji}</span>
                  <span className="font-medium whitespace-nowrap">{s.label}</span>
                </motion.button>
              ))}
            </div>
          )}

          {/* Attachment preview */}
          {attachment && (
            <div className="mb-3 flex items-center gap-2 bg-cyan-50 border border-cyan-200 rounded-xl px-3 py-2 text-sm text-cyan-800">
              <span className="text-base">📎</span>
              <span className="flex-1 truncate font-medium">{attachment.fileName}</span>
              <button
                onClick={() => {
                  setAttachment(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                  showNotice("success", "Attachment removed");
                }}
                className="w-6 h-6 rounded-lg text-cyan-600 hover:bg-cyan-200 flex items-center justify-center transition"
              >
                <FaTimes size={11} />
              </button>
            </div>
          )}

          {uploading && (
            <div className="mb-3 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-sm text-blue-700">
              <span className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin flex-shrink-0" />
              Uploading file…
            </div>
          )}

          {/* Input box */}
          <div className="relative flex items-end gap-2 bg-slate-50 border border-slate-300 rounded-2xl focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-100 transition-all duration-200 shadow-sm">
            <label className="flex-shrink-0 p-3 cursor-pointer text-slate-400 hover:text-slate-600 transition self-end mb-0.5">
              <FaPaperclip size={15} className={uploading ? "animate-pulse" : ""} />
              <input ref={fileInputRef} type="file" className="hidden" onChange={onFileChange} />
            </label>

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
              placeholder="Message Kanthast AI"
              className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 text-sm py-3 outline-none resize-none leading-relaxed"
              rows={1}
              style={{ maxHeight: 180, overflowY: "auto" }}
            />

            <button
              onClick={() => sendMessage()}
              disabled={!canSend}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center disabled:opacity-30 hover:bg-slate-700 transition self-end m-1.5"
              title="Send"
            >
              <FaPaperPlane size={12} />
            </button>
          </div>

          {error && (
            <p className="mt-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>
      </div>

      {/* ── Mobile sidebar drawer ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="absolute left-0 top-0 h-full w-72 bg-slate-950 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <SidebarContent
                sessions={displayedSessions}
                activeSessionId={activeSessionId}
                onLoad={loadSession}
                onNew={handleNewChat}
                onDelete={handleDeleteSession}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Upload toast ── */}
      <AnimatePresence>
        {uploadNotice && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            className={`fixed bottom-6 right-5 z-[60] rounded-2xl px-4 py-3 text-sm font-medium shadow-xl flex items-center gap-2 ${
              uploadNotice.type === "success"
                ? "bg-emerald-500 text-white"
                : uploadNotice.type === "error"
                ? "bg-red-500 text-white"
                : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            {uploadNotice.type === "loading" && (
              <span className="w-4 h-4 rounded-full border-2 border-slate-400 border-t-transparent animate-spin" />
            )}
            {uploadNotice.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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

const quickSuggestions = [
  "I am facing OTP issue during signup. Help me.",
  "How can I update my profile details?",
  "My video is locked. What subscription is needed?",
  "File upload is not working. Show troubleshooting steps.",
  "Give me quick steps to fix login issues.",
];

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const stripMarkdownFormatting = (text = "") =>
  String(text)
    .replace(/```[\s\S]*?```/g, (match) => match.replace(/`/g, ""))
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^(\s*)[*]\s+/gm, "$1- ")
    .replace(/^(\s*)\d+\.\s+/gm, "$1- ")
    .replace(/^(\s*)#+\s+/gm, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

export default function Chatbot() {
  const token = localStorage.getItem("kanthastToken");
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("loading"); // loading | ready | loadingSession | sending | error
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [uploadNotice, setUploadNotice] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef(null);
  const listRef = useRef(null);
  const uploadNoticeTimerRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const loadInitial = async () => {
      if (!token) {
        setStatus("error");
        setError("Login required.");
        return;
      }

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
    };

    loadInitial();
    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, activeSessionId]);

  useEffect(() => {
    return () => {
      if (uploadNoticeTimerRef.current) {
        clearTimeout(uploadNoticeTimerRef.current);
      }
    };
  }, []);

  const displayedSessions = useMemo(() => [...sessions].reverse(), [sessions]);
  const canSend = useMemo(
    () => input.trim().length > 0 && status !== "sending" && !uploading,
    [input, status, uploading]
  );

  const showUploadNotice = (type, message) => {
    setUploadNotice({ type, message });
    if (uploadNoticeTimerRef.current) clearTimeout(uploadNoticeTimerRef.current);
    uploadNoticeTimerRef.current = setTimeout(() => {
      setUploadNotice(null);
    }, 2600);
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
      setError(err.message || "Failed to load selected conversation");
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

    const confirmed = window.confirm("Delete this chat session permanently?");
    if (!confirmed) return;

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
      setError(err.message || "Failed to delete chat session");
    }
  };

  const sendMessage = async (overrideText = "") => {
    const text = (overrideText || input).trim();
    if (!text || !token || status === "sending") return;

    setStatus("sending");
    setError("");

    const optimisticUserMessage = {
      role: "user",
      content: text,
      fileName: attachment?.fileName || "",
      fileUrl: attachment?.fileUrl || "",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUserMessage]);
    setInput("");

    try {
      const data = await sendChatMessage(token, {
        message: text,
        fileUrl: attachment?.fileUrl || "",
        fileName: attachment?.fileName || "",
        sessionId: activeSessionId,
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
    setUploadNotice({ type: "loading", message: `Uploading ${file.name}...` });
    try {
      const data = await uploadChatFile(token, file);
      setAttachment({ fileUrl: data.fileUrl, fileName: data.fileName });
      showUploadNotice("success", `Uploaded: ${data.fileName || file.name}`);
    } catch (err) {
      setError(err.message || "Upload failed");
      showUploadNotice("error", err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const renderSidebar = (isMobile = false) => (
    <aside
      className={`h-full flex flex-col overflow-hidden ${
        isMobile
          ? "rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-[0_24px_70px_rgba(2,6,23,0.38)]"
          : "rounded-3xl border border-white/50 bg-white/35 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.16)]"
      }`}
    >
      <div
        className={`p-4 border-b sticky top-0 z-10 backdrop-blur-xl ${
          isMobile ? "border-slate-200 bg-white/95" : "border-white/45 bg-white/50"
        }`}
      >
        {isMobile && (
          <p className="mb-3 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
            Conversations
          </p>
        )}
        <button
          onClick={handleNewChat}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white px-4 py-3 text-sm font-semibold hover:bg-slate-800 transition-all duration-300"
        >
          <FaPlus /> New Chat
        </button>
      </div>

      <div className="px-4 pt-3 text-[11px] font-semibold tracking-[0.14em] text-slate-500 uppercase">
        Chat History
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {displayedSessions.map((session) => {
          const active = activeSessionId === session.sessionId;
          return (
            <motion.div
              key={session.sessionId}
              whileHover={{ y: -1 }}
              transition={{ duration: 0.18 }}
              className={`w-full text-left rounded-xl border px-3 py-3 transition ${
                active
                  ? "border-cyan-300 bg-cyan-50/85 shadow-[0_12px_28px_rgba(8,145,178,0.14)]"
                  : isMobile
                  ? "border-slate-200 bg-white hover:border-slate-300"
                  : "border-white/60 bg-white/55 hover:border-white/80 hover:bg-white/70"
              } relative`}
            >
              <button
                onClick={() => loadSession(session.sessionId)}
                className="w-full pr-8 text-left"
              >
                <p className="font-semibold text-slate-900 truncate">{session.title || "New Chat"}</p>
                <p className="text-xs text-slate-500 mt-1 truncate">{session.preview || "No messages yet"}</p>
                <p className="text-[11px] text-slate-400 mt-2">{formatTime(session.lastMessageAt)}</p>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSession(session.sessionId);
                }}
                className="absolute top-2.5 right-2.5 h-7 w-7 rounded-lg border border-white/70 bg-white/80 text-slate-500 hover:text-red-600 hover:border-red-200 transition grid place-items-center"
                title="Delete chat"
              >
                <FaTrash className="text-xs" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_10%,_#dbeafe_0%,_#eff6ff_36%,_#ecfeff_64%,_#f8fafc_100%)] px-3 md:px-8 py-4 md:py-8 relative overflow-hidden">
      <motion.div
        aria-hidden
        className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl"
        animate={{ x: [0, 24, 0], y: [0, 16, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-6 right-0 h-80 w-80 rounded-full bg-indigo-300/20 blur-3xl"
        animate={{ x: [0, -18, 0], y: [0, -12, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="max-w-7xl mx-auto grid lg:grid-cols-[320px_1fr] gap-4 md:gap-6 h-[calc(100dvh-6.5rem)] md:h-[calc(100vh-7rem)] relative z-10">
        <div className="hidden lg:block h-full">{renderSidebar()}</div>

        <section className="rounded-2xl md:rounded-3xl border border-white/50 bg-white/35 backdrop-blur-2xl shadow-[0_24px_80px_rgba(15,23,42,0.16)] flex flex-col h-full min-h-0 overflow-hidden">
          <div className="p-4 md:p-5 border-b border-white/45 bg-white/35 backdrop-blur-xl">
            <div className="flex items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900">Kanthast AI Support</h1>
                <p className="text-sm md:text-base text-slate-600 mt-1">
                  Modern support assistant for platform issues and study workflow help.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden h-11 w-11 rounded-xl border border-slate-900/80 bg-slate-900 text-white shadow-[0_10px_22px_rgba(15,23,42,0.28)] grid place-items-center"
                >
                  <FaBars />
                </button>
                <span className="inline-flex items-center gap-2 rounded-full bg-cyan-50/75 text-cyan-700 border border-cyan-200/80 px-3 py-1.5 text-sm font-medium">
                  <FaRobot /> Live Assistant
                </span>
              </div>
            </div>
          </div>

          <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto px-4 md:px-5 py-4 space-y-4">
            {status === "loading" && <p className="text-slate-500">Loading conversations...</p>}
            {status === "loadingSession" && <p className="text-slate-500">Loading selected conversation...</p>}

            {messages.length === 0 && status !== "loading" && status !== "loadingSession" && (
              <div className="rounded-2xl border border-white/70 bg-white/60 p-4">
                <p className="text-slate-700">This session is fresh. Use a quick prompt below or type your message.</p>
              </div>
            )}

            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const safeContent = isUser
                ? msg.content
                : stripMarkdownFormatting(msg.content);
              return (
                <motion.div
                  key={`${msg.createdAt || idx}-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[88%] md:max-w-[76%]">
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <span
                        className={`h-6 w-6 rounded-full grid place-items-center text-xs ${
                          isUser ? "bg-blue-100/90 text-blue-700" : "bg-cyan-100/90 text-cyan-700"
                        }`}
                      >
                        {isUser ? <FaUser /> : <FaRobot />}
                      </span>
                      <span className="text-xs text-slate-500">
                        {isUser ? "You" : "Assistant"} | {formatTime(msg.createdAt)}
                      </span>
                    </div>

                    <div
                      className={`rounded-2xl px-4 py-3 border ${
                        isUser
                          ? "bg-slate-900 text-white border-slate-800 shadow-[0_10px_28px_rgba(15,23,42,0.25)]"
                          : "bg-white/62 text-slate-800 border-white/75 backdrop-blur-md"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{safeContent}</p>
                      {msg.fileUrl && (
                        <a
                          href={msg.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`text-xs mt-2 inline-block underline ${
                            isUser ? "text-cyan-200" : "text-cyan-700"
                          }`}
                        >
                          {msg.fileName || "Attachment"}
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="px-4 md:px-5 pb-4 md:pb-5 pt-3 border-t border-white/50 bg-white/28 backdrop-blur-xl">
            <div className="flex flex-wrap gap-2 mb-3 max-h-24 md:max-h-20 overflow-y-auto pr-1">
              {quickSuggestions.map((item) => (
                <button
                  key={item}
                  onClick={() => sendMessage(item)}
                  className="rounded-full border border-white/70 bg-white/68 px-3 py-1.5 text-xs text-slate-700 hover:bg-cyan-50/90 hover:border-cyan-200 transition-all duration-300"
                >
                  {item}
                </button>
              ))}
            </div>

            {attachment && (
              <div className="mb-3 rounded-xl border border-cyan-200 bg-cyan-50/80 px-3 py-2 text-sm text-cyan-800 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  Attached: <span className="font-semibold break-all">{attachment.fileName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttachment(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    showUploadNotice("success", "Attachment removed");
                  }}
                  className="h-7 w-7 shrink-0 rounded-lg border border-cyan-200 bg-white/85 text-cyan-700 hover:bg-white"
                  title="Remove attachment"
                >
                  <FaTimes className="mx-auto text-xs" />
                </button>
              </div>
            )}

            {uploading && (
              <div className="mb-3 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-2 text-sm text-blue-700 flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                Uploading file, please wait...
              </div>
            )}

            <div className="flex gap-2 items-center">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Describe your issue or ask your question..."
                className="flex-1 rounded-xl border border-white/75 bg-white/75 backdrop-blur-sm px-4 py-3 outline-none focus:ring-2 focus:ring-cyan-400"
              />
              <label className="w-12 h-12 rounded-xl border border-white/75 bg-white/75 grid place-items-center cursor-pointer hover:bg-white transition">
                <FaPaperclip className={uploading ? "animate-pulse" : ""} />
                <input ref={fileInputRef} type="file" className="hidden" onChange={onFileChange} />
              </label>
              <button
                onClick={() => sendMessage()}
                disabled={!canSend}
                className="w-12 h-12 rounded-xl bg-slate-900 text-white grid place-items-center disabled:opacity-60 hover:bg-slate-800 transition"
              >
                <FaPaperPlane />
              </button>
            </div>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {uploadNotice && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className={`fixed bottom-5 right-5 z-[60] rounded-xl border px-4 py-2.5 text-sm shadow-[0_14px_36px_rgba(15,23,42,0.22)] ${
              uploadNotice.type === "success"
                ? "border-emerald-200 bg-emerald-500 text-white"
                : uploadNotice.type === "error"
                ? "border-red-200 bg-red-500 text-white"
                : "border-blue-200 bg-white text-blue-700"
            }`}
          >
            {uploadNotice.message}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm lg:hidden"
          >
            <motion.div
              initial={{ x: -42, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -42, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="h-full w-[92%] max-w-[360px] p-3"
            >
              <div className="h-full relative">
                {renderSidebar(true)}
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="absolute top-3 right-3 h-9 w-9 rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm grid place-items-center"
                >
                  <FaTimes />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

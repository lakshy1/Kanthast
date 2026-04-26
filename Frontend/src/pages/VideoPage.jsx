import { motion } from "framer-motion";
import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaBookOpen,
  FaClock,
  FaLayerGroup,
  FaPlay,
  FaCheckCircle,
} from "react-icons/fa";
import { getMedicineUsmleVideoDetails } from "../utils/authApi";
import { VideoMetaSkeleton, VideoPageSkeleton } from "../components/DataLoaderSkeletons";

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
  } catch {}
}

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

function getEmbeddableUrl(rawUrl) {
  if (!rawUrl) return { type: "none", url: "" };

  const url = rawUrl.trim();
  const lower = url.toLowerCase();

  if (/\.(mp4|webm|ogg|m3u8)(\?.*)?$/.test(lower)) {
    return { type: "file", url };
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "").toLowerCase();

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      let videoId = "";
      if (host.includes("youtu.be")) {
        videoId = parsed.pathname.replace("/", "");
      } else if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v") || "";
      } else if (parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.split("/shorts/")[1];
      } else if (parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/embed/")[1];
      }
      if (videoId) {
        return { type: "youtube", url: `https://www.youtube.com/embed/${videoId}` };
      }
    }

    if (host.includes("vimeo.com")) {
      const segments = parsed.pathname.split("/").filter(Boolean);
      const videoId = segments[segments.length - 1];
      if (videoId && /^[0-9]+$/.test(videoId)) {
        return { type: "vimeo", url: `https://player.vimeo.com/video/${videoId}` };
      }
    }
  } catch {
    return { type: "unknown", url };
  }

  return { type: "file", url };
}

export default function VideoPage() {
  const data = useLectureQuery();
  const [videoLink, setVideoLink] = useState("");
  const [dbTitle, setDbTitle] = useState("");
  const [loading, setLoading] = useState(Boolean(data.subjectId && data.chapterId && data.videoId));
  const [isWatched, setIsWatched] = useState(() => {
    try {
      const w = JSON.parse(localStorage.getItem("kanthastWatched") || "{}");
      return Boolean(data.videoId && w[data.videoId]);
    } catch { return false; }
  });
  const embedded = getEmbeddableUrl(videoLink);

  function handleWatched() {
    markWatched(data.videoId);
    setIsWatched(true);
  }

  useEffect(() => {
    let mounted = true;
    if (!data.subjectId || !data.chapterId || !data.videoId) {
      setLoading(false);
      return undefined;
    }

    (async () => {
      try {
        setLoading(true);
        const response = await getMedicineUsmleVideoDetails({
          subjectId: data.subjectId,
          chapterId: data.chapterId,
          videoId: data.videoId,
        });

        if (!mounted) return;
        setVideoLink(response.video?.videoLink || "");
        setDbTitle(response.video?.name || "");
      } catch {
        if (!mounted) return;
        setVideoLink("");
        setDbTitle("");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [data.subjectId, data.chapterId, data.videoId]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#dbeafe,_#f8fafc_35%,_#eef2ff_85%)] px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <Link
          to="/lists"
          className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium"
        >
          <FaArrowLeft /> Back to Lists
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mt-4 grid lg:grid-cols-[1.4fr_0.8fr] gap-6"
        >
          {loading ? (
            <VideoPageSkeleton />
          ) : (
            <section className="rounded-3xl border border-slate-200 bg-white p-4 md:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
            {embedded.type === "file" && embedded.url ? (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black">
                <video controls playsInline preload="metadata" className="w-full aspect-video" src={embedded.url} onEnded={handleWatched}>
                  Your browser does not support video playback.
                </video>
              </div>
            ) : (embedded.type === "youtube" || embedded.type === "vimeo") && embedded.url ? (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-black">
                <iframe
                  title={dbTitle || data.title}
                  src={embedded.url}
                  className="w-full aspect-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : embedded.type === "unknown" && embedded.url ? (
              <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 p-6">
                <p className="text-slate-700">
                  This link type cannot be embedded. Open directly:
                </p>
                <a
                  href={embedded.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-700 underline break-all"
                >
                  {embedded.url}
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
                  <p className="text-sm text-cyan-100">{data.module} - {data.section}</p>
                  <h1 className="text-xl md:text-3xl font-bold mt-1">{dbTitle || data.title}</h1>
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

            {embedded.type !== "file" && data.videoId && (
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
        </motion.div>
      </div>
    </div>
  );
}

function MetaCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase tracking-wider text-slate-500 flex items-center gap-2">
        {icon}
        {label}
      </p>
      <p className="text-slate-900 font-semibold mt-1">{value}</p>
    </div>
  );
}

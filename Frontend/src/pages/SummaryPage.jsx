import { motion } from "framer-motion";
import { useLocation, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaBookOpen, FaClock, FaLayerGroup, FaRegCheckCircle } from "react-icons/fa";
import { getMedicineUsmleVideoDetails } from "../utils/authApi";
import { SummaryPageSkeleton } from "../components/DataLoaderSkeletons";

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

export default function SummaryPage() {
  const data = useLectureQuery();
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(Boolean(data.subjectId && data.chapterId && data.videoId));

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
        setSummary(response.video?.summary || "");
      } catch {
        if (!mounted) return;
        setSummary("");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [data.subjectId, data.chapterId, data.videoId]);

  const bullets = useMemo(() => {
    if (!summary.trim()) {
      return [
        "Core concept map for this lecture.",
        "High-yield exam triggers and clinical links.",
        "Common confusion points and how to avoid them.",
        "Rapid recall checklist for revision day.",
      ];
    }

    return summary
      .split("\n")
      .map((line) => line.replace(/^[\s\-*]+/, "").trim())
      .filter(Boolean);
  }, [summary]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_8%_12%,_#e0f2fe,_#f8fafc_40%,_#eef2ff_90%)] px-4 md:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/lists"
          className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium"
        >
          <FaArrowLeft /> Back to Lists
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mt-4 rounded-3xl border border-slate-200 bg-white/90 backdrop-blur p-6 md:p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)]"
        >
          <p className="text-sm uppercase tracking-[0.22em] text-cyan-700 font-semibold">Lecture Summary</p>
          <h1 className="mt-3 text-3xl md:text-5xl font-black text-slate-900 leading-tight">{data.title}</h1>

          <div className="mt-5 flex flex-wrap gap-3">
            <InfoChip icon={<FaLayerGroup />} label={data.module} />
            <InfoChip icon={<FaBookOpen />} label={data.section} />
            <InfoChip icon={<FaClock />} label={data.duration} />
          </div>
        </motion.section>

        {loading ? (
          <SummaryPageSkeleton />
        ) : (
          <div className="mt-6 grid lg:grid-cols-[1.4fr_1fr] gap-6">
            <motion.article
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]"
            >
              <h2 className="text-2xl font-bold text-slate-900">Concise Notes</h2>
              <p className="mt-3 text-slate-600 leading-relaxed">
                This summary panel is designed to hold the focused key takeaways for{" "}
                <span className="font-semibold text-slate-800">{data.title}</span>. Keep this area short,
                precise, and revision-friendly.
              </p>

              <div className="mt-6 space-y-3">
                {bullets.map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <FaRegCheckCircle className="text-cyan-600 mt-1 shrink-0" />
                    <p className="text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </motion.article>

            <motion.aside
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.45, ease: "easeOut" }}
              className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 p-6 shadow-[0_18px_40px_rgba(14,116,144,0.12)]"
            >
              <h3 className="text-xl font-bold text-slate-900">Quick Revision Sprint</h3>
              <p className="mt-3 text-slate-700">
                Use this mini plan right after watching to lock in retention.
              </p>
              <ol className="mt-5 space-y-3 text-slate-700">
                <li className="rounded-xl bg-white/80 border border-cyan-100 px-4 py-3">1. Read summary once.</li>
                <li className="rounded-xl bg-white/80 border border-cyan-100 px-4 py-3">2. Say key points out loud.</li>
                <li className="rounded-xl bg-white/80 border border-cyan-100 px-4 py-3">3. Test yourself in 2 minutes.</li>
              </ol>
            </motion.aside>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoChip({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-700 font-medium">
      {icon}
      {label}
    </span>
  );
}

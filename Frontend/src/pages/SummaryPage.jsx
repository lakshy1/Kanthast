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
  const [loadError, setLoadError] = useState("");
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
        setLoadError("");
      } catch {
        if (!mounted) return;
        setSummary("");
        // Distinguish "request failed" from "nothing written yet" — the catch
        // block previously fell through to the same empty state, so a server
        // outage was indistinguishable from unpublished notes.
        setLoadError("We couldn't load this summary. Check your connection and try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [data.subjectId, data.chapterId, data.videoId]);

  const isFallback = !summary.trim();

  // Real summary lines only — the empty case renders a plain "no summary yet"
  // state rather than invented placeholder notes.
  const bullets = useMemo(
    () =>
      summary
        .split("\n")
        .map((line) => line.replace(/^[\s\-*]+/, "").trim())
        .filter(Boolean),
    [summary]
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_8%_12%,_#e0f2fe,_#f8fafc_40%,_#eef2ff_90%)] px-4 md:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        <Link
          to="/lists"
          className="inline-flex items-center gap-2 text-ink-muted hover:text-ink font-medium"
        >
          <FaArrowLeft /> Back to Lists
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mt-4 rounded-card border border-line bg-surface/90 backdrop-blur p-6 md:p-8 shadow-e4"
        >
          <p className="text-sm uppercase tracking-[0.22em] text-cyan-700 font-semibold">Lecture Summary</p>
          <h1 className="mt-3 text-3xl md:text-5xl font-black text-ink leading-tight">{data.title}</h1>

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
              className="rounded-card border border-line bg-surface p-6 shadow-e4"
            >
              <h2 className="text-2xl font-bold text-ink">Concise Notes</h2>
              <p className="mt-3 text-ink-muted leading-relaxed">
                This summary panel is designed to hold the focused key takeaways for{" "}
                <span className="font-semibold text-ink">{data.title}</span>. Keep this area short,
                precise, and revision-friendly.
              </p>

              {loadError ? (
                <div
                  className="mt-5 rounded-control border border-critical/30 bg-critical-soft p-6 text-center"
                  role="alert"
                >
                  <p className="font-semibold text-critical">Couldn&apos;t load summary</p>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">
                    {loadError}
                  </p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="btn-secondary mt-4"
                  >
                    Try again
                  </button>
                </div>
              ) : isFallback ? (
                /* Previously this rendered four invented bullets ("High-yield
                   exam triggers…") styled like real notes. In an exam-prep
                   product, placeholder text shaped like study material is the
                   wrong default — a student skimming could revise from it.
                   Now it says plainly that nothing has been written yet. */
                <div className="mt-5 rounded-control border border-dashed border-line bg-surface-sunken p-6 text-center">
                  <p className="font-semibold text-ink">No summary yet</p>
                  <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-muted">
                    Notes for this lecture haven&apos;t been published. Watch the
                    video, or ask the AI assistant to explain a concept you&apos;re
                    stuck on.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {bullets.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 rounded-control border border-line bg-surface-sunken p-4">
                      <FaRegCheckCircle className="mt-1 shrink-0 text-brand" />
                      <p className="text-ink-muted">{item}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.article>

            <motion.aside
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.45, ease: "easeOut" }}
              className="rounded-card border border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 p-6 shadow-glow-brand"
            >
              <h3 className="text-xl font-bold text-ink">Quick Revision Sprint</h3>
              <p className="mt-3 text-ink-muted">
                Use this mini plan right after watching to lock in retention.
              </p>
              <ol className="mt-5 space-y-3 text-ink-muted">
                <li className="rounded-control bg-surface/80 border border-cyan-100 px-4 py-3">1. Read summary once.</li>
                <li className="rounded-control bg-surface/80 border border-cyan-100 px-4 py-3">2. Say key points out loud.</li>
                <li className="rounded-control bg-surface/80 border border-cyan-100 px-4 py-3">3. Test yourself in 2 minutes.</li>
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
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-sunken px-4 py-2 text-ink-muted font-medium">
      {icon}
      {label}
    </span>
  );
}

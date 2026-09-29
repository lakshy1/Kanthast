import { motion } from "framer-motion";
import { useLocation, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaBookOpen, FaClock, FaExpand, FaLayerGroup } from "react-icons/fa";
import { getMedicineUsmleVideoDetails } from "../utils/authApi";
import { ImagesPageSkeleton } from "../components/DataLoaderSkeletons";

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

export default function ImagesPage() {
  const data = useLectureQuery();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(Boolean(data.subjectId && data.chapterId && data.videoId));
  const [loadError, setLoadError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let mounted = true;
    if (!data.subjectId || !data.chapterId || !data.videoId) {
      setLoading(false);
      return undefined;
    }

    (async () => {
      try {
        setLoading(true);
        setLoadError(false);
        const response = await getMedicineUsmleVideoDetails({
          subjectId: data.subjectId,
          chapterId: data.chapterId,
          videoId: data.videoId,
        });
        if (!mounted) return;
        setPhotos(Array.isArray(response.video?.photos) ? response.video.photos : []);
      } catch {
        if (!mounted) return;
        setPhotos([]);
        setLoadError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [data.subjectId, data.chapterId, data.videoId, attempt]);

  // No stand-in art: a lecture without published images says so. The old
  // fallback showed AI-generated banners (one advertising MCAT/NCLEX).
  const gallery = useMemo(() => {
    return photos
      .filter((item) => item?.imageLink)
      .map((item, index) => ({
        imageLink: item.imageLink,
        imageText: item.imageText || `Image ${index + 1}`,
      }));
  }, [photos]);

  return (
    <div className="min-h-screen bg-surface-sunken px-4 md:px-8 py-8">
      <div className="page-frame">
        <Link
          to="/lists"
          className="inline-flex items-center gap-2 text-ink-muted hover:text-ink font-medium"
        >
          <FaArrowLeft /> Back to Library
        </Link>

        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mt-4 rounded-card border border-line bg-surface/90 p-6 shadow-e4"
        >
          <h1 className="text-3xl md:text-4xl font-black text-ink">{data.title}</h1>
          <div className="mt-4 flex flex-wrap gap-3">
            <Chip icon={<FaLayerGroup />} label={data.module} />
            <Chip icon={<FaBookOpen />} label={data.section} />
            <Chip icon={<FaClock />} label={data.duration} />
          </div>
        </motion.header>

        {loading ? (
          <ImagesPageSkeleton />
        ) : loadError ? (
          <div className="mt-6 rounded-card border border-line bg-surface p-8 text-center shadow-e2">
            <p className="font-semibold text-ink">We couldn't load this lecture's images.</p>
            <p className="mt-1 text-ink-muted">Check your connection and try again.</p>
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="btn-primary mt-5">
              Try again
            </button>
          </div>
        ) : gallery.length === 0 ? (
          <div className="mt-6 rounded-card border border-line bg-surface p-8 text-center shadow-e2">
            <p className="font-semibold text-ink">No images for this lecture yet.</p>
            <p className="mt-1 text-ink-muted">Images are added as each lecture is published.</p>
            <Link to="/lists" className="btn-secondary mt-5">Back to Library</Link>
          </div>
        ) : (
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
            className="mt-6 grid sm:grid-cols-2 xl:grid-cols-3 gap-5"
          >
            {gallery.map((item, idx) => (
              <motion.article
                key={`${item.imageLink}-${idx}`}
                whileHover={{ y: -4 }}
                className="group rounded-card overflow-hidden border border-line bg-surface shadow-e3"
              >
                <div className="relative">
                  <img src={item.imageLink} alt={`${data.title} visual ${idx + 1}`} className="w-full h-52 object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition" />
                  <a
                    href={item.imageLink}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Open image ${idx + 1} full size`}
                    className="absolute top-2 right-2 grid h-touch w-touch place-items-center rounded-full bg-surface/90 text-ink-muted opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                  >
                    <FaExpand />
                  </a>
                </div>
                <div className="p-4">
                  <p className="font-semibold text-ink">Image {idx + 1}</p>
                  <p className="text-sm text-ink-muted mt-1">{item.imageText || "Key visual aid for rapid recall."}</p>
                </div>
              </motion.article>
            ))}
          </motion.section>
        )}
      </div>
    </div>
  );
}

function Chip({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-sunken px-4 py-2 text-ink-muted font-medium">
      {icon}
      {label}
    </span>
  );
}

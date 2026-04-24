import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaRegFileAlt, FaPlay, FaRegImage, FaChevronRight, FaLock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getMedicineUsmleContent } from "../utils/authApi";
import { ListsPageSkeleton } from "../components/DataLoaderSkeletons";

function buildModulesFromApi(content) {
  const moduleMap = {};

  for (const subject of content?.subjects || []) {
    const subjectName = subject?.name?.trim();
    if (!subjectName) continue;

    moduleMap[subjectName] = {
      totalDuration: subject.totalDuration || "--:--",
      sections: (subject.chapters || []).map((chapter, chapterIndex) => ({
        title: chapter.name || `Chapter ${chapterIndex + 1}`,
        total: chapter.totalDuration || "--:--",
        id:
          chapter._id ||
          chapter.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") ||
          `chapter-${chapterIndex + 1}`,
        lectures: (chapter.videos || []).map((video, videoIndex) => ({
          title: video.name || `Video ${videoIndex + 1}`,
          duration: video.duration || "--:--",
          summary: video.summary || "",
          videoLink: video.videoLink || "",
          photos: Array.isArray(video.photos) ? video.photos : [],
          videoId: video._id || "",
          chapterId: chapter._id || "",
          subjectId: subject._id || "",
        })),
      })),
    };
  }

  return moduleMap;
}

export default function Lists() {
  const [activeTab, setActiveTab] = useState("Biochemistry");
  const [dbModules, setDbModules] = useState({});
  const [catalogLoading, setCatalogLoading] = useState(true);
  const sectionRefs = useRef({});
  const navigate = useNavigate();
  const hasSubscription = useMemo(() => {
    try {
      const user = JSON.parse(localStorage.getItem("kanthastUser") || "null");
      return Boolean(user?.subscriptionPurchased);
    } catch {
      return false;
    }
  }, []);
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setCatalogLoading(true);
        const data = await getMedicineUsmleContent();
        if (!mounted) return;
        const mapped = buildModulesFromApi(data.content);
        setDbModules(mapped);
      } catch {
        if (!mounted) return;
        setDbModules({});
      } finally {
        if (mounted) setCatalogLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const tabs = useMemo(() => Object.keys(dbModules), [dbModules]);
  const activeModule = useMemo(
    () => dbModules[activeTab] || dbModules[tabs[0]] || { totalDuration: "--:--", sections: [] },
    [activeTab, dbModules, tabs]
  );

  useEffect(() => {
    if (!tabs.length) return;
    if (!tabs.includes(activeTab)) {
      setActiveTab(tabs[0]);
    }
  }, [tabs, activeTab]);

  const jumpTo = (sectionId) => {
    const target = sectionRefs.current[sectionId];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openLectureResource = (resourceType, sectionTitle, lecture) => {
    const params = new URLSearchParams({
      module: activeTab,
      section: sectionTitle,
      title: lecture.title,
      duration: lecture.duration,
    });
    if (lecture.subjectId) params.set("subjectId", lecture.subjectId);
    if (lecture.chapterId) params.set("chapterId", lecture.chapterId);
    if (lecture.videoId) params.set("videoId", lecture.videoId);

    navigate(`/${resourceType}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_20%,_#f5f7ff,_#edf2ff_35%,_#eef4ff_70%)] px-4 md:px-8 py-8">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {tabs.map((tab, index) => (
              <motion.button
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.35, ease: "easeOut" }}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 px-8 py-3 rounded-2xl border text-lg font-bold transition ${
                  activeTab === tab
                    ? "bg-white shadow-md border-slate-200 text-slate-900"
                    : "bg-transparent border-slate-300 text-slate-700 hover:bg-white/70"
                }`}
              >
                {tab}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8 items-start">
          {catalogLoading ? (
            <ListsPageSkeleton />
          ) : !tabs.length ? (
            <div className="rounded-3xl bg-white/80 border border-slate-200 p-8">
              <p className="text-slate-700 text-lg font-semibold">
                No courses available yet. Please check back soon or contact support.
              </p>
            </div>
          ) : (
          <>
          <div className="space-y-8">
            <div className="px-2">
              <h1 className="text-5xl font-black text-slate-900">
                {activeTab}{" "}
                <span className="text-4xl text-slate-500 font-medium">({activeModule.totalDuration})</span>
              </h1>
            </div>

            {activeModule.sections.map((sec, sectionIndex) => (
              <motion.section
                key={sec.id}
                ref={(el) => {
                  sectionRefs.current[sec.id] = el;
                }}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: sectionIndex * 0.015, duration: 0.45, ease: "easeOut" }}
                className="scroll-mt-24"
              >
                <div className="rounded-3xl bg-white/80 border border-slate-200 p-6 md:p-7 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur">
                  <h2 className="text-4xl md:text-5xl font-black text-slate-900">
                    {sec.title} <span className="text-3xl text-slate-500 font-medium">({sec.total})</span>
                  </h2>

                  <div className="mt-6 space-y-2">
                    {sec.lectures.map((lecture, lectureIndex) => (
                      <div
                        key={`${sec.id}-${lecture.title}-${lectureIndex}`}
                        className="rounded-2xl px-4 py-3 hover:bg-slate-50 transition-colors duration-300"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div className="min-w-0 pr-2">
                            <p className="text-[1.65rem] leading-tight font-medium text-slate-800 line-clamp-2">{lecture.title}</p>
                            <p className="text-sm text-slate-500 mt-1">({lecture.duration})</p>
                          </div>

                          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
                            <ActionButton
                              label="Summary"
                              icon={<FaRegFileAlt />}
                              onClick={() => openLectureResource("summary", sec.title, lecture)}
                            />
                            <ActionButton
                              label="Video"
                              icon={<FaPlay />}
                              locked={!hasSubscription && lectureIndex >= 2}
                              onClick={() => openLectureResource("video", sec.title, lecture)}
                              onLockedClick={() => navigate("/subscription")}
                            />
                            <ActionButton
                              label="Photo"
                              icon={<FaRegImage />}
                              locked={!hasSubscription && lectureIndex >= 2}
                              onClick={() => openLectureResource("images", sec.title, lecture)}
                              onLockedClick={() => navigate("/subscription")}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>
            ))}
          </div>

          <aside className="self-start lg:sticky lg:top-24 overflow-visible h-fit">
            <div className="rounded-3xl bg-slate-50 border border-slate-200 p-6 shadow-[0_15px_35px_rgba(15,23,42,0.07)] overflow-visible">
              <p className="text-xl font-semibold text-slate-900 mb-4">Jump to:</p>
              <div className="space-y-2">
                {activeModule.sections.map((sec) => (
                  <button
                    key={`jump-${sec.id}`}
                    onClick={() => jumpTo(sec.id)}
                    className="w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-slate-800 font-semibold hover:bg-white/85 transition"
                  >
                    <span>{sec.title}</span>
                    <FaChevronRight className="text-xs text-slate-500" />
                  </button>
                ))}
              </div>
            </div>
          </aside>
          </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, onClick, locked = false, onLockedClick }) {
  const lockedMessage = "Subscribe to access all the content (open subscription page)";

  return (
    <div className="relative group/lock">
      <motion.button
        whileHover={locked ? undefined : { scale: 1.06, y: -1 }}
        whileTap={locked ? undefined : { scale: 0.95 }}
        onClick={locked ? onLockedClick : onClick}
        className={`relative w-9 h-9 md:w-11 md:h-11 rounded-full border transition flex items-center justify-center ${
          locked
            ? "border-slate-200 bg-slate-100 text-slate-300 opacity-60 cursor-not-allowed"
            : "border-slate-300 bg-white/90 text-slate-600 hover:text-slate-900 hover:border-slate-500"
        }`}
        aria-label={label}
        title={locked ? lockedMessage : label}
        type="button"
      >
        {icon}
        {locked && (
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] grid place-items-center">
            <FaLock />
          </span>
        )}
      </motion.button>

      {locked && (
        <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 group-hover/lock:opacity-100 transition">
          {lockedMessage}
        </span>
      )}
    </div>
  );
}

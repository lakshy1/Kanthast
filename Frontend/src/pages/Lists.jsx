import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaRegFileAlt, FaPlay, FaRegImage, FaChevronRight, FaLock, FaThList, FaTimes, FaChevronDown } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getMedicineUsmleContent, getProfile } from "../utils/authApi";
import { ListsPageSkeleton } from "../components/DataLoaderSkeletons";
import { useAppSettings } from "../utils/settings";
import {
  buildSchoolModules,
  getSchoolClassLabel,
  getSelectedSchoolClass,
  hasPaidForSchoolClass,
  isSchoolTrack,
} from "../utils/schoolTrack";

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
  const settings = useAppSettings();
  const schoolMode = isSchoolTrack();
  const selectedSchoolClass = getSelectedSchoolClass();
  const selectedSchoolClassLabel = getSchoolClassLabel(selectedSchoolClass);
  const [activeTab, setActiveTab] = useState(schoolMode ? "Science" : "Biochemistry");
  const [dbModules, setDbModules] = useState({});
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(null);
  const [colHeight, setColHeight] = useState(null);
  const [isSectionsOpen, setIsSectionsOpen] = useState(false);
  const [isSubjectsOpen, setIsSubjectsOpen] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);
  const [watched, setWatched] = useState(() => {
    try { return JSON.parse(localStorage.getItem("kanthastWatched") || "{}"); }
    catch { return {}; }
  });

  const sectionRefs = useRef({});
  const leftColRef = useRef(null);
  const rightCardRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // Capture deep-link params once at mount — cleared after use so re-renders don't re-apply
  const deepSubject = useRef(searchParams.get("subject"));
  const deepChapter = useRef(searchParams.get("chapter"));
  const compact = settings.compactLayout;
  const MotionDiv = motion.div;
  const MotionButton = motion.button;
  const MotionSection = motion.section;

  const hasSubscription = useMemo(() => {
    if (schoolMode) return hasPaidForSchoolClass();
    try {
      const user = JSON.parse(localStorage.getItem("kanthastUser") || "null");
      return Boolean(user?.subscriptionPurchased);
    } catch { return false; }
  }, [schoolMode, profileVersion]);

  useEffect(() => {
    const token = localStorage.getItem("kanthastToken");
    if (!token) return;

    let mounted = true;
    getProfile(token)
      .then((data) => {
        if (!mounted || !data.user) return;
        localStorage.setItem("kanthastUser", JSON.stringify(data.user));
        setProfileVersion((version) => version + 1);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function syncWatched() {
      if (document.visibilityState === "visible") {
        try { setWatched(JSON.parse(localStorage.getItem("kanthastWatched") || "{}")); }
        catch { return; }
      }
    }
    document.addEventListener("visibilitychange", syncWatched);
    return () => document.removeEventListener("visibilitychange", syncWatched);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setCatalogLoading(true);
        if (schoolMode) {
          setDbModules(hasPaidForSchoolClass() ? buildSchoolModules(selectedSchoolClass) : {});
          return;
        }
        const data = await getMedicineUsmleContent();
        if (!mounted) return;
        setDbModules(buildModulesFromApi(data.content));
      } catch {
        if (!mounted) return;
        setDbModules({});
      } finally {
        if (mounted) setCatalogLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [schoolMode, selectedSchoolClass, profileVersion]);

  const tabs = useMemo(() => Object.keys(dbModules), [dbModules]);
  const activeModule = useMemo(
    () => dbModules[activeTab] || dbModules[tabs[0]] || { totalDuration: "--:--", sections: [] },
    [activeTab, dbModules, tabs]
  );

  const activeSectionTitle = useMemo(() => {
    const sec = activeModule.sections.find((s) => s.id === activeSection);
    return sec?.title ?? "Chapters";
  }, [activeModule.sections, activeSection]);

  const activeSectionDuration = useMemo(() => {
    const sec = activeModule.sections.find((s) => s.id === activeSection);
    return sec?.total ?? "--:--";
  }, [activeModule.sections, activeSection]);

  useEffect(() => {
    if (!tabs.length) return;
    // If a deep-link subject was passed, jump to it; otherwise fall back to first tab
    if (deepSubject.current && tabs.includes(deepSubject.current)) {
      setActiveTab(deepSubject.current);
      deepSubject.current = null; // apply only once
      setSearchParams({}, { replace: true }); // clean URL
    } else if (!tabs.includes(activeTab)) {
      setActiveTab(tabs[0]);
    }
  }, [tabs]);

  // Measure the right card's natural height; left column matches it (min 80vh)
  useEffect(() => {
    const el = rightCardRef.current;
    if (!el) return;

    const measure = () => {
      setColHeight(Math.max(el.offsetHeight, window.innerHeight));
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);

    window.addEventListener("resize", measure, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [activeModule]);

  // Reset scroll + active section when tab changes
  useEffect(() => {
    if (leftColRef.current) leftColRef.current.scrollTop = 0;
    setActiveSection(activeModule.sections[0]?.id ?? null);
  }, [activeTab, activeModule]);

  // After tab + sections settle, scroll to the deep-link chapter if one was passed
  useEffect(() => {
    const chId = deepChapter.current;
    if (!chId || !activeModule.sections.length) return;
    const sec = activeModule.sections.find((s) => s.id === chId);
    if (!sec) return;
    deepChapter.current = null; // apply only once
    const t = setTimeout(() => {
      setActiveSection(sec.id);
      jumpTo(sec.id);
    }, 350); // wait for DOM + scroll reset from above effect
    return () => clearTimeout(t);
  }, [activeModule.sections]);

  // Intersection Observer — uses the left column as scroll root
  useEffect(() => {
    const container = leftColRef.current;
    if (!container || !activeModule.sections.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = Object.keys(sectionRefs.current).find(
              (k) => sectionRefs.current[k] === entry.target
            );
            if (id) setActiveSection(id);
          }
        });
      },
      { root: container, rootMargin: "-40px 0px -70% 0px", threshold: 0 }
    );

    const refs = sectionRefs.current;
    Object.values(refs).forEach((el) => { if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [activeModule, colHeight]); // re-observe after colHeight settles

  // Smooth-scroll within the left column — positions the heading at the top
  const jumpTo = (sectionId) => {
    const target = sectionRefs.current[sectionId];
    const container = leftColRef.current;
    if (!target || !container) return;
    const containerTop = container.getBoundingClientRect().top;
    const targetTop = target.getBoundingClientRect().top;
    const scrollTo = container.scrollTop + (targetTop - containerTop) - 8;
    container.scrollTo({ top: scrollTo, behavior: "smooth" });
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
    <div className={`min-h-screen bg-[radial-gradient(circle_at_10%_20%,_#f5f7ff,_#edf2ff_35%,_#eef4ff_70%)] ${compact ? "px-3 md:px-6 py-6" : "px-4 md:px-8 py-8"}`}>
      <div className="max-w-[1400px] mx-auto">

        {/* ── Subject tabs (desktop only — mobile uses bottom sheet pill) ── */}
        <MotionDiv
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={`hidden lg:block ${compact ? "mb-6" : "mb-8"}`}
        >
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
            {tabs.map((tab, index) => (
              <MotionButton
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.35, ease: "easeOut" }}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 ${compact ? "px-3 py-2 text-sm sm:px-6 sm:py-2.5 sm:text-base" : "px-4 py-2 text-sm sm:px-8 sm:py-3 sm:text-lg"} rounded-2xl border font-bold transition ${
                  activeTab === tab
                    ? "bg-white shadow-md border-slate-200 text-slate-900"
                    : "bg-transparent border-slate-300 text-slate-700 hover:bg-white/70"
                }`}
              >
                {tab}
              </MotionButton>
            ))}
          </div>
        </MotionDiv>

        {catalogLoading ? (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8">
            <ListsPageSkeleton />
          </div>
        ) : !tabs.length ? (
          <div className="rounded-3xl bg-white/80 border border-slate-200 p-8">
            {schoolMode ? (
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">
                  Kanthast School
                </p>
                <h1 className="mt-2 text-3xl font-black text-slate-900">Activate a class to view Lists</h1>
                <p className="mt-3 max-w-2xl text-slate-600">
                  Lists show only the content for the class the student has paid for. Choose a class from I-X and
                  activate the annual plan to unlock subject-wise chapters here.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/subscription")}
                  className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white transition hover:bg-slate-800"
                >
                  Choose Class and Subscribe
                </button>
              </div>
            ) : (
              <p className="text-slate-700 text-lg font-semibold">
                No courses available yet. Please check back soon or contact support.
              </p>
            )}
          </div>
        ) : (
          <div className="lg:flex lg:gap-8 items-start">

            {/* ── Left column ──
                Height = right card height (or 80vh minimum).
                Content scrolls internally; window does not scroll. */}
            <div
              ref={leftColRef}
              className="flex-1 min-w-0 overflow-y-auto no-scrollbar"
              style={{ height: colHeight ? `${colHeight}px` : "100vh" }}
            >
              <div className="space-y-8 pb-6">
                <div className="px-2">
                  {/* Mobile: subject selector opens bottom sheet */}
                  <button
                    onClick={() => setIsSubjectsOpen(true)}
                    className="lg:hidden w-full flex items-center justify-between text-left group"
                  >
                    <span className="text-2xl font-black text-slate-900 truncate">
                      {schoolMode ? `${selectedSchoolClassLabel} - ${activeTab}` : activeTab}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <span className="text-lg text-slate-500 font-medium">({activeModule.totalDuration})</span>
                      <FaChevronDown className="text-slate-400 text-xs transition group-hover:text-slate-600" />
                    </div>
                  </button>

                  {/* Desktop: plain title */}
                  <h1 className="hidden lg:block text-4xl md:text-5xl font-black text-slate-900">
                    {schoolMode ? `${selectedSchoolClassLabel} - ${activeTab}` : activeTab}{" "}
                    <span className="text-2xl md:text-4xl text-slate-500 font-medium">({activeModule.totalDuration})</span>
                  </h1>
                </div>

                {activeModule.sections.map((sec, sectionIndex) => (
                  <MotionSection
                    key={sec.id}
                    ref={(el) => { sectionRefs.current[sec.id] = el; }}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px", root: leftColRef }}
                    transition={{ delay: sectionIndex * 0.015, duration: 0.45, ease: "easeOut" }}
                  >
                    <div className={`rounded-3xl bg-white/80 border border-slate-200 ${compact ? "p-5 md:p-6" : "p-6 md:p-7"} shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur`}>
                      <h2 className={`font-black text-slate-900 ${compact ? "text-xl sm:text-2xl md:text-4xl" : "text-xl sm:text-3xl md:text-5xl"}`}>
                        {sec.title} <span className={`${compact ? "text-base sm:text-xl" : "text-base sm:text-2xl"} text-slate-500 font-medium`}>({sec.total})</span>
                      </h2>

                      <div className="mt-6 space-y-2">
                        {sec.lectures.map((lecture, lectureIndex) => (
                          <div
                            key={`${sec.id}-${lecture.title}-${lectureIndex}`}
                            className="rounded-2xl px-4 py-3 hover:bg-slate-50 transition-colors duration-300"
                          >
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                              <div className="min-w-0 pr-2">
                                <p className="text-sm sm:text-base md:text-[1.35rem] leading-tight font-medium text-slate-800 line-clamp-2">{lecture.title}</p>
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
                                  watched={Boolean(lecture.videoId && watched[lecture.videoId])}
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
                  </MotionSection>
                ))}
              </div>
            </div>

            {/* ── Right column ──
                Natural content height — no max-height, no internal scroll.
                Its measured height drives the left column's height. */}
            <div className="hidden lg:block w-[360px] shrink-0">
              <div
                ref={rightCardRef}
                className="rounded-3xl bg-slate-50 border border-slate-200 shadow-[0_15px_35px_rgba(15,23,42,0.07)]"
              >
                <p className="text-xl font-semibold text-slate-900 px-6 pt-4 pb-3 border-b border-slate-100">
                  Jump to:
                </p>
                <div className="px-4 py-3 space-y-0.5">
                  {activeModule.sections.map((sec) => {
                    const isActive = activeSection === sec.id;
                    return (
                      <button
                        key={`jump-${sec.id}`}
                        onClick={() => jumpTo(sec.id)}
                        className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-xl font-semibold transition-all duration-200 ${
                          isActive
                            ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                            : "text-slate-700 hover:bg-white hover:text-slate-900"
                        }`}
                      >
                        <span className="text-[0.95rem] leading-snug">{sec.title}</span>
                        <FaChevronRight
                          className={`text-xs shrink-0 ml-2 transition-colors ${
                            isActive ? "text-cyan-400" : "text-slate-400"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── Mobile: chapters pill + both bottom sheets ── */}
      {!catalogLoading && tabs.length > 0 && (
        <>
          {/* Chapters floating pill (right) — hidden while any sheet is open */}
          <AnimatePresence>
            {!isSectionsOpen && !isSubjectsOpen && (
              <motion.button
                key="chapters-pill"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsSectionsOpen(true)}
                className="fixed bottom-[4.75rem] right-4 z-30 lg:hidden flex items-center gap-2 rounded-full bg-white border border-slate-200 shadow-lg px-4 py-2.5 text-slate-800 font-semibold text-sm"
              >
                <FaThList className="text-cyan-600 text-sm shrink-0" />
                <span className="max-w-[140px] truncate">{activeSectionTitle}</span>
                <FaChevronDown className="text-slate-400 text-xs shrink-0" />
              </motion.button>
            )}
          </AnimatePresence>

          {/* Subjects bottom sheet */}
          <AnimatePresence>
            {isSubjectsOpen && (
              <>
                <motion.div
                  key="subjects-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                  onClick={() => setIsSubjectsOpen(false)}
                />
                <motion.div
                  key="subjects-sheet"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  className="fixed bottom-0 left-0 right-0 z-50 lg:hidden rounded-t-3xl bg-white shadow-[0_-8px_30px_rgba(15,23,42,0.12)] max-h-[70vh] flex flex-col"
                >
                  <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-slate-200" />
                  </div>
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
                    <p className="text-base font-bold text-slate-900">Select subject</p>
                    <button
                      onClick={() => setIsSubjectsOpen(false)}
                      className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
                    >
                      <FaTimes className="text-sm" />
                    </button>
                  </div>
                  <div
                    className="overflow-y-auto px-3 py-3 space-y-0.5"
                    style={{ paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
                  >
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab;
                      return (
                        <button
                          key={`mobile-subject-${tab}`}
                          onClick={() => { setActiveTab(tab); setIsSubjectsOpen(false); }}
                          className={`w-full flex items-center justify-between text-left px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                            isActive
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <span className="text-[0.95rem] leading-snug pr-2">{tab}</span>
                          <FaChevronRight
                            className={`text-xs shrink-0 transition-colors ${
                              isActive ? "text-blue-400" : "text-slate-400"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Chapters bottom sheet */}
          <AnimatePresence>
            {isSectionsOpen && (
              <>
                {/* Backdrop */}
                <motion.div
                  key="chapters-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                  onClick={() => setIsSectionsOpen(false)}
                />

                {/* Sheet */}
                <motion.div
                  key="chapters-sheet"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  className="fixed bottom-0 left-0 right-0 z-50 lg:hidden rounded-t-3xl bg-white shadow-[0_-8px_30px_rgba(15,23,42,0.12)] max-h-[70vh] flex flex-col"
                >
                  {/* Drag handle */}
                  <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-slate-200" />
                  </div>

                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 shrink-0">
                    <p className="text-base font-bold text-slate-900">Jump to chapter</p>
                    <button
                      onClick={() => setIsSectionsOpen(false)}
                      className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
                    >
                      <FaTimes className="text-sm" />
                    </button>
                  </div>

                  {/* Chapters list */}
                  <div
                    className="overflow-y-auto px-3 py-3 space-y-0.5"
                    style={{ paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
                  >
                    {activeModule.sections.map((sec) => {
                      const isActive = activeSection === sec.id;
                      return (
                        <button
                          key={`mobile-jump-${sec.id}`}
                          onClick={() => { jumpTo(sec.id); setIsSectionsOpen(false); }}
                          className={`w-full flex items-center justify-between text-left px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                            isActive
                              ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                              : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                        >
                          <span className="text-[0.95rem] leading-snug pr-2">{sec.title}</span>
                          <FaChevronRight
                            className={`text-xs shrink-0 transition-colors ${
                              isActive ? "text-cyan-400" : "text-slate-400"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

function ActionButton({ icon, label, onClick, locked = false, onLockedClick, watched = false }) {
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
            : watched
            ? "border-green-200 bg-green-50 text-green-600 hover:bg-green-100 hover:border-green-300"
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

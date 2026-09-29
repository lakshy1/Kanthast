import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaRegFileAlt, FaPlay, FaRegImage, FaChevronRight, FaLock, FaThList, FaTimes, FaChevronDown, FaSearch } from "react-icons/fa";
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
  mergeSchoolClassIntoUser,
  setSelectedSchoolClass,
  schoolClassOptions,
} from "../utils/schoolTrack";

// Auto-generated school lecture titles all end in "... {chapter name}" (see
// SUBJECT_TOPIC_PATTERNS in schoolTrack.js), which is redundant once the
// chapter is already the section heading directly above each lecture list —
// every row repeated the full chapter name back at the reader. Trims that
// trailing echo for display only; the full title is still what's stored and
// used elsewhere (video page breadcrumbs, search).
function displayLectureTitle(lectureTitle, chapterTitle) {
  if (!chapterTitle) return lectureTitle;
  const suffix = ` ${chapterTitle}`;
  if (!lectureTitle.endsWith(suffix)) return lectureTitle;
  const trimmed = lectureTitle.slice(0, -suffix.length).replace(/\s+(of|in|for|from|on)$/i, "");
  return trimmed || lectureTitle;
}

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
  const [selectedSchoolClass, setSelectedSchoolClassState] = useState(() => getSelectedSchoolClass());
  const selectedSchoolClassLabel = getSchoolClassLabel(selectedSchoolClass);
  const [activeTab, setActiveTab] = useState(schoolMode ? "Science" : "Biochemistry");
  const [dbModules, setDbModules] = useState({});
  const [catalogLoading, setCatalogLoading] = useState(true);
  // A failed fetch is not an empty catalog — keep them apart so the student
  // sees "try again", not "no courses".
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
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
  const isLoggedIn = Boolean(localStorage.getItem("kanthastToken"));
  const schoolFreeAccessLimit = 10;

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
        setLoadError(false);
        if (schoolMode) {
          setDbModules(buildSchoolModules(selectedSchoolClass));
          return;
        }
        const data = await getMedicineUsmleContent();
        if (!mounted) return;
        setDbModules(buildModulesFromApi(data.content));
      } catch {
        if (!mounted) return;
        setDbModules({});
        setLoadError(true);
      } finally {
        if (mounted) setCatalogLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [schoolMode, selectedSchoolClass, profileVersion, reloadKey]);

  const trimmedQuery = query.trim();
  const searching = trimmedQuery.length > 0;

  // Client-side search across every subject and chapter already loaded.
  // Keeps each lecture's original index so lock rules match the normal view.
  const searchResults = useMemo(() => {
    if (!searching) return [];
    const needle = trimmedQuery.toLowerCase();
    const groups = [];
    for (const [moduleName, module] of Object.entries(dbModules)) {
      for (const sec of module.sections || []) {
        const matches = [];
        sec.lectures.forEach((lecture, lectureIndex) => {
          if (lecture.title.toLowerCase().includes(needle)) matches.push({ lecture, lectureIndex });
        });
        if (matches.length) groups.push({ moduleName, sec, matches });
      }
    }
    return groups;
  }, [dbModules, searching, trimmedQuery]);

  const searchMatchCount = useMemo(
    () => searchResults.reduce((sum, group) => sum + group.matches.length, 0),
    [searchResults]
  );

  useEffect(() => {
    if (!schoolMode) return;
    setSelectedSchoolClassState(getSelectedSchoolClass());
  }, [schoolMode, profileVersion]);

  const tabs = useMemo(() => Object.keys(dbModules), [dbModules]);
  const activeModule = useMemo(
    () => dbModules[activeTab] || dbModules[tabs[0]] || { totalDuration: "--:--", sections: [] },
    [activeTab, dbModules, tabs]
  );

  const activeSectionTitle = useMemo(() => {
    const sec = activeModule.sections.find((s) => s.id === activeSection);
    return sec?.title ?? "Chapters";
  }, [activeModule.sections, activeSection]);

  const schoolFreeAccessKeys = useMemo(() => {
    if (!schoolMode) return new Set();

    const subjectNames = Object.keys(dbModules);
    if (!subjectNames.length) return new Set();

    const perSubjectLimit = Math.floor(schoolFreeAccessLimit / subjectNames.length);
    const remainder = schoolFreeAccessLimit % subjectNames.length;
    const unlockedKeys = new Set();

    subjectNames.forEach((subjectName, subjectIndex) => {
      const subject = dbModules[subjectName];
      const subjectKeys = [];

      for (const section of subject?.sections || []) {
        for (const lecture of section.lectures || []) {
          subjectKeys.push(`${section.id}:${lecture.videoId || lecture.title}`);
        }
      }

      const subjectLimit = perSubjectLimit + (subjectIndex < remainder ? 1 : 0);
      subjectKeys.slice(0, subjectLimit).forEach((key) => unlockedKeys.add(key));
    });

    return unlockedKeys;
  }, [dbModules, schoolMode]);

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
  }, [activeModule, searching]); // the card unmounts while searching

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
  }, [activeModule, colHeight, searching]); // re-observe after colHeight settles

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

  const openLectureResource = (resourceType, moduleName, sectionTitle, lecture) => {
    const params = new URLSearchParams({
      module: moduleName,
      section: sectionTitle,
      title: lecture.title,
      duration: lecture.duration,
    });
    if (lecture.subjectId) params.set("subjectId", lecture.subjectId);
    if (lecture.chapterId) params.set("chapterId", lecture.chapterId);
    if (lecture.videoId) params.set("videoId", lecture.videoId);
    navigate(`/${resourceType}?${params.toString()}`);
  };

  const handleSchoolClassChange = (event) => {
    const nextClass = event.target.value;
    setSelectedSchoolClass(nextClass);
    mergeSchoolClassIntoUser(nextClass);
    setSelectedSchoolClassState(nextClass);
  };

  const getLectureAccess = (sectionId, lecture, lectureIndex) => {
    if (!schoolMode) {
      return {
        notesLocked: false,
        videoLocked: !hasSubscription && lectureIndex >= 2,
        lockedTarget: "/subscription",
        lockedMessage: "Subscribe to access all the content",
        lockBadge: "Premium",
        lockReason: "locked, premium",
      };
    }

    if (hasSubscription) {
      return {
        notesLocked: false,
        videoLocked: false,
        lockedTarget: "/subscription",
        lockedMessage: "Subscribe to access all the content",
        lockBadge: "Premium",
        lockReason: "locked, premium",
      };
    }

    const accessKey = `${sectionId}:${lecture.videoId || lecture.title}`;
    const isWithinFreeLimit = schoolFreeAccessKeys.has(accessKey);
    const lockedTarget = isLoggedIn ? "/subscription" : "/login";
    const lockedMessage = isLoggedIn
      ? "Free users can open only the first 10 topics. Subscribe to unlock the rest."
      : "Log in to open the first 10 free topics.";

    return {
      notesLocked: !isLoggedIn || !isWithinFreeLimit,
      videoLocked: !isLoggedIn || !isWithinFreeLimit,
      lockedTarget,
      lockedMessage,
      lockBadge: isLoggedIn ? "Premium" : "Log in to open",
      lockReason: isLoggedIn ? "locked, premium" : "locked, log in required",
    };
  };

  // One lecture row. The title is a real <button> whose ::after stretches over
  // the whole row, so a click anywhere opens the lecture, while the action
  // buttons sit above it (z-10) as siblings — no nested interactive elements,
  // and every control stays in the tab order.
  const renderLectureRow = (moduleName, sec, lecture, lectureIndex) => {
    const access = getLectureAccess(sec.id, lecture, lectureIndex);
    const title = displayLectureTitle(lecture.title, sec.title);
    const comingSoon = !lecture.videoLink;
    const metaId = `lecture-meta-${sec.id}-${lectureIndex}`.replace(/[^a-zA-Z0-9_-]/g, "-");
    const stateText = (locked, extra) =>
      [locked ? access.lockReason : "", extra].filter(Boolean).join(", ");
    const withState = (verb, locked, extra) => {
      const state = stateText(locked, extra);
      return `${verb} ${title}${state ? ` (${state})` : ""}`;
    };
    const openVideo = () =>
      access.videoLocked ? navigate(access.lockedTarget) : openLectureResource("video", moduleName, sec.title, lecture);

    return (
      <div
        key={`${moduleName}-${sec.id}-${lecture.title}-${lectureIndex}`}
        className="relative rounded-card px-4 py-3 transition-colors duration-base ease-brand hover:bg-surface-sunken"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="min-w-0 pr-2">
            <button
              type="button"
              onClick={openVideo}
              aria-describedby={metaId}
              className="block text-left text-base md:text-lg leading-snug font-semibold text-ink line-clamp-2 rounded-control after:absolute after:inset-0 after:rounded-card"
            >
              {title}
            </button>
            <p id={metaId} className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-subtle tabular-nums">
              <span>{lecture.duration}</span>
              {comingSoon && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Coming soon</span>
                </>
              )}
              {access.videoLocked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-caution-soft px-2 py-0.5 text-mini font-semibold text-caution">
                  <FaLock aria-hidden="true" className="text-micro" />
                  {access.lockBadge}
                </span>
              )}
            </p>
          </div>
          <div className="relative z-10 flex items-center gap-1.5 md:gap-2 shrink-0">
            <ActionButton
              label={schoolMode ? "Notes" : "Summary"}
              ariaLabel={withState(schoolMode ? "Notes for" : "Summary of", access.notesLocked)}
              icon={<FaRegFileAlt />}
              locked={access.notesLocked}
              lockedMessage={access.lockedMessage}
              onClick={() => openLectureResource("summary", moduleName, sec.title, lecture)}
              onLockedClick={() => navigate(access.lockedTarget)}
            />
            <ActionButton
              label={comingSoon ? "Video coming soon" : "Video"}
              ariaLabel={withState(comingSoon ? "Open" : "Play", access.videoLocked, comingSoon ? "video coming soon" : "")}
              icon={<FaPlay />}
              locked={access.videoLocked}
              lockedMessage={access.lockedMessage}
              watched={Boolean(lecture.videoId && watched[lecture.videoId])}
              onClick={() => openLectureResource("video", moduleName, sec.title, lecture)}
              onLockedClick={() => navigate(access.lockedTarget)}
            />
            {!schoolMode && (
              <ActionButton
                label="Images"
                ariaLabel={withState("Images for", access.videoLocked)}
                icon={<FaRegImage />}
                locked={access.videoLocked}
                lockedMessage={access.lockedMessage}
                onClick={() => openLectureResource("images", moduleName, sec.title, lecture)}
                onLockedClick={() => navigate("/subscription")}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  const sheetRowClass = (isActive) =>
    `w-full min-h-touch flex items-center justify-between text-left px-4 py-3 rounded-control font-semibold transition-colors duration-base ease-brand border ${
      isActive
        ? "bg-brand-soft text-brand border-brand/35"
        : "border-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink"
    }`;

  return (
    <div className={`min-h-screen bg-surface-sunken ${compact ? "px-3 md:px-6 py-6" : "px-4 md:px-8 py-8"}`}>
      <div className="page-frame">
        {schoolMode && (
          <MotionDiv
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className={`rounded-sheet border border-line bg-surface shadow-e4 ${compact ? "mb-5 p-4" : "mb-6 p-5"}`}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">Kanthast School</p>
                <h1 className="mt-2 text-2xl font-black text-ink md:text-3xl">Select class and explore subject-wise topics</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
                  Each subject opens chapter-wise topics with Notes and Video for every lesson.
                  Free accounts can open the first 10 topics — full access unlocks after subscription.
                </p>
              </div>
              <label className="block md:min-w-[220px]">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-ink-muted">Select class</span>
                <select
                  value={selectedSchoolClass}
                  onChange={handleSchoolClassChange}
                  className="field text-base font-semibold"
                >
                  {schoolClassOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </MotionDiv>
        )}


        {/* ── Subject tabs (desktop only — mobile uses bottom sheet pill) ── */}
        {!searching && (
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
                  aria-pressed={activeTab === tab}
                  className={`shrink-0 min-h-touch ${compact ? "px-3 py-2 text-sm sm:px-6 sm:py-2.5 sm:text-base" : "px-4 py-2 text-sm sm:px-8 sm:py-3 sm:text-lg"} rounded-card border font-bold transition-colors duration-base ease-brand ${
                    activeTab === tab
                      ? "bg-surface shadow-e2 border-line text-ink"
                      : "bg-transparent border-line-strong text-ink-muted hover:bg-surface/70 hover:text-ink"
                  }`}
                >
                  {tab}
                </MotionButton>
              ))}
            </div>
          </MotionDiv>
        )}

        {/* ── Search ── */}
        {!catalogLoading && tabs.length > 0 && (
          <div className={`max-w-xl px-2 lg:px-0 ${compact ? "mb-5" : "mb-6"}`}>
            <label htmlFor="lecture-search" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">
              Search lectures
            </label>
            <div className="relative">
              <FaSearch aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink-subtle" />
              <input
                id="lecture-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Escape") setQuery(""); }}
                placeholder="Lecture name, e.g. albinism"
                autoComplete="off"
                className="field pl-11 pr-12 [&::-webkit-search-cancel-button]:appearance-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-0 top-1/2 -translate-y-1/2 h-touch w-touch grid place-items-center rounded-full text-ink-subtle hover:text-ink"
                >
                  <FaTimes className="text-sm" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )}

        {catalogLoading ? (
          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px] gap-8">
            <ListsPageSkeleton />
          </div>
        ) : !tabs.length ? (
          loadError ? (
            <div role="alert" className="rounded-sheet bg-surface border border-line p-8">
              <p className="text-ink text-lg font-semibold">
                We couldn't load the library. Check your connection and try again.
              </p>
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="btn-primary mt-5"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="rounded-sheet bg-surface border border-line p-8">
              {schoolMode ? null : (
                <p className="text-ink-muted text-lg font-semibold">
                  No courses available yet. Please check back soon or contact support.
                </p>
              )}
            </div>
          )
        ) : searching ? (
          <div className="space-y-6 pb-24 lg:pb-6">
            <p aria-live="polite" className="px-2 text-sm text-ink-muted tabular-nums">
              {searchMatchCount
                ? `${searchMatchCount} ${searchMatchCount === 1 ? "lecture matches" : "lectures match"} “${trimmedQuery}”`
                : `No lectures match “${trimmedQuery}”.`}
            </p>
            {searchMatchCount === 0 && (
              <button type="button" onClick={() => setQuery("")} className="btn-secondary ml-2">
                Clear search
              </button>
            )}
            {searchResults.map(({ moduleName, sec, matches }) => (
              <section
                key={`search-${moduleName}-${sec.id}`}
                className={`rounded-sheet bg-surface border border-line ${compact ? "p-5 md:p-6" : "p-6 md:p-7"} shadow-e2`}
              >
                <h2 className="text-lg sm:text-xl font-black text-ink">
                  <span className="text-ink-subtle font-semibold">{moduleName} ›</span> {sec.title}
                </h2>
                <div className="mt-4 space-y-2">
                  {matches.map(({ lecture, lectureIndex }) => renderLectureRow(moduleName, sec, lecture, lectureIndex))}
                </div>
              </section>
            ))}
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
                    type="button"
                    onClick={() => setIsSubjectsOpen(true)}
                    aria-haspopup="dialog"
                    className="lg:hidden w-full min-h-touch flex items-center justify-between text-left group"
                  >
                    <span className="text-2xl font-black text-ink truncate">
                      {schoolMode ? `${selectedSchoolClassLabel} - ${activeTab}` : activeTab}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <span className="text-lg text-ink-subtle font-medium tabular-nums">({activeModule.totalDuration})</span>
                      <FaChevronDown className="text-ink-subtle text-xs transition group-hover:text-ink-muted" />
                    </div>
                  </button>

                  {/* Desktop: plain title. h2, not h1 — in school mode the
                      banner above is the page's h1, and two h1s on one page
                      break the document outline for screen readers. */}
                  <h2 className="hidden lg:block text-4xl md:text-5xl font-black text-ink">
                    {schoolMode ? `${selectedSchoolClassLabel} - ${activeTab}` : activeTab}{" "}
                    <span className="text-2xl md:text-4xl text-ink-subtle font-medium tabular-nums">({activeModule.totalDuration})</span>
                  </h2>
                </div>

                {activeModule.sections.map((sec, sectionIndex) => (
                  <MotionSection
                    key={sec.id}
                    ref={(el) => { sectionRefs.current[sec.id] = el; }}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: false, amount: 0.1, margin: "-60px", root: leftColRef }}
                    transition={{ delay: sectionIndex * 0.015, duration: 0.45, ease: "easeOut" }}
                  >
                    <div className={`rounded-sheet bg-surface border border-line ${compact ? "p-5 md:p-6" : "p-6 md:p-7"} shadow-e4`}>
                      <h2 className={`font-black text-ink ${compact ? "text-lg sm:text-xl md:text-2xl" : "text-xl sm:text-2xl md:text-3xl"}`}>
                        {sec.title} <span className={`${compact ? "text-sm" : "text-base"} text-ink-subtle font-medium tabular-nums`}>({sec.total})</span>
                      </h2>

                      <div className="mt-6 space-y-2">
                        {sec.lectures.map((lecture, lectureIndex) => renderLectureRow(activeTab, sec, lecture, lectureIndex))}
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
              <nav
                ref={rightCardRef}
                aria-label="Chapters"
                className="rounded-sheet bg-surface-raised border border-line shadow-e3"
              >
                <p className="text-xl font-semibold text-ink px-6 pt-4 pb-3 border-b border-line">
                  Jump to:
                </p>
                <div className="px-4 py-3 space-y-0.5">
                  {activeModule.sections.map((sec) => {
                    const isActive = activeSection === sec.id;
                    return (
                      <button
                        key={`jump-${sec.id}`}
                        type="button"
                        onClick={() => jumpTo(sec.id)}
                        aria-current={isActive ? "true" : undefined}
                        className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-control font-semibold border transition-colors duration-base ease-brand ${
                          isActive
                            ? "bg-brand-soft text-brand border-brand/35"
                            : "border-transparent text-ink-muted hover:bg-surface-sunken hover:text-ink"
                        }`}
                      >
                        <span className="text-base leading-snug">{sec.title}</span>
                        <FaChevronRight
                          aria-hidden="true"
                          className={`text-xs shrink-0 ml-2 transition-colors ${
                            isActive ? "text-brand" : "text-ink-subtle"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </nav>
            </div>

          </div>
        )}
      </div>

      {/* ── Mobile: chapters pill + both bottom sheets ── */}
      {!catalogLoading && tabs.length > 0 && !searching && (
        <>
          {/* Chapters floating pill (right) — hidden while any sheet is open */}
          <AnimatePresence>
            {!isSectionsOpen && !isSubjectsOpen && (
              <motion.button
                key="chapters-pill"
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setIsSectionsOpen(true)}
                aria-haspopup="dialog"
                aria-label={`Jump to chapter. Current: ${activeSectionTitle}`}
                // bottom-24 (96px) clears the mobile dock's own height (64px)
                // plus its scrim and safe-area padding with room to spare —
                // the old 4.75rem (76px) sat inside that zone and got clipped
                // by the dock painting over it.
                style={{ bottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
                className="fixed right-4 z-30 lg:hidden flex min-h-touch items-center gap-2 rounded-full bg-surface-raised border border-line shadow-e4 px-4 py-2.5 text-ink font-semibold text-sm"
              >
                <FaThList aria-hidden="true" className="text-brand text-sm shrink-0" />
                <span className="max-w-[140px] truncate">{activeSectionTitle}</span>
                <FaChevronDown aria-hidden="true" className="text-ink-subtle text-xs shrink-0" />
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
                  className="fixed inset-0 bg-ink/45 z-40 lg:hidden"
                  onClick={() => setIsSubjectsOpen(false)}
                />
                <motion.div
                  key="subjects-sheet"
                  role="dialog"
                  aria-label="Select subject"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  className="fixed bottom-0 left-0 right-0 z-50 lg:hidden rounded-t-sheet bg-surface-raised shadow-e5 max-h-[70vh] flex flex-col"
                >
                  <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-line-strong" />
                  </div>
                  <div className="flex items-center justify-between px-5 py-3 border-b border-line shrink-0">
                    <p className="text-base font-bold text-ink">Select subject</p>
                    <button
                      type="button"
                      onClick={() => setIsSubjectsOpen(false)}
                      aria-label="Close"
                      className="h-touch w-touch rounded-full bg-surface-sunken flex items-center justify-center text-ink-muted hover:text-ink transition"
                    >
                      <FaTimes aria-hidden="true" className="text-sm" />
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
                          type="button"
                          onClick={() => { setActiveTab(tab); setIsSubjectsOpen(false); }}
                          aria-current={isActive ? "true" : undefined}
                          className={sheetRowClass(isActive)}
                        >
                          <span className="text-base leading-snug pr-2">{tab}</span>
                          <FaChevronRight
                            aria-hidden="true"
                            className={`text-xs shrink-0 transition-colors ${isActive ? "text-brand" : "text-ink-subtle"}`}
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
                  className="fixed inset-0 bg-ink/45 z-40 lg:hidden"
                  onClick={() => setIsSectionsOpen(false)}
                />

                {/* Sheet */}
                <motion.div
                  key="chapters-sheet"
                  role="dialog"
                  aria-label="Jump to chapter"
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  className="fixed bottom-0 left-0 right-0 z-50 lg:hidden rounded-t-sheet bg-surface-raised shadow-e5 max-h-[70vh] flex flex-col"
                >
                  {/* Drag handle */}
                  <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-line-strong" />
                  </div>

                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-3 border-b border-line shrink-0">
                    <p className="text-base font-bold text-ink">Jump to chapter</p>
                    <button
                      type="button"
                      onClick={() => setIsSectionsOpen(false)}
                      aria-label="Close"
                      className="h-touch w-touch rounded-full bg-surface-sunken flex items-center justify-center text-ink-muted hover:text-ink transition"
                    >
                      <FaTimes aria-hidden="true" className="text-sm" />
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
                          type="button"
                          onClick={() => { jumpTo(sec.id); setIsSectionsOpen(false); }}
                          aria-current={isActive ? "true" : undefined}
                          className={sheetRowClass(isActive)}
                        >
                          <span className="text-base leading-snug pr-2">{sec.title}</span>
                          <FaChevronRight
                            aria-hidden="true"
                            className={`text-xs shrink-0 transition-colors ${isActive ? "text-brand" : "text-ink-subtle"}`}
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

function ActionButton({ icon, label, ariaLabel, onClick, locked = false, onLockedClick, watched = false, lockedMessage = "Subscribe to access all the content" }) {
  return (
    <div className="relative group/lock">
      <motion.button
        whileHover={locked ? undefined : { scale: 1.06, y: -1 }}
        whileTap={locked ? undefined : { scale: 0.95 }}
        onClick={locked ? onLockedClick : onClick}
        className={`relative h-touch w-touch rounded-full border transition-colors duration-fast ease-brand flex items-center justify-center ${
          locked
            ? "border-line bg-surface-sunken text-ink-subtle"
            : watched
            ? "border-positive/35 bg-positive-soft text-positive hover:border-positive"
            : "border-line-strong bg-surface text-ink-muted hover:text-ink hover:border-ink-subtle"
        }`}
        aria-label={ariaLabel || label}
        title={locked ? lockedMessage : label}
        type="button"
      >
        <span aria-hidden="true">{icon}</span>
        {locked && (
          <span aria-hidden="true" className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-caution text-ink-inverse text-micro grid place-items-center">
            <FaLock />
          </span>
        )}
      </motion.button>
      {locked && (
        <span aria-hidden="true" className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-control bg-ink px-2 py-1 text-micro text-ink-inverse opacity-0 group-hover/lock:opacity-100 transition">
          {lockedMessage}
        </span>
      )}
    </div>
  );
}

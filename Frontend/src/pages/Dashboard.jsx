import { useEffect, useMemo, useRef, useState } from "react";
import Image1 from "../assets/images/Image-1.png";
import Image2 from "../assets/images/Image-2.png";
import Image3 from "../assets/images/Image-3.png";
import Image4 from "../assets/images/Image-4.png";
import Image5 from "../assets/images/Image-5.png";
import { getMedicineUsmleContent } from "../utils/authApi";
import {
  FaPlay, FaCheck, FaChartBar, FaBolt,
  FaChevronLeft, FaChevronRight,
} from "react-icons/fa";

const IMAGES = [Image1, Image2, Image3, Image4, Image5];

const QUOTES = [
  "The good physician treats the disease; the great physician treats the patient who has the disease.",
  "Wherever the art of medicine is loved, there is also a love of humanity.",
  "Medicine is learned by the bedside and not in the classroom.",
  "To study medicine is to study humanity.",
  "The physician who knows only medicine knows not even medicine.",
  "Diagnosis is not the end, but the beginning of practice.",
  "The most important tool in medicine is a listening ear.",
  "Treat the patient, not the investigation.",
  "Every patient is a story — find its theme.",
  "When you hear hoofbeats, think horses — but know the zebras.",
  "History-taking is 80% of the diagnosis.",
  "Healing is a matter of time, but sometimes also a matter of opportunity.",
  "First, do no harm.",
  "Rare diseases are rare; common diseases present uncommonly.",
  "The art of medicine consists in amusing the patient while nature cures the disease.",
  "One of the first duties of a physician is to educate people not to take medicine.",
  "Empathy is the most evidence-based intervention in medicine.",
  "Humility is the foundation of all medical wisdom.",
  "Science advances, but the patient remains a human being.",
  "Communication is a clinical skill, not a soft skill.",
  "Active recall beats passive review every single time.",
  "Spaced repetition is your competitive edge over every rote learner.",
  "Test yourself often — retrieval practice is the superior study strategy.",
  "Interleaving subjects strengthens the connections between them.",
  "Struggle is where learning lives — embrace the hard questions.",
  "Teach what you just learned to cement it permanently.",
  "One wrong answer, analyzed deeply, is worth ten right ones skimmed.",
  "Focus on mechanisms — the details follow naturally.",
  "Understand the pathophysiology and every drug class becomes obvious.",
  "Mnemonics are scaffolding — build understanding, then remove the scaffold.",
  "Link every drug to mechanism, indication, and side effect immediately.",
  "Write summaries by hand — the pen cements memory that typing cannot.",
  "A well-drawn diagram replaces three paragraphs of notes.",
  "Sleep is not lost study time — it is when memories consolidate.",
  "Your brain rewires during rest, not just during study sessions.",
  "Review today what you learned yesterday — that gap is where retention lives.",
  "Clarity of concept precedes speed of recall.",
  "Read guidelines, not just textbooks — medicine evolves every year.",
  "Never memorize what you can derive from first principles.",
  "Volume of questions done separates good students from great ones.",
  "NEET PG rewards applied understanding, not raw memory.",
  "INI CET tests clinical reasoning first, facts second.",
  "USMLE Step 1 is a physiology exam wearing a factual disguise.",
  "Every question stem hides the diagnosis — read it twice.",
  "The distractor catches the person who half-understood.",
  "Eliminate, don't just select — distractors reveal the examiner's thinking.",
  "Time management in an exam is a skill; practice it deliberately.",
  "High-yield topics are high-yield because they are clinically important.",
  "Build stamina for long question papers the way athletes build endurance.",
  "Exam day performance is the output of every ordinary study day.",
  "Grand rounds now; exam hall later — they are the same skill.",
  "Know the step-one answer and the clinical extension of every concept.",
  "Mock exams are free previews of the real test — use them honestly.",
  "Analyse every mistake: pattern, concept gap, or time pressure?",
  "Review your wrong answers more than your right ones.",
  "Consistency beats intensity when intensity is temporary.",
  "Discipline is choosing what you want most over what you want now.",
  "Small daily wins create unstoppable long-term momentum.",
  "You don't rise to goals — you fall to your systems.",
  "The expert in anything was once a complete beginner.",
  "Progress, not perfection, is the standard.",
  "Motivation gets you started; habit keeps you going.",
  "Hard work beats talent when talent does not work hard.",
  "You are what you repeatedly do — excellence is a habit.",
  "The secret of getting ahead is simply getting started.",
  "Every hour of discipline today is an asset on exam day.",
  "Atomic habits compound into irreversible excellence.",
  "What you do in the dark will show up in the light.",
  "Champions are built in the sessions no one sees.",
  "Track your progress — what gets measured gets managed.",
  "Celebrate small wins; they fuel the long journey.",
  "Comparison is the thief of joy — compete with yesterday's self.",
  "Curiosity is the engine that keeps the medical mind alive.",
  "Burn to learn, not just to pass — the patient will know the difference.",
  "A single focused hour is worth three distracted ones.",
  "Your environment shapes your habits — design your study space with intent.",
  "Remove friction from good habits; add friction to bad ones.",
  "Rest is not a reward — it is a prerequisite for performance.",
  "The Pomodoro is not laziness — it is neuroscience in practice.",
  "Burnout is the occupational hazard of those who care the most.",
  "Self-care is not selfish — it is a prerequisite for caring for others.",
  "You cannot pour from an empty cup.",
  "A 10-minute walk resets focus better than a second coffee.",
  "Sleep, eat, move — the three pillars beneath every great mind.",
  "Mentors compress decades of learning into months — seek them out.",
  "The courage to say 'I don't know' is the beginning of real wisdom.",
  "Uncertainty is not weakness; it is the honest foundation of science.",
  "Teach others to learn faster yourself.",
  "Find your peak focus window and guard it fiercely.",
  "The long game always beats the short sprint in medicine.",
  "Build deep knowledge in one area, then let it illuminate the rest.",
  "Medicine is a calling; treat it with the reverence it deserves.",
  "The future of medicine belongs to those who never stop being students.",
  "Every system of the body tells a story — learn to read them all.",
  "One more question. One more concept. One more step forward.",
  "The best preparation for tomorrow is doing your best today.",
  "Knowledge is the antidote to fear.",
  "Great doctors are perpetual students.",
  "Stay humble — medicine humbles the most confident among us.",
  "Begin. The rest is just effort.",
];

function getDailyIndex() {
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  return Math.floor((today - start) / 86400000) % QUOTES.length;
}

function buildSubjects(content) {
  return (content?.subjects || []).map((subject) => ({
    name: subject?.name?.trim() || "Unnamed Subject",
    subjectId: subject._id,
    chapters: (subject.chapters || []).map((chapter) => ({
      name: chapter.name || "Unnamed Chapter",
      chapterId: chapter._id,
      videoIds: (chapter.videos || []).map((v) => v._id).filter(Boolean),
    })),
  }));
}

function getStreak() {
  try { return JSON.parse(localStorage.getItem("kanthastStreak") || "{}").count || 0; }
  catch { return 0; }
}

// ─── Circular SVG progress ─────────────────────────────────────────────────

function CircleProgress({ percent, size = 54 }) {
  const sw = 4;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (percent / 100) * circ;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={sw} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="#22d3ee" strokeWidth={sw}
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.6s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-white font-bold" style={{ fontSize: 11 }}>{percent}%</span>
      </div>
    </div>
  );
}

// ─── Chapter card ──────────────────────────────────────────────────────────

function ChapterCard({ chapter, watched, index }) {
  const chTotal = chapter.videoIds.length;
  const chWatched = chapter.videoIds.filter((id) => watched[id]).length;
  const chProgress = chTotal > 0 ? Math.round((chWatched / chTotal) * 100) : 0;

  return (
    <article className="relative flex-shrink-0 w-64 h-52 rounded-2xl overflow-hidden border border-slate-200 shadow-[0_14px_35px_rgba(15,23,42,0.14)] group cursor-default">
      <img
        src={IMAGES[index % IMAGES.length]}
        alt={chapter.name}
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-900/30 to-transparent" />

      <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-white text-base font-bold leading-tight line-clamp-2">{chapter.name}</h3>
          <p className="text-white/70 text-xs mt-1">
            {chTotal > 0 ? `${chWatched}/${chTotal} videos` : "No videos yet"}
          </p>
        </div>
        {chTotal > 0 && (
          <div className="flex-shrink-0 bg-black/30 backdrop-blur-sm rounded-full p-0.5">
            <CircleProgress percent={chProgress} />
          </div>
        )}
      </div>
    </article>
  );
}

// ─── Carousel ──────────────────────────────────────────────────────────────

function ChapterCarousel({ chapters, watched }) {
  const scrollRef = useRef(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function check() {
      setCanLeft(el.scrollLeft > 4);
      setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }
    const t = setTimeout(check, 60);
    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => { clearTimeout(t); el.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [chapters.length]);

  function scroll(dir) {
    scrollRef.current?.scrollBy({ left: dir * 290, behavior: "smooth" });
  }

  return (
    <div className="relative">
      {canLeft && (
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-5 z-10 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
        >
          <FaChevronLeft size={12} />
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {chapters.map((chapter, i) => (
          <ChapterCard key={chapter.chapterId || chapter.name} chapter={chapter} watched={watched} index={i} />
        ))}
      </div>

      {canRight && (
        <button
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-5 z-10 w-10 h-10 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center text-slate-600 hover:bg-slate-50 transition"
        >
          <FaChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("kanthastUser") || "null");
  const [subjects, setSubjects] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);

  const watched = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("kanthastWatched") || "{}"); }
    catch { return {}; }
  }, []);

  const dailyQuote = QUOTES[useMemo(getDailyIndex, [])];

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getMedicineUsmleContent();
        if (!mounted) return;
        setSubjects(buildSubjects(data.content));
      } catch {
        if (!mounted) return;
        setSubjects([]);
      } finally {
        if (mounted) setContentLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const { totalVideos, watchedVideos } = useMemo(() => {
    const allIds = subjects.flatMap((s) => s.chapters.flatMap((ch) => ch.videoIds));
    return { totalVideos: allIds.length, watchedVideos: allIds.filter((id) => watched[id]).length };
  }, [subjects, watched]);

  const overallProgress = totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : 0;
  const streak = getStreak();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#e6f5ff,_#f8fafc_45%,_#eef2ff)] px-4 md:px-6 py-8 md:py-10">
      <div className="max-w-7xl mx-auto">

        {/* ── Top card ── */}
        <div className="rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-[0_20px_60px_rgba(2,6,23,0.06)]">

          {/* Welcome row */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
              </h1>
              <p className="text-slate-500 mt-1.5 text-sm">Build discipline daily. Your consistency compounds every session.</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full lg:w-auto lg:min-w-[480px]">
              {contentLoading ? (
                Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
              ) : (
                <>
                  <StatCard
                    title="Total Videos"
                    value={totalVideos}
                    icon={<FaPlay size={11} />}
                    iconBg="bg-blue-100 text-blue-600"
                    accent="border-l-blue-400"
                  />
                  <StatCard
                    title="Watched"
                    value={watchedVideos}
                    icon={<FaCheck size={11} />}
                    iconBg="bg-emerald-100 text-emerald-600"
                    accent="border-l-emerald-400"
                  />
                  <StatCard
                    title="Progress"
                    value={`${overallProgress}%`}
                    icon={<FaChartBar size={11} />}
                    iconBg="bg-violet-100 text-violet-600"
                    accent="border-l-violet-400"
                  />
                  <StatCard
                    title="Streak"
                    value={`${streak}d`}
                    icon={<FaBolt size={11} />}
                    iconBg="bg-amber-100 text-amber-600"
                    accent="border-l-amber-400"
                  />
                </>
              )}
            </div>
          </div>

          {/* Quote section */}
          <div className="mt-8 relative rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 p-6 md:p-10 overflow-hidden shadow-[0_20px_55px_rgba(14,116,144,0.08)]">
            <div className="absolute -top-4 -left-1 text-[9rem] leading-none text-cyan-100 font-serif select-none pointer-events-none">&ldquo;</div>
            <div className="relative z-10">
              <span className="text-xs uppercase tracking-[0.2em] text-cyan-700 font-semibold">Daily Mindset</span>
              <p className="mt-4 text-xl md:text-2xl lg:text-3xl font-bold leading-relaxed text-slate-900">
                &ldquo;{dailyQuote}&rdquo;
              </p>
              <p className="mt-5 text-sm text-slate-500 italic">Consistency + Discipline = Long-term Results</p>
            </div>
          </div>
        </div>

        {/* ── Subject sections ── */}
        <div className="mt-10 space-y-12">
          {contentLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 w-52 bg-slate-200 rounded-lg mb-2" />
                <div className="h-3 w-72 bg-slate-100 rounded mb-5" />
                <div className="flex gap-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex-shrink-0 w-64 h-52 rounded-2xl bg-slate-200" />
                  ))}
                </div>
              </div>
            ))
          ) : subjects.length === 0 ? (
            <div className="rounded-2xl bg-white border border-slate-200 p-8 text-center text-slate-500">
              No content available yet. Your subjects will appear here once added.
            </div>
          ) : (
            subjects.map((subject) => {
              const subjectTotal = subject.chapters.reduce((s, ch) => s + ch.videoIds.length, 0);
              const subjectWatched = subject.chapters.reduce(
                (s, ch) => s + ch.videoIds.filter((id) => watched[id]).length, 0
              );
              const subjectProgress = subjectTotal > 0 ? Math.round((subjectWatched / subjectTotal) * 100) : 0;

              return (
                <section key={subject.subjectId || subject.name}>
                  {/* Subject header */}
                  <div className="mb-5">
                    <div className="flex items-center gap-4 flex-wrap">
                      <h2 className="text-3xl md:text-4xl font-black text-slate-900">{subject.name}</h2>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {subjectWatched}/{subjectTotal} watched
                      </span>
                    </div>

                    {/* Progress bar row */}
                    <div className="mt-3 flex items-center gap-3 max-w-sm">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-700"
                          style={{ width: `${subjectProgress}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-slate-700 tabular-nums w-10 text-right">{subjectProgress}%</span>
                    </div>
                  </div>

                  {/* Carousel */}
                  <ChapterCarousel chapters={subject.chapters} watched={watched} />
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stat card ─────────────────────────────────────────────────────────────

function StatCard({ title, value, icon, iconBg, accent }) {
  return (
    <div className={`rounded-xl border border-slate-200 border-l-2 ${accent} bg-white px-3 py-2.5 flex items-center gap-2.5 shadow-sm`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-base font-black text-slate-900 tabular-nums leading-none">{value}</p>
        <p className="text-[11px] text-slate-500 mt-0.5 truncate">{title}</p>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 flex items-center gap-2.5 shadow-sm animate-pulse">
      <div className="w-7 h-7 rounded-lg bg-slate-200 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="h-4 w-8 bg-slate-200 rounded mb-1.5" />
        <div className="h-2.5 w-16 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

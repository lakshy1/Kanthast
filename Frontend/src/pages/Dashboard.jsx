import { useEffect, useMemo, useState } from "react";
import Image1 from "../assets/images/Image-1.png";
import Image2 from "../assets/images/Image-2.png";
import Image3 from "../assets/images/Image-3.png";
import Image4 from "../assets/images/Image-4.png";
import Image5 from "../assets/images/Image-5.png";
import { getMedicineUsmleContent } from "../utils/authApi";

const IMAGES = [Image1, Image2, Image3, Image4, Image5];

const QUOTES = [
  // Medical wisdom
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
  // Study methods
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
  // Exam focus
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
  // Discipline & mindset
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
  // Life & balance
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
  const dayOfYear = Math.floor((today - start) / 86400000);
  return dayOfYear % QUOTES.length;
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
  try {
    const data = JSON.parse(localStorage.getItem("kanthastStreak") || "{}");
    return data.count || 0;
  } catch {
    return 0;
  }
}

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("kanthastUser") || "null");
  const [quoteOffset, setQuoteOffset] = useState(0);
  const [subjects, setSubjects] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);

  const watched = useMemo(
    () => {
      try { return JSON.parse(localStorage.getItem("kanthastWatched") || "{}"); }
      catch { return {}; }
    },
    []
  );

  const dailyIndex = useMemo(getDailyIndex, []);
  const currentQuoteIndex = (dailyIndex + quoteOffset) % QUOTES.length;

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
    return {
      totalVideos: allIds.length,
      watchedVideos: allIds.filter((id) => watched[id]).length,
    };
  }, [subjects, watched]);

  const overallProgress = totalVideos > 0 ? Math.round((watchedVideos / totalVideos) * 100) : 0;
  const streak = getStreak();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#e6f5ff,_#f8fafc_45%,_#eef2ff)] px-4 md:px-6 py-8 md:py-10">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-3xl bg-white border border-slate-200 p-6 md:p-8 shadow-[0_20px_60px_rgba(2,6,23,0.06)]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900">
                Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
              </h1>
              <p className="text-slate-600 mt-2">
                Build discipline daily. Your consistency score is improving this week.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full lg:w-auto">
              <StatCard title="Total Videos" value={contentLoading ? "—" : totalVideos} />
              <StatCard title="Watched" value={contentLoading ? "—" : watchedVideos} />
              <StatCard title="Progress" value={contentLoading ? "—" : `${overallProgress}%`} />
              <StatCard title="Streak" value={`${streak} day${streak !== 1 ? "s" : ""}`} />
            </div>
          </div>

          <div className="mt-8 relative rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 p-6 md:p-10 overflow-hidden shadow-[0_20px_55px_rgba(14,116,144,0.08)]">
            <div className="absolute -top-4 -left-1 text-[9rem] leading-none text-cyan-100 font-serif select-none pointer-events-none">&ldquo;</div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xs uppercase tracking-[0.2em] text-cyan-700 font-semibold">Daily Mindset</span>
                <span className="text-xs text-slate-400">· Quote {currentQuoteIndex + 1} of {QUOTES.length}</span>
              </div>
              <p className="text-xl md:text-2xl lg:text-3xl font-bold leading-relaxed text-slate-900">
                &ldquo;{QUOTES[currentQuoteIndex]}&rdquo;
              </p>
              <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
                <p className="text-sm text-slate-500 italic">Consistency + Discipline = Long-term Results</p>
                <button
                  onClick={() => setQuoteOffset((o) => o + 1)}
                  className="text-sm px-5 py-2.5 rounded-xl border border-cyan-200 bg-white text-cyan-700 hover:bg-cyan-50 transition font-semibold shadow-sm"
                >
                  Next Quote →
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-10">
          {contentLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-8 w-52 bg-slate-200 rounded-lg mb-4" />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-44 rounded-2xl bg-slate-200" />
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
              const subjectTotal = subject.chapters.reduce((sum, ch) => sum + ch.videoIds.length, 0);
              const subjectWatched = subject.chapters.reduce(
                (sum, ch) => sum + ch.videoIds.filter((id) => watched[id]).length,
                0
              );
              const subjectProgress = subjectTotal > 0 ? Math.round((subjectWatched / subjectTotal) * 100) : 0;

              return (
                <section key={subject.subjectId || subject.name}>
                  <div className="flex items-baseline gap-4 mb-4">
                    <h2 className="text-4xl font-black text-slate-900">{subject.name}</h2>
                    <span className="text-slate-500 text-sm font-medium">
                      {subjectWatched}/{subjectTotal} watched &middot; {subjectProgress}%
                    </span>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {subject.chapters.map((chapter, chapterIndex) => {
                      const chTotal = chapter.videoIds.length;
                      const chWatched = chapter.videoIds.filter((id) => watched[id]).length;
                      const chProgress = chTotal > 0 ? Math.round((chWatched / chTotal) * 100) : 0;

                      return (
                        <article
                          key={chapter.chapterId || chapter.name}
                          className="relative h-44 rounded-2xl overflow-hidden border border-slate-200 shadow-[0_14px_35px_rgba(15,23,42,0.12)] group"
                        >
                          <img
                            src={IMAGES[chapterIndex % IMAGES.length]}
                            alt={chapter.name}
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
                          <div className="absolute left-4 right-4 bottom-4">
                            <h3 className="text-white text-xl font-bold leading-tight line-clamp-2">{chapter.name}</h3>
                            {chTotal > 0 ? (
                              <>
                                <div className="mt-2 h-2 bg-white/30 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-cyan-300 rounded-full transition-all duration-500"
                                    style={{ width: `${chProgress}%` }}
                                  />
                                </div>
                                <p className="text-xs text-white/90 mt-1">{chWatched}/{chTotal} videos &middot; {chProgress}%</p>
                              </>
                            ) : (
                              <p className="text-xs text-white/50 mt-2">No videos yet</p>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 min-w-28">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="text-lg font-extrabold text-slate-900 mt-1">{value}</p>
    </div>
  );
}

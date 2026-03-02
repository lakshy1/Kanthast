import { useMemo, useState } from "react";
import Image1 from "../assets/images/Image-1.png";
import Image2 from "../assets/images/Image-2.png";
import Image3 from "../assets/images/Image-3.png";
import Image4 from "../assets/images/Image-4.png";
import Image5 from "../assets/images/Image-5.png";

const quotes = [
  "Consistency beats intensity when intensity is temporary.",
  "Discipline is choosing what you want most over what you want now.",
  "A focused hour every day compounds into mastery.",
  "Small daily wins create unstoppable momentum.",
  "You don't rise to goals, you fall to systems.",
];

const sectionData = [
  {
    title: "Neuroanatomy",
    lessons: [
      { name: "Cranial Nerves", progress: 72, image: Image1 },
      { name: "Spinal Tracts", progress: 48, image: Image2 },
      { name: "Thalamic Nuclei", progress: 60, image: Image3 },
      { name: "Hypothalamic Nuclei", progress: 35, image: Image4 },
    ],
  },
  {
    title: "Pharmacology",
    lessons: [
      { name: "General Pharm", progress: 64, image: Image5 },
      { name: "Cholinomimetics", progress: 50, image: Image2 },
      { name: "Anticholinergics", progress: 44, image: Image3 },
      { name: "Sympathomimetics", progress: 39, image: Image4 },
    ],
  },
  {
    title: "Microbiology",
    lessons: [
      { name: "Antibiotics", progress: 79, image: Image1 },
      { name: "Antifungals", progress: 55, image: Image2 },
      { name: "Antivirals", progress: 41, image: Image3 },
      { name: "Parasites", progress: 29, image: Image5 },
    ],
  },
  {
    title: "Immunology",
    lessons: [
      { name: "Immunoglobulins", progress: 58, image: Image1 },
      { name: "Cytokines", progress: 46, image: Image2 },
      { name: "Hypersensitivity Reactions", progress: 34, image: Image3 },
      { name: "Complement", progress: 40, image: Image4 },
    ],
  },
  {
    title: "Biochemistry",
    lessons: [
      { name: "Vitamins", progress: 67, image: Image5 },
      { name: "Biochemical Pathways", progress: 42, image: Image2 },
      { name: "Metabolic Disorders", progress: 37, image: Image3 },
      { name: "Lipids", progress: 55, image: Image4 },
    ],
  },
];

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("kanthastUser") || "null");
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [completedToday, setCompletedToday] = useState(3);

  const totalLessons = useMemo(
    () => sectionData.reduce((total, section) => total + section.lessons.length, 0),
    []
  );

  const averageProgress = useMemo(() => {
    const allProgress = sectionData.flatMap((section) => section.lessons.map((lesson) => lesson.progress));
    const sum = allProgress.reduce((acc, value) => acc + value, 0);
    return Math.round(sum / allProgress.length);
  }, []);

  const dailyGoal = 5;
  const dailyPercent = Math.round((completedToday / dailyGoal) * 100);
  const weeklyGoal = 18;
  const weeklyCompleted = 12;

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
              <StatCard title="Total Modules" value={totalLessons} />
              <StatCard title="Avg Progress" value={`${averageProgress}%`} />
              <StatCard title="Weekly Goal" value={`${weeklyCompleted}/${weeklyGoal}`} />
              <StatCard title="Streak" value="9 days" />
            </div>
          </div>

          <div className="mt-8 grid lg:grid-cols-[1.2fr_2fr] gap-6">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-bold text-slate-900">Progress Meter</h2>
              <div className="mt-5 flex items-center justify-between gap-6">
                <div
                  className="w-32 h-32 rounded-full grid place-items-center"
                  style={{
                    background: `conic-gradient(#0ea5e9 ${dailyPercent}%, #dbeafe ${dailyPercent}% 100%)`,
                  }}
                >
                  <div className="w-24 h-24 rounded-full bg-white grid place-items-center border border-slate-200">
                    <span className="text-xl font-black text-slate-900">{dailyPercent}%</span>
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-sm text-slate-500">Daily target</p>
                  <div className="h-3 bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all"
                      style={{ width: `${dailyPercent}%` }}
                    />
                  </div>
                  <p className="text-sm mt-2 text-slate-700">
                    {completedToday} of {dailyGoal} tasks done today
                  </p>
                  <button
                    onClick={() => setCompletedToday((value) => Math.min(dailyGoal, value + 1))}
                    disabled={completedToday >= dailyGoal}
                    className="mt-3 text-sm px-3 py-2 rounded-lg bg-blue-950 text-white hover:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Mark One Complete
                  </button>
                  <button
                    onClick={() => setCompletedToday(0)}
                    className="mt-3 ml-2 text-sm px-3 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-blue-50 p-6 text-slate-900 shadow-[0_20px_55px_rgba(14,116,144,0.12)]">
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-700">Mindset</p>
              <p className="mt-4 text-2xl font-bold leading-relaxed text-slate-900">"{quotes[quoteIndex]}"</p>
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-slate-600">Consistency + Discipline = Long-term Results</p>
                <button
                  onClick={() => setQuoteIndex((index) => (index + 1) % quotes.length)}
                  className="text-sm px-3 py-2 rounded-lg border border-cyan-200 bg-white text-cyan-700 hover:bg-cyan-50 transition"
                >
                  New Quote
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 space-y-10">
          {sectionData.map((section) => (
            <section key={section.title}>
              <h2 className="text-4xl font-black text-slate-900 mb-4">{section.title}</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {section.lessons.map((lesson) => (
                  <article
                    key={lesson.name}
                    className="relative h-44 rounded-2xl overflow-hidden border border-slate-200 shadow-[0_14px_35px_rgba(15,23,42,0.12)] group"
                  >
                    <img
                      src={lesson.image}
                      alt={lesson.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
                    <div className="absolute left-4 right-4 bottom-4">
                      <h3 className="text-white text-2xl font-bold">{lesson.name}</h3>
                      <div className="mt-2 h-2 bg-white/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan-300 rounded-full"
                          style={{ width: `${lesson.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-white/90 mt-1">{lesson.progress}% completed</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
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

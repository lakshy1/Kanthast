import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { SITE_URL } from "../utils/seo";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

export default function Courses() {
  const navigate = useNavigate();
  const features = [
    "Class-wise curriculum from I-X",
    "Subject filters with chapter-wise topics",
    "Notes and video actions for every topic",
    "Progress dashboard for every learner",
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7fbff] text-ink">
      <Helmet>
        <title>Kanthast School Courses | Classes I-X</title>
        <meta
          name="description"
          content="Explore Kanthast School class-wise learning plans for Classes I-X with visual lessons and progress tracking."
        />
        <link rel="canonical" href={`${SITE_URL}/courses`} />
      </Helmet>

      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-7xl lg:max-w-none lg:w-[calc(var(--u)*85)] lg:px-0 gap-10 px-6 py-16 md:px-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.p variants={fadeUp} className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">
              Kanthast School
            </motion.p>
            <motion.h1 variants={fadeUp} className="mt-4 text-4xl font-black leading-tight text-ink md:text-6xl">
              One visual learning plan for every class from I to X.
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-5 max-w-2xl text-lg leading-8 text-ink-muted">
              Choose the student's class, unlock the annual course, and let them learn with visual chapters,
              checkpoints and a dashboard that keeps progress visible.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-7 flex flex-wrap gap-3">
              {features.map((item) => (
                <span key={item} className="rounded-full border border-line bg-surface-sunken px-4 py-2 text-sm font-semibold text-ink-muted">
                  {item}
                </span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="rounded-card border border-line bg-slate-950 p-6 text-white shadow-e4"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Annual access</p>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-5xl font-black">Rs 5,000</span>
              <span className="pb-2 text-slate-300">per class</span>
            </div>
            <p className="mt-4 text-slate-300">
              Use the class selector in the Library to switch the school catalogue. A subscription unlocks the chosen class in the Library and Dashboard.
            </p>
            <button
              type="button"
              onClick={() => navigate("/library")}
              className="mt-6 w-full rounded-control bg-cyan-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
            >
              Open the School Library
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

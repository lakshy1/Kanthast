import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { SITE_URL } from "../utils/seo";
import { Eyebrow, Accent } from "../components/ui/Brandmarks";
import { FaArrowRight, FaGraduationCap } from "react-icons/fa6";

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
    "Classes VIII to X now, I to VII planned",
    "Subject filters with chapter-wise topics",
    "Notes and video actions for every topic",
    "Progress dashboard for every learner",
  ];

  return (
    <div className="min-h-screen overflow-x-hidden text-ink">
      <Helmet>
        <title>Courses for Classes VIII to X | Kanthast School</title>
        <meta
          name="description"
          content="Explore Kanthast School class-wise learning plans for Classes VIII to X with visual lessons and progress tracking. Classes I to VII are planned."
        />
        <link rel="canonical" href={`${SITE_URL}/courses`} />
      </Helmet>

      <section>
        <div className="site-container grid gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div variants={fadeUp}>
              <Eyebrow icon={FaGraduationCap}>Kanthast School Courses</Eyebrow>
            </motion.div>
            <motion.h1 variants={fadeUp} className="kx-title kx-page-title mt-5">
              One visual learning plan for Classes <Accent>VIII to X</Accent>
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-5 max-w-2xl text-lg leading-8 text-ink-muted">
              Choose the student's class, unlock the annual course, and let them learn with visual chapters,
              checkpoints and a dashboard that keeps progress visible.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-7 flex flex-wrap gap-3">
              {features.map((item) => (
                <span key={item} className="rounded-full bg-brand-soft px-4 py-2 text-sm font-semibold text-brand">
                  {item}
                </span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="rounded-sheet border border-[#edf1fa] bg-surface p-7 text-ink shadow-e5"
          >
            <p className="inline-flex rounded-full bg-[#fff4db] px-3 py-1 text-sm font-bold text-[#8a5a00]">Annual access</p>
            <div className="mt-4 flex items-end gap-3">
              <span className="kx-title text-5xl">Rs 5,000</span>
              <span className="pb-2 text-ink-muted">per class</span>
            </div>
            <p className="mt-4 text-ink-muted">
              Use the class selector in the Library to switch the school catalogue. A subscription unlocks the chosen class in the Library and Dashboard.
            </p>
            <button
              type="button"
              onClick={() => navigate("/library")}
              className="bh-btn bh-btn-primary mt-6 w-full"
            >
              Open the School Library
              <FaArrowRight aria-hidden="true" className="text-[0.8em]" />
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

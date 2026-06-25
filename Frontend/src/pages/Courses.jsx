import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Image1 from "../assets/images/Image-3.png";
import Image2 from "../assets/images/Image-4.png";
import Image3 from "../assets/images/Image-5.png";
import { isSchoolTrack } from "../utils/schoolTrack";

const fadeUp = {
  hidden: { opacity: 0, y: 34 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.68, ease: [0.22, 1, 0.36, 1] },
  },
};

const stagger = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const sectionViewport = { once: true, amount: 0.22 };

export default function Courses() {
  const navigate = useNavigate();
  if (isSchoolTrack()) return <SchoolCourses navigate={navigate} />;

  return (
    <div className="overflow-x-hidden bg-[radial-gradient(circle_at_10%_10%,_#dbeafe,_#eff6ff_42%,_#ecfeff_100%)]">
      <Helmet>
        <title>Medical Courses | USMLE, NEET PG & INI CET Prep — Kanthast</title>
        <meta name="description" content="Explore Kanthast's visual medical courses for USMLE, NEET PG, and INI CET. 3D animations, clinical cases, and high-yield exam-focused preparation." />
        <link rel="canonical" href="https://kanthast.in/courses" />
        <meta property="og:title" content="Medical Courses | USMLE, NEET PG & INI CET Prep — Kanthast" />
        <meta property="og:description" content="Explore Kanthast's visual medical courses for USMLE, NEET PG, and INI CET. 3D animations, clinical cases, and high-yield exam-focused preparation." />
        <meta property="og:url" content="https://kanthast.in/courses" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Kanthast Medical Courses",
          "description": "Visual medical education courses for USMLE, NEET PG, and INI CET preparation.",
          "url": "https://kanthast.in/courses",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Medicine / USMLE", "url": "https://kanthast.in/courses#medicine" },
            { "@type": "ListItem", "position": 2, "name": "NEET PG", "url": "https://kanthast.in/courses#neet-pg" },
            { "@type": "ListItem", "position": 3, "name": "INI CET", "url": "https://kanthast.in/courses#ini-cet" }
          ]
        })}</script>
      </Helmet>
      <section className="relative overflow-hidden py-24">
        <motion.div
          animate={{ y: [0, -10, 0], opacity: [0.5, 0.75, 0.5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -top-20 -left-16 h-72 w-72 rounded-full bg-cyan-300/25 blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 12, 0], opacity: [0.45, 0.7, 0.45] }}
          transition={{ duration: 5.8, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-blue-300/25 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-6 md:px-16">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="rounded-3xl border border-white/60 bg-white/70 px-6 py-10 text-center backdrop-blur-2xl shadow-[0_25px_70px_rgba(15,23,42,0.13)] md:px-12"
          >
            <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-black leading-tight text-slate-900">
              Programs Built for Every Medical Stage
            </motion.h1>
            <motion.p variants={fadeUp} className="mx-auto mt-5 max-w-3xl text-base md:text-lg text-slate-600">
              Animation-first learning tracks with exam-focused pathways for USMLE, NEET PG, and INI CET.
            </motion.p>
          </motion.div>
        </div>
      </section>

      <section className="py-14">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={sectionViewport}
          className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-3 md:px-16"
        >
          {[
            {
              title: "Medicine / USMLE",
              desc: "Advanced clinical reasoning and systems-based learning for future physicians.",
            },
            {
              title: "NEET PG",
              desc: "High-yield visual modules across Pathology, Pharmacology, Medicine, Surgery, and all 19 MBBS subjects.",
            },
            {
              title: "INI CET",
              desc: "Focused preparation for AIIMS, JIPMER, PGIMER & NIMHANS with animation-driven clinical concepts.",
            },
          ].map((item) => (
            <motion.div
              key={item.title}
              variants={fadeUp}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="rounded-2xl border border-white/60 bg-white/55 p-7 backdrop-blur-2xl shadow-[0_18px_55px_rgba(15,23,42,0.11)]"
            >
              <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-slate-600 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section id="medicine" className="py-10 md:py-14">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={sectionViewport}
          className="mx-auto max-w-7xl px-6 md:px-16"
        >
          <div className="grid items-center gap-10 rounded-3xl border border-white/60 bg-white/62 p-6 backdrop-blur-2xl shadow-[0_25px_70px_rgba(15,23,42,0.13)] md:grid-cols-2 md:p-8">
            <motion.div variants={fadeUp}>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900">Medicine / USMLE</h2>
              <p className="mt-4 text-slate-600 text-lg leading-relaxed">
                Master complex physiology, pathology, and clinical reasoning through immersive visual lessons designed
                for USMLE performance.
              </p>
              <motion.button
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/lists")}
                className="mt-7 rounded-xl bg-slate-900 px-7 py-3.5 font-semibold text-white transition hover:bg-slate-800"
              >
                Explore Medicine
              </motion.button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden rounded-2xl border border-slate-200 shadow-xl"
            >
              <motion.img
                src={Image1}
                alt="Medicine course preview"
                loading="lazy"
                className="h-[380px] w-full object-cover"
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section id="neet-pg" className="py-10 md:py-14">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={sectionViewport}
          className="mx-auto max-w-7xl px-6 md:px-16"
        >
          <div className="grid items-center gap-10 rounded-3xl border border-white/60 bg-white/62 p-6 backdrop-blur-2xl shadow-[0_25px_70px_rgba(15,23,42,0.13)] md:grid-cols-2 md:p-8">
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden rounded-2xl border border-slate-200 shadow-xl"
            >
              <motion.img
                src={Image2}
                alt="NEET PG visual learning modules"
                loading="lazy"
                className="h-[380px] w-full object-cover"
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </motion.div>

            <motion.div variants={fadeUp}>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900">NEET PG</h2>
              <p className="mt-4 text-slate-600 text-lg leading-relaxed">
                India's most competitive PG medical entrance exam demands more than rote learning. Kanthast's
                animation-driven modules cover all 19 MBBS subjects — Pathology, Pharmacology, Medicine, Surgery,
                OBG, Paediatrics, and more — building the conceptual clarity that turns high-yield facts into
                long-term memory.
              </p>
              <motion.button
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/lists")}
                className="mt-7 rounded-xl bg-slate-900 px-7 py-3.5 font-semibold text-white transition hover:bg-slate-800"
              >
                Explore NEET PG
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section id="ini-cet" className="pb-20 pt-10 md:pt-14">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={sectionViewport}
          className="mx-auto max-w-7xl px-6 md:px-16"
        >
          <div className="grid items-center gap-10 rounded-3xl border border-white/60 bg-white/62 p-6 backdrop-blur-2xl shadow-[0_25px_70px_rgba(15,23,42,0.13)] md:grid-cols-2 md:p-8">
            <motion.div variants={fadeUp}>
              <h2 className="text-3xl md:text-5xl font-black text-slate-900">INI CET</h2>
              <p className="mt-4 text-slate-600 text-lg leading-relaxed">
                The gateway to AIIMS, JIPMER, PGIMER, and NIMHANS — India's most prestigious postgraduate
                institutions. INI CET demands deep clinical reasoning alongside subject mastery. Our visual
                lessons make complex mechanisms intuitive, so you walk into the exam with clarity, not just
                facts.
              </p>
              <motion.button
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/lists")}
                className="mt-7 rounded-xl bg-slate-900 px-7 py-3.5 font-semibold text-white transition hover:bg-slate-800"
              >
                Explore INI CET
              </motion.button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.35 }}
              className="overflow-hidden rounded-2xl border border-slate-200 shadow-xl"
            >
              <motion.img
                src={Image3}
                alt="INI CET preparation for AIIMS and JIPMER"
                loading="lazy"
                className="h-[380px] w-full object-cover"
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function SchoolCourses({ navigate }) {
  const features = [
    "Class-wise curriculum from I-X",
    "Subject filters with chapter-wise topics",
    "Notes and video actions for every topic",
    "Progress dashboard for every learner",
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7fbff] text-slate-950">
      <Helmet>
        <title>Kanthast School Courses | Classes I-X</title>
        <meta
          name="description"
          content="Explore Kanthast School class-wise learning plans for Classes I-X with visual lessons, quizzes, and progress tracking."
        />
        <link rel="canonical" href="https://kanthast.in/courses" />
      </Helmet>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:px-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.p variants={fadeUp} className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-700">
              Kanthast School
            </motion.p>
            <motion.h1 variants={fadeUp} className="mt-4 text-4xl font-black leading-tight text-slate-950 md:text-6xl">
              One visual learning plan for every class from I to X.
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Choose the student's class, unlock the annual course, and let them learn with visual chapters,
              checkpoints, and a dashboard that keeps progress visible.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-7 flex flex-wrap gap-3">
              {features.map((item) => (
                <span key={item} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
                  {item}
                </span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Annual access</p>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-5xl font-black">Rs 5,000</span>
              <span className="pb-2 text-slate-300">per class</span>
            </div>
            <p className="mt-4 text-slate-300">
              Use the class selector inside Lists to switch the school catalogue. Subscription unlocks the chosen class content in Lists and Dashboard.
            </p>
            <button
              type="button"
              onClick={() => navigate("/lists")}
              className="mt-6 w-full rounded-xl bg-cyan-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-400"
            >
              Open School Lists
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

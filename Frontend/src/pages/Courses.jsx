import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa6";
import { Link, useLocation, useNavigate } from "react-router-dom";
import PageHero from "../components/landing/PageHero";
import SYLLABUS_SNAPSHOT from "../data/syllabusSnapshot";

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

const sectionViewport = { once: true, amount: 0.2 };

const PROGRAMS = [
  {
    id: "medicine",
    title: "Medicine / USMLE",
    summary: "Advanced clinical reasoning and systems-based learning for future physicians.",
    body: "Master complex physiology, pathology, and clinical reasoning through immersive visual lessons designed for USMLE performance.",
    cta: "Explore Medicine",
  },
  {
    id: "neet-pg",
    title: "NEET PG",
    summary: "High-yield visual modules across Pathology, Pharmacology, Medicine, Surgery, and all 19 MBBS subjects.",
    body: "India's most competitive PG medical entrance exam rewards conceptual clarity over rote learning. The Kanthast library starts with Biochemistry, Immunology, Pharmacology, Microbiology and Neuroanatomy, with animated lectures releasing subject by subject.",
    cta: "Explore NEET PG",
  },
  {
    id: "ini-cet",
    title: "INI CET",
    summary: "Focused preparation for AIIMS, JIPMER, PGIMER & NIMHANS with animation-driven clinical concepts.",
    body: "The gateway to AIIMS, JIPMER, PGIMER, and NIMHANS — India's most prestigious postgraduate institutions. INI CET demands deep clinical reasoning alongside subject mastery. Our visual lessons make complex mechanisms intuitive, so you walk into the exam with clarity, not just facts.",
    cta: "Explore INI CET",
  },
];

export default function Courses() {
  const navigate = useNavigate();
  const location = useLocation();
  // The route is the source of truth here, not ambient browsing history:
  // /school/courses always shows the School catalogue, /courses always
  // shows Medical, regardless of which track page was visited previously
  // in this browser.
  if (location.pathname.startsWith("/school")) return <SchoolCourses navigate={navigate} />;

  return (
    <div className="home-page overflow-x-clip bg-surface text-ink">
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

      <PageHero
        kicker="Courses"
        title="Programs built for every"
        accent="medical stage."
        lead="Animation-first learning tracks with exam-focused pathways for USMLE, NEET PG, and INI CET."
        aside={
          <motion.ul variants={stagger} initial="hidden" animate="show" className="grid gap-4">
            {PROGRAMS.map((program) => (
              <motion.li key={program.id} variants={fadeUp}>
                <a
                  href={`#${program.id}`}
                  className="group flex items-start justify-between gap-6 rounded-card border border-line bg-surface-raised p-6 transition-colors duration-200 hover:border-brand/60"
                >
                  <span>
                    <span className="block text-lg font-bold text-ink">{program.title}</span>
                    <span className="mt-2 block leading-relaxed text-ink-muted">{program.summary}</span>
                  </span>
                  <FaArrowRight aria-hidden="true" className="mt-1.5 shrink-0 text-sm text-brand transition-transform duration-200 group-hover:translate-x-1" />
                </a>
              </motion.li>
            ))}
          </motion.ul>
        }
      />

      {PROGRAMS.map((program, index) => (
        <section
          key={program.id}
          id={program.id}
          className={`scroll-mt-24 border-b border-line py-20 md:py-28 ${index % 2 ? "bg-surface" : "bg-surface-sunken"}`}
        >
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={sectionViewport}
            className="site-container grid items-center gap-12 lg:grid-cols-2 lg:gap-20"
          >
            <motion.div variants={fadeUp} className={index % 2 ? "lg:order-2" : ""}>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                Program 0{index + 1}
              </p>
              <h2 className="mt-3 text-4xl text-ink md:text-5xl">{program.title}</h2>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-muted">{program.body}</p>
              <button type="button" onClick={() => navigate("/lists")} className="btn-primary mt-8 px-7 text-base">
                {program.cta}
                <FaArrowRight aria-hidden="true" />
              </button>
            </motion.div>

            <SyllabusPanel />
          </motion.div>
        </section>
      ))}

      <section className="relative overflow-hidden bg-surface">
        <div aria-hidden="true" className="home-glow home-glow-close" />
        <div className="site-container relative flex flex-col items-start justify-between gap-8 py-20 md:flex-row md:items-center">
          <h2 className="max-w-2xl text-3xl md:text-5xl">See every planned lecture in the library.</h2>
          <Link to="/lists" className="btn-primary shrink-0 px-7 text-base">
            Browse the library
            <FaArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}

// The real syllabus the three medical programs draw on. Replaced AI-generated
// banners that advertised MCAT and NCLEX, which Kanthast does not offer.
function SyllabusPanel() {
  return (
    <motion.div variants={fadeUp} className="rounded-card border border-line bg-surface-raised p-7 shadow-e3">
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-muted">In the library</p>
      <ul className="mt-4 divide-y divide-line">
        {SYLLABUS_SNAPSHOT.subjects.map((subject) => (
          <li key={subject.name} className="flex items-baseline justify-between gap-4 py-3.5">
            <span className="text-lg font-semibold text-ink">{subject.name}</span>
            <span className="text-sm tabular-nums text-ink-subtle">{subject.chapters} chapters</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-ink-muted">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-brand align-middle" aria-hidden="true" />
        Lectures are releasing subject by subject.
      </p>
    </motion.div>
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
    <div className="min-h-screen overflow-x-hidden bg-[#f7fbff] text-ink">
      <Helmet>
        <title>Kanthast School Courses | Classes I-X</title>
        <meta
          name="description"
          content="Explore Kanthast School class-wise learning plans for Classes I-X with visual lessons, quizzes, and progress tracking."
        />
        <link rel="canonical" href="https://kanthast.in/courses" />
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
              checkpoints, and a dashboard that keeps progress visible.
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
              onClick={() => navigate("/lists")}
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

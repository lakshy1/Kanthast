import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa6";
import { Link, useNavigate } from "react-router-dom";
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
          "name": "Kanthast Professional Courses",
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
              <button type="button" onClick={() => navigate("/library")} className="btn-primary mt-8 px-7 text-base">
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
          <Link to="/library" className="btn-primary shrink-0 px-7 text-base">
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


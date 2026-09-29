import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { FaArrowRight } from "react-icons/fa6";
import { Link } from "react-router-dom";
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

const PRINCIPLES = [
  {
    title: "Visual first",
    desc: "Every lesson is animation-driven to create strong memory anchors.",
  },
  {
    title: "Outcome focused",
    desc: "Every learning experience is designed to improve clarity, confidence, and performance.",
  },
  {
    title: "Understanding over rote",
    desc: "Learners engage with ideas actively instead of relying on passive recall alone.",
  },
];

// Counts from the real syllabus snapshot, not audience claims: Kanthast has
// no verified learner numbers yet (see PRODUCT.md).
const FACTS = [
  { value: SYLLABUS_SNAPSHOT.subjects.length, label: "Medical subjects mapped" },
  {
    value: SYLLABUS_SNAPSHOT.subjects.reduce((sum, subject) => sum + subject.chapters, 0),
    label: "Chapters laid out",
  },
  { value: 3, label: "Exams covered: NEET-PG, INI-CET and USMLE" },
];

export default function About() {
  return (
    <div className="home-page overflow-x-clip bg-surface text-ink">
      <Helmet>
        <title>About Kanthast | Visual Learning That Sticks</title>
        <meta name="description" content="Learn about Kanthast's mission to transform medical education through immersive visual learning — built by educators for USMLE, NEET PG, and INI CET students." />
        <link rel="canonical" href="https://kanthast.in/about" />
        <meta property="og:title" content="About Kanthast | Visual Learning That Sticks" />
        <meta property="og:description" content="Learn about Kanthast's mission to transform medical education through immersive visual learning — built by educators for USMLE, NEET PG, and INI CET students." />
        <meta property="og:url" content="https://kanthast.in/about" />
      </Helmet>

      <PageHero
        kicker="About"
        title="Rethinking how complex learning"
        accent="is understood."
        lead="Kanthast turns difficult subjects into visual learning journeys that improve retention, confidence, and real understanding across both medical and school education."
        aside={
          <motion.dl variants={stagger} initial="hidden" animate="show" className="grid gap-4">
            {FACTS.map((fact) => (
              <motion.div
                key={fact.label}
                variants={fadeUp}
                className="flex items-baseline gap-5 rounded-card border border-line bg-surface-raised px-6 py-5"
              >
                <dt className="order-2 text-ink-muted">{fact.label}</dt>
                <dd className="order-1 font-sans text-4xl font-extrabold tabular-nums tracking-[-0.03em] text-brand">
                  {fact.value}
                </dd>
              </motion.div>
            ))}
          </motion.dl>
        }
      />

      <section className="border-b border-line bg-surface-sunken py-20 md:py-28">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={sectionViewport}
          className="site-container grid gap-12 lg:grid-cols-2 lg:gap-20"
        >
          <motion.div variants={fadeUp}>
            <h2 className="text-4xl text-ink md:text-5xl">Why we started Kanthast</h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-muted">
              Too much learning still feels fragmented, overwhelming, and memorization-heavy. We built Kanthast to make
              difficult topics feel structured, visual, and intuitive instead.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-ink-muted">
              Our animation-first approach helps learners connect ideas faster, whether they are preparing for competitive
              medical exams or building strong school fundamentals.
            </p>
          </motion.div>

          <motion.dl variants={fadeUp} className="divide-y divide-line self-center border-y border-line">
            {[
              ["Exams", "NEET-PG, INI-CET and USMLE, plus School for Class I–X"],
              ["Format", "Short animated lectures, organised subject by subject and chapter by chapter"],
              ["Status", "The medical syllabus is mapped; lectures are releasing subject by subject"],
            ].map(([term, detail]) => (
              <div key={term} className="grid gap-1 py-5 sm:grid-cols-[7rem_1fr] sm:gap-6">
                <dt className="font-semibold text-ink">{term}</dt>
                <dd className="text-ink-muted">{detail}</dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>
      </section>

      <section className="border-b border-line bg-surface py-20 md:py-28">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={sectionViewport}
          className="site-container"
        >
          <motion.h2 variants={fadeUp} className="text-4xl text-ink md:text-5xl">
            Our learning philosophy
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-5 max-w-3xl text-lg leading-relaxed text-ink-muted">
            Build mental models first. Facts stick better when learners understand patterns, mechanisms, and context
            before they try to memorise details.
          </motion.p>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PRINCIPLES.map((item, index) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className="rounded-card border border-line bg-surface-raised p-7 transition-colors duration-200 hover:border-brand/50"
              >
                <p className="font-sans text-sm font-bold tabular-nums text-brand">0{index + 1}</p>
                <h3 className="mt-4 text-xl font-bold text-ink">{item.title}</h3>
                <p className="mt-3 leading-relaxed text-ink-muted">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <section className="relative overflow-hidden bg-surface">
        <div aria-hidden="true" className="home-glow home-glow-close" />
        <div className="site-container relative flex flex-col items-start justify-between gap-8 py-20 md:flex-row md:items-center">
          <h2 className="max-w-2xl text-3xl md:text-5xl">Ready to learn with more clarity?</h2>
          <Link to="/signup" className="btn-primary shrink-0 px-7 text-base">
            Start learning
            <FaArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}

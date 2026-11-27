// eslint-disable-next-line no-unused-vars
import { motion, useReducedMotion } from "framer-motion";
import { FaPlay, FaArrowRight, FaGraduationCap, FaStethoscope, FaSchool, FaBolt } from "react-icons/fa6";
import heroIllustration from "../../assets/hero/hero-illustration.jpg";

/** Landing hero: copy and CTAs on the left, illustration on the right. Fills the first screen. */
export default function BrandHero() {
  const reduce = useReducedMotion();
  return (
    <section className="bh" aria-labelledby="bh-title">
      <div className="bh-inner">
        <div className="bh-copy">
          <p className="bh-eyebrow">
            <FaPlay aria-hidden="true" className="bh-eyebrow-icon" />
            Learn • Visualize • Remember
          </p>

          <h1 id="bh-title" className="bh-title">
            Hard ideas,
            <br />
            <span className="bh-accent">animated</span> until
            <br />
            they{" "}
            <span className="bh-click-wrap">
              <span className="bh-click">
                click
                <svg className="bh-underline" viewBox="0 0 200 18" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M3 13 C 50 5, 120 3, 197 9" />
                </svg>
              </span>
              <span className="bh-accent">.</span>
              <svg className="bh-spark" viewBox="0 0 40 40" aria-hidden="true">
                <path d="M8 4 L 12 16" />
                <path d="M19 13 L 30 8" />
                <path d="M18 23 L 32 24" />
              </svg>
            </span>
          </h1>

          <p className="bh-sub">Short animated lessons with AI help, for medical exams and for school.</p>

          <div className="bh-ctas">
            <motion.a
              href="#products"
              className="bh-btn bh-btn-primary"
              whileHover={reduce ? undefined : { y: -2 }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
            >
              <FaGraduationCap aria-hidden="true" className="text-[1.05em]" />
              Explore products
              <FaArrowRight aria-hidden="true" className="text-[0.8em]" />
            </motion.a>
            <motion.a
              href="#teaser-heading"
              className="bh-btn bh-btn-ghost"
              whileHover={reduce ? undefined : { y: -1 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
            >
              <FaBolt aria-hidden="true" className="text-[0.95em] text-[#1d4ed8]" />
              Try 10-sec demo
            </motion.a>
          </div>

          {/* Same layout as a "trusted by" row, but only true facts. */}
          <div className="bh-proof">
            <div className="bh-proof-stack" aria-hidden="true">
              <span><FaStethoscope /></span>
              <span><FaSchool /></span>
              <span><FaPlay /></span>
            </div>
            <span className="bh-proof-text">
              <strong>NEET PG · INI CET · USMLE</strong>
            </span>
            <span className="bh-proof-divider" aria-hidden="true" />
            <span className="bh-proof-text">
              <strong>Classes VIII–X</strong> · NCERT 2025-26
            </span>
          </div>
        </div>

        <motion.div
          className="bh-art"
          animate={reduce ? undefined : { y: [0, -6, 0] }}
          transition={reduce ? undefined : { duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src={heroIllustration}
            alt="A student in headphones watching an animated Kanthast lesson about the heart on a laptop."
            width="911"
            height="526"
            fetchpriority="high"
          />
        </motion.div>
      </div>

    </section>
  );
}

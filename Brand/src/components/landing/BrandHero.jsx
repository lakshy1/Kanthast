import { Link } from "react-router-dom";
import { FaPlay, FaArrowRight, FaGraduationCap, FaStethoscope, FaSchool, FaHeart } from "react-icons/fa6";
import { HiSparkles } from "react-icons/hi2";
import { IoStatsChart } from "react-icons/io5";
import heroIllustration from "../../assets/hero/hero-illustration.jpg";

const FEATURES = [
  { icon: FaPlay, title: "Animated Learning", text: "Complex topics, made simple with engaging animations." },
  { icon: HiSparkles, title: "AI-Powered Support", text: "Get instant help with doubts while you learn." },
  { icon: IoStatsChart, title: "Track Your Progress", text: "Resume lessons and see what you have watched." },
  { icon: FaHeart, title: "For Everyone", text: "Medical aspirants, school students and lifelong learners." },
];

/** Landing hero: copy and CTAs on the left, illustration on the right, feature strip below. */
export default function BrandHero() {
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
            <a href="#products" className="bh-btn bh-btn-primary">
              <FaPlay aria-hidden="true" className="text-[0.8em]" />
              Start Learning
              <FaArrowRight aria-hidden="true" className="text-[0.8em]" />
            </a>
            <Link to="/courses" className="bh-btn bh-btn-ghost">
              <FaGraduationCap aria-hidden="true" className="text-[1.1em] text-[#1d4ed8]" />
              Explore Courses
            </Link>
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

        <div className="bh-art">
          <img
            src={heroIllustration}
            alt="A student in headphones watching an animated Kanthast lesson about the heart on a laptop."
            width="911"
            height="526"
            fetchpriority="high"
          />
        </div>
      </div>

      <ul className="bh-features" aria-label="What Kanthast offers">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title} className="bh-feature">
            <span className="bh-feature-icon" aria-hidden="true"><Icon /></span>
            <span>
              <span className="bh-feature-title">{title}</span>
              <span className="bh-feature-text">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

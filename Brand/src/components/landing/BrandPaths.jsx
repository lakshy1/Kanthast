import { useState } from "react";
import { FaPlay, FaArrowRight, FaChevronLeft, FaChevronRight, FaGraduationCap, FaStethoscope, FaBookOpen } from "react-icons/fa6";
import medicalArt from "../../assets/paths/medical.png";
import schoolArt from "../../assets/paths/school.png";
import conceptArt from "../../assets/paths/concept.png";
import iconVideo from "../../assets/paths/icon-video.png";
import iconAi from "../../assets/paths/icon-ai.png";
import iconQuiz from "../../assets/paths/icon-quiz.png";
import iconProgress from "../../assets/paths/icon-progress.png";

const PATHS = [
  { id: "medical", label: "Medical", icon: FaStethoscope, title: ["Understand", "Complex Topics"], href: "/professional", art: medicalArt, alt: "A doctor studying an animated heart on a tablet." },
  { id: "school", label: "School", icon: FaGraduationCap, title: ["Learn Better,", "Score Higher"], href: "/school", art: schoolArt, alt: "A student learning about the atom on a tablet." },
  { id: "concept", label: "Concept Library", icon: FaBookOpen, title: ["Discover", "Concepts Easily"], href: null, art: conceptArt, alt: "A glowing light bulb above a stack of books." },
];

// Order of the switch pills, as in the mockup.
const PILL_ORDER = ["school", "medical", "concept"];

const FEATURES = [
  { title: "Animated Videos", text: "Engaging animated lessons to visualize complex topics.", icon: iconVideo },
  { title: "AI Doubt Helper", text: "Get instant answers to your doubts while you learn.", icon: iconAi },
  { title: "Interactive Quizzes", text: "Test your knowledge with quizzes after each lesson.", icon: iconQuiz, soon: true },
  { title: "Track Progress", text: "Resume lessons and see what you have watched.", icon: iconProgress },
];

function slotFor(index, active) {
  const diff = (index - active + PATHS.length) % PATHS.length;
  return diff === 0 ? "center" : diff === 1 ? "right" : "left";
}

/** Second landing section: learning-path carousel, then "Why choose Kanthast". */
export default function BrandPaths() {
  const [active, setActive] = useState(1); // School in front, as in the mockup
  const go = (step) => setActive((i) => (i + step + PATHS.length) % PATHS.length);

  return (
    <>
      <section className="bp" aria-labelledby="bp-title">
        <div className="bp-inner">
          <div className="bp-copy">
            <p className="bh-eyebrow">
              <FaPlay aria-hidden="true" className="bh-eyebrow-icon" />
              Personalized Learning Paths
            </p>
            <h2 id="bp-title" className="bp-title">
              Explore Learning
              <br />
              Paths for <span className="bh-accent">Every</span>{" "}
              <span className="bh-click bh-accent">
                Learner
                <svg className="bh-underline" viewBox="0 0 200 18" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M3 13 C 50 5, 120 3, 197 9" />
                </svg>
              </span>
            </h2>
            <p className="bp-sub">
              From school concepts to advanced medical topics, pick the path that fits your learning journey.
            </p>

            <div className="bp-pills" role="tablist" aria-label="Learning paths">
              {PILL_ORDER.map((id) => {
                const index = PATHS.findIndex((p) => p.id === id);
                const { label, icon: Icon } = PATHS[index];
                const selected = index === active;
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    aria-controls={`bp-card-${id}`}
                    onClick={() => setActive(index)}
                    className={`bp-pill${selected ? " is-active" : ""}`}
                  >
                    <Icon aria-hidden="true" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bp-stage">
            <button type="button" className="bp-nav bp-nav-prev" onClick={() => go(-1)} aria-label="Previous path">
              <FaChevronLeft aria-hidden="true" />
            </button>
            <div className="bp-cards">
              {PATHS.map((path, index) => {
                const slot = slotFor(index, active);
                const Icon = path.icon;
                const isCenter = slot === "center";
                const body = (
                  <>
                    <span className="bp-chip"><Icon aria-hidden="true" />{path.label}</span>
                    <img src={path.art} alt={path.alt} className="bp-art" loading="lazy" />
                    <span className="bp-card-foot">
                      <span className="bp-card-title">{path.title[0]}<br />{path.title[1]}</span>
                      {path.href ? (
                        <span className="bp-go" aria-hidden="true"><FaArrowRight /></span>
                      ) : (
                        <span className="bp-soon">Coming soon</span>
                      )}
                    </span>
                    {isCenter && (
                      <svg className="bp-spark" viewBox="0 0 40 40" aria-hidden="true">
                        <path d="M8 4 L 12 16" /><path d="M19 13 L 30 8" /><path d="M18 23 L 32 24" />
                      </svg>
                    )}
                  </>
                );
                const common = {
                  id: `bp-card-${path.id}`,
                  className: `bp-card bp-card-${path.id} is-${slot}`,
                  "aria-hidden": !isCenter || undefined,
                };
                if (!isCenter) {
                  return (
                    <div key={path.id} {...common} onClick={() => setActive(index)}>
                      {body}
                    </div>
                  );
                }
                return path.href ? (
                  <a key={path.id} {...common} href={path.href} aria-label={`${path.label}: ${path.title.join(" ")}`}>
                    {body}
                  </a>
                ) : (
                  <div key={path.id} {...common}>{body}</div>
                );
              })}
            </div>
            <button type="button" className="bp-nav bp-nav-next" onClick={() => go(1)} aria-label="Next path">
              <FaChevronRight aria-hidden="true" />
            </button>
            <div className="bp-dots" aria-hidden="true">
              {PATHS.map((p, i) => <span key={p.id} className={i === active ? "is-active" : ""} />)}
            </div>
          </div>
        </div>
      </section>

      <section className="bw" aria-labelledby="bw-title">
        <div className="bw-panel">
          <div className="bw-copy">
            <p className="bh-eyebrow">Why Choose Kanthast?</p>
            <h2 id="bw-title" className="bp-title bw-title">
              Learn Smarter.
              <br />
              Achieve{" "}
              <span className="bh-nowrap">
                <span className="bh-click bh-accent">
                  More
                  <svg className="bh-underline" viewBox="0 0 200 18" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M3 13 C 50 5, 120 3, 197 9" />
                  </svg>
                </span>
                <span className="bh-accent">.</span>
              </span>
            </h2>
            <p className="bp-sub">A complete animated learning platform for students, learners and professionals.</p>
            <a href="#products" className="bh-btn bh-btn-primary bw-cta">
              Explore Features
              <FaArrowRight aria-hidden="true" className="text-[0.8em]" />
            </a>
          </div>
          <ul className="bw-grid">
            {FEATURES.map((f) => (
              <li key={f.title} className="bw-card">
                <img src={f.icon} alt="" className="bw-icon" loading="lazy" />
                <h3 className="bw-card-title">{f.title}</h3>
                <p className="bw-card-text">{f.text}</p>
                {f.soon && <span className="bw-soon">Coming soon</span>}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

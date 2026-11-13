import { FaPlay, FaArrowRight, FaBolt, FaBrain, FaHeart, FaQuoteLeft, FaStar } from "react-icons/fa6";
import { MdOndemandVideo } from "react-icons/md";
import playerArt from "../../assets/watch/player.jpg";
import NeoZippy from "./NeoZippy";
import IllustratedAvatar from "./IllustratedAvatar";
import { VISIBLE_TESTIMONIALS as TESTIMONIALS } from "../../data/testimonials";
import SCHOOL_CATALOG, { SAMPLE_SCRIPT } from "../../data/schoolCatalog";

const POINTS = [
  { icon: MdOndemandVideo, label: ["Engaging", "Animations"] },
  { icon: FaBolt, label: ["Interactive", "Learning"] },
  { icon: FaBrain, label: ["Smart AI", "Assistance"] },
];

const NEO_VIEW = "56 82 188 188";
const ZIPPY_VIEW = "246 70 146 152";

// Real lines from the Class X Electricity lesson script, shown until there are
// at least three real testimonials in data/testimonials.js.
const lines = SAMPLE_SCRIPT.scenes.flatMap((scene) => scene.lines);
const SCRIPT_QUOTES = lines
  .filter((l) => l.text)
  .map((l) => ({ ...l, view: l.speaker === "Zippy" ? ZIPPY_VIEW : NEO_VIEW }));

const initials = (name) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

function Avatar({ view, name }) {
  return (
    <span className="bt-avatar">
      <NeoZippy viewBox={view} label={name} className="bt-avatar-art" />
    </span>
  );
}

/** Third landing section: "Watch. Learn. Retain." and the quotes panel. */
export default function BrandWatch() {
  const real = TESTIMONIALS.length >= 3 ? TESTIMONIALS : null;
  const cards = real
    ? real.map((t) => ({
        key: t.name,
        quote: t.quote,
        name: t.name,
        role: t.role,
        rating: t.rating,
        draft: !t.approved,
        avatar: t.photo ? (
          <img src={t.photo} alt="" className="bt-avatar bt-photo" />
        ) : t.avatar ? (
          <span className="bt-avatar bt-drawn"><IllustratedAvatar config={t.avatar} className="bt-drawn-art" /></span>
        ) : (
          <span className="bt-avatar bt-initials" aria-hidden="true">{initials(t.name)}</span>
        ),
      }))
    : SCRIPT_QUOTES.map((q, i) => ({
        key: `${q.speaker}-${i}`,
        quote: q.text,
        name: q.speaker,
        role: `Class X · ${SAMPLE_SCRIPT.context.split(": ").pop()}`,
        avatar: <Avatar view={q.view} name={q.speaker} />,
      }));

  return (
    <>
      <section className="bwa" aria-labelledby="bwa-title">
        <span className="bwa-dots" aria-hidden="true" />
        <div className="bwa-inner">
          <div className="bwa-copy">
            <p className="bh-eyebrow">
              <FaPlay aria-hidden="true" className="bh-eyebrow-icon" />
              Animated Learning Experience
            </p>
            <svg className="bwa-spark" viewBox="0 0 40 40" aria-hidden="true">
              <path d="M6 22 L 11 30" /><path d="M16 12 L 18 26" /><path d="M24 30 L 34 24" />
            </svg>
            <h2 id="bwa-title" className="bwa-title">
              Watch. Learn.
              <br />
              <span className="bh-click bh-accent">
                Retain
                <svg className="bh-underline" viewBox="0 0 200 18" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M3 13 C 50 5, 120 3, 197 9" />
                </svg>
              </span>
              <span className="bh-accent">.</span>
            </h2>
            <p className="bwa-sub">
              Beautifully animated videos and lessons that make complex topics simple and engaging.
            </p>
            <ul className="bwa-points">
              {POINTS.map(({ icon: Icon, label }) => (
                <li key={label.join(" ")}>
                  <span className="bwa-point-icon" aria-hidden="true"><Icon /></span>
                  <span>{label[0]}<br />{label[1]}</span>
                </li>
              ))}
            </ul>
            <a href="#products" className="bh-btn bh-btn-primary bwa-cta">
              Explore Animated Lessons
              <FaArrowRight aria-hidden="true" className="text-[0.8em]" />
            </a>
          </div>
          <div className="bwa-art">
            <img
              src={playerArt}
              alt="An animated lesson on the human heart playing beside the Kanthast AI tutor, which answers a question about the left ventricle."
              width="932"
              height="588"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="bt" aria-labelledby="bt-title">
        <div className="bt-panel">
          <div className="bt-copy">
            <p className="bh-eyebrow">
              <FaHeart aria-hidden="true" className="bt-heart" />
              {real ? "Why Students Love Kanthast" : "Inside a Kanthast Lesson"}
            </p>
            <h2 id="bt-title" className="bt-title">
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
            <p className="bt-sub">
              {real
                ? "What our pilot testers say about learning with Kanthast."
                : "Real lines from our lesson scripts, voiced by Neo and Zippy."}
            </p>
            <div className="bt-proof">
              <span className="bt-stack" aria-hidden="true">
                {real
                  ? cards.slice(0, 4).map((c) => <span key={c.key}>{c.avatar}</span>)
                  : (
                    <>
                      <Avatar view={NEO_VIEW} name="Neo" />
                      <Avatar view={ZIPPY_VIEW} name="Zippy" />
                      <Avatar view={NEO_VIEW} name="Neo" />
                      <Avatar view={ZIPPY_VIEW} name="Zippy" />
                    </>
                  )}
              </span>
              {!real && <span className="bt-chip">{SCHOOL_CATALOG.totals.lessons} Lessons Scripted</span>}
            </div>
          </div>

          {/* Infinite marquee: the list is rendered twice and slides by half its
              width, so the loop is seamless. Pauses on hover and focus. */}
          <div className="bt-marquee" aria-label={real ? "Student reviews" : "Lines from a Kanthast lesson"}>
            <div className="bt-track" style={{ "--bt-duration": `${Math.max(cards.length, 4) * 7}s` }}>
              {[0, 1].map((copy) => (
                <ul key={copy} className="bt-list" aria-hidden={copy === 1 || undefined}>
                  {cards.map((c) => (
                    <li key={c.key} className="bt-card">
                      <span className="bt-card-top">
                        <FaQuoteLeft aria-hidden="true" className="bt-quote-mark" />
                        {c.draft && <span className="bt-draft">Draft · not live</span>}
                      </span>
                      <blockquote className="bt-quote">"{c.quote}"</blockquote>
                      <div className="bt-person">
                        {c.avatar}
                        <span>
                          <span className="bt-name">{c.name}</span>
                          <span className="bt-role">{c.role}</span>
                          {c.rating ? (
                            <span className="bt-stars" aria-label={`${c.rating} out of 5`}>
                              {Array.from({ length: c.rating }, (_, i) => <FaStar key={i} aria-hidden="true" />)}
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

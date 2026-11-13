import { FaArrowRight, FaCircleInfo, FaEye, FaBullseye, FaLightbulb, FaStethoscope, FaGraduationCap, FaPenNib } from "react-icons/fa6";
import Seo from "../components/Seo";
import SectionHead from "../components/landing/SectionHead";
import { ORGANIZATION_ID, SITE_URL, breadcrumbSchema } from "../utils/seo";
import SYLLABUS_SNAPSHOT from "../data/syllabusSnapshot";
import SCHOOL_CATALOG from "../data/schoolCatalog";

// Counts come from the real catalogues, never audience claims.
const FACTS = [
  { value: SYLLABUS_SNAPSHOT.subjects.length, label: "Medical subjects mapped" },
  { value: SYLLABUS_SNAPSHOT.subjects.reduce((sum, s) => sum + s.chapters, 0), label: "Medical chapters laid out" },
  { value: SCHOOL_CATALOG.totals.lessons, label: "School lessons scripted" },
  { value: SCHOOL_CATALOG.totals.classes, label: "School classes: VIII, IX and X" },
];

const PRINCIPLES = [
  { icon: FaEye, title: "Visual first", text: "Every lesson is built around animation, so ideas leave a picture behind, not just words." },
  { icon: FaBullseye, title: "One idea at a time", text: "Short lessons that explain one concept properly before moving to the next." },
  { icon: FaLightbulb, title: "Understanding over rote", text: "We aim for the moment a topic makes sense, not for memorising lines." },
];

const PRODUCTS = [
  {
    id: "pro",
    href: "/professional/",
    icon: FaStethoscope,
    name: "Kanthast Professional",
    text: "Animated lectures for NEET-PG, INI-CET and USMLE, organised subject by subject and chapter by chapter.",
    cta: "Explore Professional",
  },
  {
    id: "school",
    href: "/school/",
    icon: FaGraduationCap,
    name: "Kanthast School",
    text: "Animated lessons for the new NCERT books for Classes VIII to X, guided by Neo the owl and Zippy the spark.",
    cta: "Explore School",
  },
];

export default function About() {
  return (
    <div className="brand-page overflow-x-clip text-ink">
      <Seo
        title="About Kanthast | Animated lessons that make hard ideas click"
        description="Kanthast teaches through short animated lessons, one idea at a time. Learn why we started, how lessons are made, and our two products: Kanthast Professional and Kanthast School."
        path="/about"
        jsonLd={[
          {
            "@type": "AboutPage",
            "@id": `${SITE_URL}/about#webpage`,
            url: `${SITE_URL}/about`,
            name: "About Kanthast",
            about: { "@id": ORGANIZATION_ID },
            isPartOf: { "@id": `${SITE_URL}/#website` },
          },
          breadcrumbSchema([
            { name: "Kanthast", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ]}
      />

      <section className="kx-section kx-page-hero" aria-labelledby="about-title">
        <SectionHead
          as="h1"
          id="about-title"
          eyebrow="About Kanthast"
          icon={FaCircleInfo}
          before="Hard Ideas, Made"
          accent="Visual"
          note="Kanthast turns difficult subjects into short animated lessons, so students understand a topic instead of memorising it."
        />
        <ul className="kx-facts">
          {FACTS.map((f) => (
            <li key={f.label} className="kx-fact">
              <span className="kx-fact-value">{f.value}</span>
              <span className="kx-fact-label">{f.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="kx-section" aria-labelledby="story-title">
        <div className="kx-panel kx-story">
          <div>
            <p className="bh-eyebrow"><FaPenNib aria-hidden="true" className="bh-eyebrow-icon" />Our Story</p>
            <h2 id="story-title" className="bp-title kx-title">Why We Started <span className="bh-accent">Kanthast.</span></h2>
          </div>
          <div className="kx-story-text">
            <p>
              Too much learning still feels fragmented, overwhelming and memorisation-heavy. We built Kanthast to make
              difficult topics feel structured, visual and intuitive instead.
            </p>
            <p>
              Every lesson starts as a written script, scene by scene, and is then animated. The script decides what the
              student should understand; the animation shows it. Lessons are being released in stages, and anything not
              ready yet is clearly marked on the site.
            </p>
          </div>
        </div>
      </section>

      <section className="kx-section" aria-labelledby="principles-title">
        <SectionHead id="principles-title" eyebrow="How We Teach" before="What We" accent="Believe" />
        <ul className="kx-ai kx-principles">
          {PRINCIPLES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="kx-ai-card">
              <span className="kx-badge" aria-hidden="true"><Icon /></span>
              <span className="kx-ai-text">
                <span className="kx-ai-title">{title}</span>
                <span className="kx-ai-body">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="kx-section kx-section-last" aria-labelledby="products-about-title">
        <SectionHead
          id="products-about-title"
          eyebrow="Two Products"
          before="Built for Medicine and"
          accent="School"
          note="Two separate apps, each with its own account."
        />
        <div className="kx-products kx-products-compact">
          {PRODUCTS.map(({ icon: Icon, ...p }) => (
            <a key={p.id} href={p.href} className={`kx-product kx-product-${p.id}`}>
              <div className="kx-product-head">
                <span className="kx-badge" aria-hidden="true"><Icon /></span>
                <div>
                  <h3 className="kx-product-name">{p.name}</h3>
                  <p className="kx-product-purpose">{p.text}</p>
                </div>
              </div>
              <div className="kx-product-foot">
                <span />
                <span className="bh-btn bh-btn-primary kx-product-cta">
                  {p.cta}
                  <FaArrowRight aria-hidden="true" className="text-[0.8em]" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

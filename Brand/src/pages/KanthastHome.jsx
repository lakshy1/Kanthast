import { useState } from "react";
import { FaChevronDown, FaRobot, FaClockRotateLeft, FaChartColumn, FaCrosshairs, FaArrowsRotate, FaListCheck, FaArrowRight, FaStethoscope, FaGraduationCap, FaPlay, FaWandMagicSparkles, FaCircleQuestion } from "react-icons/fa6";
import Seo from "../components/Seo";
import { ORGANIZATION_ID, SITE_URL, breadcrumbSchema, faqSchema } from "../utils/seo";
import ScriptPage from "../components/landing/ScriptPage";
import BrandHero from "../components/landing/BrandHero";
import BrandPaths from "../components/landing/BrandPaths";
import BrandWatch from "../components/landing/BrandWatch";
import CircuitScene from "../components/landing/CircuitScene";
import NeoZippy from "../components/landing/NeoZippy";
import DeviceShowcase from "../components/landing/DeviceShowcase";
import SYLLABUS_SNAPSHOT from "../data/syllabusSnapshot";
import SCHOOL_CATALOG from "../data/schoolCatalog";

const PRO = {
  subjects: SYLLABUS_SNAPSHOT.subjects.length,
  chapters: SYLLABUS_SNAPSHOT.subjects.reduce((sum, s) => sum + s.chapters, 0),
};
const SCHOOL = SCHOOL_CATALOG.totals;

const EXAMS = [{ label: "NEET-PG" }, { label: "INI-CET" }, { label: "USMLE" }, { label: "NEET-UG", soon: true }];
// Real chapter titles from the School scripts, two either side of Neo and Zippy.
const CHAPTER_CHIPS = ["Electricity", "Real Numbers", "The French Revolution", "A Square and A Cube"];

// What works today, and what is being built. Planned items are always labelled.
const AI = [
  { icon: FaRobot, title: "Kanthast Assistant", body: "Ask about a topic while you study.", live: true },
  { icon: FaClockRotateLeft, title: "Resume to the second", body: "Pick up exactly where you stopped.", live: true },
  { icon: FaChartColumn, title: "Progress by subject", body: "See how far through each subject you are.", live: true },
  { icon: FaCrosshairs, title: "Ask about this frame", body: "Pause and ask about what is on screen." },
  { icon: FaArrowsRotate, title: "Revision on time", body: "Recaps that return before you forget." },
  { icon: FaListCheck, title: "Questions after lessons", body: "Find the gap while the idea is fresh." },
];

const FAQS = [
  {
    q: "What is Kanthast?",
    a: "Kanthast teaches through short animated lessons, one idea at a time, with AI help for when you get stuck. It has two products: Kanthast Professional for medical entrance exams and Kanthast School for Classes VIII to X.",
  },
  {
    q: "Which one should I choose?",
    a: "If you are preparing for NEET-PG, INI-CET or USMLE, choose Kanthast Professional. If you are in Class VIII, IX or X, or buying for a child who is, choose Kanthast School. Each product has its own account, so sign up for the one you need.",
  },
  {
    q: "Can I watch Kanthast School lessons now?",
    a: `Not yet. All ${SCHOOL.lessons} lessons for Classes VIII to X are scripted, and the animated videos are being produced now.`,
  },
  {
    q: "What does the AI do today?",
    a: "Signed-in students can ask the Kanthast Assistant about a topic or about using the platform. Asking about the exact frame you are watching, timed revision and end-of-lesson questions are being built and are marked as coming soon.",
  },
];

// Section heading in the landing design language: eyebrow pill, left-aligned
// heading with one accented, underlined word, and an optional side note.
function SectionHead({ id, eyebrow, icon: Icon = FaPlay, before, accent, after = ".", note, children }) {
  return (
    <div className="kx-head">
      <div>
        <p className="bh-eyebrow">
          <Icon aria-hidden="true" className="bh-eyebrow-icon" />
          {eyebrow}
        </p>
        <h2 id={id} className="bp-title kx-title">
          {before}{" "}
          <span className="bh-nowrap">
            <span className="bh-click bh-accent">
              {accent}
              <svg className="bh-underline" viewBox="0 0 200 18" preserveAspectRatio="none" aria-hidden="true">
                <path d="M3 13 C 50 5, 120 3, 197 9" />
              </svg>
            </span>
            <span className="bh-accent">{after}</span>
          </span>
        </h2>
      </div>
      {(note || children) && (
        <div className="kx-note">
          {note && <p>{note}</p>}
          {children}
        </div>
      )}
    </div>
  );
}

function FaqList() {
  const [open, setOpen] = useState(null);
  return (
    <div className="kx-faq">
      {FAQS.map((item, index) => (
        <details
          key={item.q}
          open={open === index}
          onToggle={(event) => {
            if (event.currentTarget.open) setOpen(index);
            else if (open === index) setOpen(null);
          }}
          className="kx-faq-item"
        >
          <summary className="kx-faq-q">
            <span>{item.q}</span>
            <span className="kx-faq-toggle" aria-hidden="true"><FaChevronDown /></span>
          </summary>
          <p className="kx-faq-a">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export default function KanthastHome() {
  return (
    <div className="page-aurora brand-page overflow-x-clip text-ink">
      <Seo
        title="Kanthast | Animated lessons with AI help, for medical exams and school"
        description="Kanthast teaches one idea at a time through short animated lessons. Kanthast Professional for NEET-PG, INI-CET and USMLE; Kanthast School for Classes VIII to X."
        path="/"
        jsonLd={[
          {
            "@type": "EducationalOrganization",
            "@id": ORGANIZATION_ID,
            name: "Kanthast",
            url: SITE_URL,
            logo: `${SITE_URL}/logo.png`,
            description: "Short animated lessons with AI help, for medical entrance exams and for school.",
            sameAs: ["https://www.linkedin.com/company/kanthast/"],
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Kanthast products",
              itemListElement: [
                { "@type": "Course", name: "Kanthast Professional", url: `${SITE_URL}/professional`, provider: { "@id": ORGANIZATION_ID } },
                { "@type": "Course", name: "Kanthast School", url: `${SITE_URL}/school`, provider: { "@id": ORGANIZATION_ID } },
              ],
            },
          },
          { "@type": "WebSite", "@id": `${SITE_URL}/#website`, url: SITE_URL, name: "Kanthast", publisher: { "@id": ORGANIZATION_ID } },
          faqSchema(FAQS),
          breadcrumbSchema([{ name: "Kanthast", path: "/" }]),
        ]}
      />

      <BrandHero />
      <BrandPaths />
      <BrandWatch />

      {/* The two products: identical structure, different accent. */}
      <section id="products" aria-labelledby="products-heading" className="kx-section">
        <SectionHead
          id="products-heading"
          eyebrow="Two Products, One Kanthast"
          before="Choose Your"
          accent="Kanthast"
          note="Two separate apps with their own accounts: one for medical entrance exams, one for school."
        />
        <div className="kx-products">
          {[
            {
              id: "pro",
              href: "/professional",
              icon: FaStethoscope,
              name: "Kanthast Professional",
              purpose: "Animated lectures for medical entrance exams.",
              chips: EXAMS.map((e) => ({ label: e.label, soon: e.soon })),
              chipsLabel: "Exams",
              stage: (
                <DeviceShowcase
                  desktopSrc="/device-macbook-screen.png"
                  mobileSrc="/device-iphone-screen.png"
                  desktopAlt="The Kanthast Professional lecture player on a laptop."
                  mobileAlt="The Kanthast Professional home screen on a phone."
                />
              ),
              stat: `${PRO.subjects} subjects, ${PRO.chapters} chapters mapped`,
              cta: "Explore Professional",
            },
            {
              id: "school",
              href: "/school",
              icon: FaGraduationCap,
              name: "Kanthast School",
              purpose: "Animated lessons for the new NCERT books.",
              chips: SCHOOL_CATALOG.classes.map((c) => ({ label: c.name })),
              chipsLabel: "Classes",
              stage: (
                <>
                  <NeoZippy className="showcase-cast" />
                  {CHAPTER_CHIPS.map((chapter, i) => (
                    <span key={chapter} className={`float-chip float-chip-${i + 1}`} aria-hidden="true">
                      {chapter}
                    </span>
                  ))}
                </>
              ),
              stat: `${SCHOOL.lessons} lessons scripted, animation in production`,
              cta: "Explore School",
            },
          ].map(({ icon: Icon, ...card }) => (
            <a key={card.id} href={card.href} className={`kx-product kx-product-${card.id}`} aria-labelledby={`sc-${card.id}`}>
              <div className="kx-product-head">
                <span className="kx-badge" aria-hidden="true"><Icon /></span>
                <div>
                  <h3 id={`sc-${card.id}`} className="kx-product-name">{card.name}</h3>
                  <p className="kx-product-purpose">{card.purpose}</p>
                </div>
              </div>
              <ul className="kx-chips" aria-label={card.chipsLabel}>
                {card.chips.map((chip) => (
                  <li key={chip.label} className={`kx-chip${chip.soon ? " kx-chip-soon" : ""}`}>
                    {chip.label}
                    {chip.soon && <span className="kx-chip-flag">soon</span>}
                  </li>
                ))}
              </ul>
              <div className={`kx-stage showcase-stage showcase-stage-${card.id}`}>{card.stage}</div>
              <div className="kx-product-foot">
                <span>{card.stat}</span>
                <span className="bh-btn bh-btn-primary kx-product-cta">
                  {card.cta}
                  <FaArrowRight aria-hidden="true" className="text-[0.8em]" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Signature: the script, and the scene it becomes. */}
      <section aria-labelledby="made-heading" className="kx-section">
        <SectionHead
          id="made-heading"
          eyebrow="How Lessons Are Made"
          before="From Script to"
          accent="Scene"
          note="Every lesson starts as a script, then comes to life as animation. This is a real one, from Class X Science."
        />
        <div className="kx-panel kx-made">
          <ScriptPage scenes={2} compact />
          <div className="kx-made-arrow" aria-hidden="true"><FaArrowRight /></div>
          <div className="kx-made-scene">
            <span className="kx-made-label"><FaPlay aria-hidden="true" /> The scene it becomes</span>
            <CircuitScene light />
          </div>
        </div>
      </section>

      {/* AI, as cards: live ones first, planned ones marked. */}
      <section aria-labelledby="ai-heading" className="kx-section">
        <SectionHead
          id="ai-heading"
          eyebrow="AI-Powered Help"
          icon={FaWandMagicSparkles}
          before="AI That Helps You"
          accent="Learn"
          note="What works today, and what is being built. Anything not ready yet is marked."
        />
        <ul className="kx-ai">
          {AI.map(({ icon: Icon, title, body, live }) => (
            <li key={title} className={`kx-ai-card${live ? "" : " is-soon"}`}>
              <span className="kx-badge" aria-hidden="true"><Icon /></span>
              <span className="kx-ai-text">
                <span className="kx-ai-title">
                  {title}
                  {live ? <span className="kx-live">Live</span> : <span className="bp-soon">Coming soon</span>}
                </span>
                <span className="kx-ai-body">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="brand-faq" className="kx-section kx-section-last">
        <div className="kx-panel kx-faq-wrap">
          <SectionHead id="brand-faq" eyebrow="FAQ" icon={FaCircleQuestion} before="Got" accent="Questions" after="?">
            <p>Short answers about both products. Still unsure? Write to us.</p>
            <a href="/contact" className="bh-btn bh-btn-primary kx-faq-cta">
              Contact Us
              <FaArrowRight aria-hidden="true" className="text-[0.8em]" />
            </a>
          </SectionHead>
          <FaqList />
        </div>
      </section>
    </div>
  );
}

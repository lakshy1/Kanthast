import { useState } from "react";
import { Link } from "react-router-dom";
import { FaChevronDown, FaRobot, FaClockRotateLeft, FaChartColumn, FaCrosshairs, FaArrowsRotate, FaListCheck } from "react-icons/fa6";
import Seo from "../components/Seo";
import { ORGANIZATION_ID, SITE_URL, breadcrumbSchema, faqSchema } from "../utils/seo";
import ScriptPage from "../components/landing/ScriptPage";
import Hero3D from "../components/landing/Hero3D";
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
    a: "If you are preparing for NEET-PG, INI-CET or USMLE, choose Kanthast Professional. If you are in Class VIII, IX or X, or buying for a child who is, choose Kanthast School. One account works across both.",
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

function FaqList() {
  const [open, setOpen] = useState(null);
  return (
    <div className="divide-y divide-line border-y border-line">
      {FAQS.map((item, index) => (
        <details
          key={item.q}
          open={open === index}
          onToggle={(event) => {
            if (event.currentTarget.open) setOpen(index);
            else if (open === index) setOpen(null);
          }}
          className="group"
        >
          <summary className="flex min-h-touch cursor-pointer list-none items-center gap-4 py-5 [&::-webkit-details-marker]:hidden">
            <span className="flex-1 text-lg font-semibold text-ink group-hover:text-brand">{item.q}</span>
            <FaChevronDown aria-hidden="true" className="shrink-0 text-sm text-ink-subtle transition-transform group-open:rotate-180" />
          </summary>
          <p className="max-w-[65ch] pb-6 leading-relaxed text-ink-muted">{item.a}</p>
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

      {/* Hero: a centred promise, flanked by the 3D helix and atom. */}
      <section className="brand-hero">
        <Hero3D fallback={<div className="hero3d-fallback" />} />
        <div className="brand-hero-copy site-container">
          <h1 className="brand-title mx-auto max-w-[14ch]">Hard ideas, animated until they click.</h1>
          <p className="mx-auto mt-6 max-w-[44ch] text-lg leading-relaxed text-ink-muted md:text-xl">
            Short animated lessons with AI help, for medical exams and for school.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/professional" className="door-cta door-cta-pro">Kanthast Professional</Link>
            <Link to="/school" className="door-cta door-cta-school">Kanthast School</Link>
          </div>
        </div>
      </section>

      {/* The two products: identical structure, different accent. */}
      <section aria-label="Kanthast products" className="site-container grid gap-6 py-12 md:grid-cols-2">
        {[
          {
            id: "pro",
            to: "/professional",
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
            to: "/school",
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
        ].map((card) => (
          <Link key={card.id} to={card.to} className={`showcase showcase-${card.id}`} aria-labelledby={`sc-${card.id}`}>
            <div className="showcase-text">
              <h2 id={`sc-${card.id}`} className="door-name">{card.name}</h2>
              <p className="text-ink-muted">{card.purpose}</p>
              <ul className="chip-row" aria-label={card.chipsLabel}>
                {card.chips.map((chip) => (
                  <li key={chip.label} className={`chip chip-${card.id}${chip.soon ? " chip-soon" : ""}`}>
                    {chip.label}
                    {chip.soon && <span className="sr-only"> (coming soon)</span>}
                  </li>
                ))}
              </ul>
            </div>
            <div className={`showcase-stage showcase-stage-${card.id}`}>{card.stage}</div>
            <div className="showcase-foot">
              <span>{card.stat}</span>
              <span className={`showcase-cta showcase-cta-${card.id}`}>{card.cta}</span>
            </div>
          </Link>
        ))}
      </section>

      {/* Signature: the script, and the scene it becomes. */}
      <section aria-labelledby="made-heading" className="site-container py-16 md:py-24">
        <h2 id="made-heading" className="brand-h2 mx-auto max-w-[18ch] text-center">Every lesson starts as a script, then comes to life.</h2>
        <div className="script-to-scene mt-10">
          <ScriptPage scenes={2} compact />
          <div className="script-arrow" aria-hidden="true">
            <span />
          </div>
          <CircuitScene />
        </div>
      </section>

      {/* AI, as tiles: live ones solid, planned ones marked. */}
      <section aria-labelledby="ai-heading" className="site-container py-16 md:py-24">
        <h2 id="ai-heading" className="brand-h2 mx-auto max-w-[20ch] text-center">AI that helps you learn.</h2>
        <ul className="ai-grid mt-10">
          {AI.map(({ icon: Icon, title, body, live }) => (
            <li key={title} className={`ai-tile${live ? "" : " ai-tile-next"}`}>
              <span className="ai-icon" aria-hidden="true">
                <Icon />
              </span>
              <p className="mt-4 flex flex-wrap items-center gap-2 font-semibold text-ink">
                {title}
                {!live && <span className="soon-badge">Coming soon</span>}
              </p>
              <p className="mt-1 text-sm text-ink-muted">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="brand-faq" className="site-container py-16 md:py-24">
        <h2 id="brand-faq" className="brand-h2 text-center">Questions</h2>
        <div className="mx-auto mt-10 max-w-3xl">
          <FaqList />
        </div>
      </section>
    </div>
  );
}

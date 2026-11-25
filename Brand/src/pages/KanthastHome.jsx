import { useState } from "react";
import { FaChevronDown, FaRobot, FaClockRotateLeft, FaChartColumn, FaCrosshairs, FaArrowsRotate, FaListCheck, FaArrowRight, FaStethoscope, FaGraduationCap, FaWandMagicSparkles, FaCircleQuestion, FaBuilding } from "react-icons/fa6";
import Seo from "../components/Seo";
import { ORGANIZATION_ID, SITE_URL, breadcrumbSchema, faqSchema } from "../utils/seo";
import SectionHead from "../components/landing/SectionHead";
import BrandHero from "../components/landing/BrandHero";
import BrandWatch from "../components/landing/BrandWatch";
import FocusCarousel from "../components/landing/FocusCarousel";
import "../styles/brand-carousel.css";
import Reveal from "../components/landing/Reveal";
import WaitlistSection from "../components/landing/WaitlistSection";
import NeoZippy from "../components/landing/NeoZippy";
import DeviceShowcase from "../components/landing/DeviceShowcase";
import SYLLABUS_SNAPSHOT from "../data/syllabusSnapshot";
import SCHOOL_CATALOG from "../data/schoolCatalog";
import conceptArt from "../assets/paths/concept.png";

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
    a: "Kanthast teaches through short animated lessons, one idea at a time, with AI help for when you get stuck. Kanthast Professional is for medical entrance exams and Kanthast School is for Classes VIII to X. Kanthast Corporate, for teams, is planned.",
  },
  {
    q: "Which one should I choose?",
    a: "If you are preparing for NEET-PG, INI-CET or USMLE, choose Kanthast Professional. If you are in Class VIII, IX or X, or buying for a child who is, choose Kanthast School. Each product has its own account, so sign up for the one you need. Corporate is not open yet.",
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
            <Reveal><BrandWatch /></Reveal>

      {/* The two products: identical structure, different accent. */}
      <Reveal>
      <section id="products" aria-labelledby="products-heading" className="kx-section">
        <SectionHead
          id="products-heading"
          eyebrow="Three Ways to Learn"
          before="Choose Your"
          accent="Kanthast"
          note="Medical exams and school are live to join today. Corporate is planned. Each has its own account."
        />
        <div className="kx-products kx-products-stack">
          {[
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
              id: "corporate",
              icon: FaBuilding,
              name: "Kanthast Corporate",
              purpose: "Animated lessons for teams and workplaces.",
              chips: [],
              chipsLabel: "",
              stage: <img src={conceptArt} alt="A glowing light bulb above a stack of books." className="kx-stage-art" loading="lazy" />,
              stat: "Planned. We will announce it here first.",
              cta: "Coming soon",
            },
          ].map(({ icon: Icon, ...card }) => {
            const body = (
              <>
                <div className="kx-product-copy">
                  <div className="kx-product-head">
                    <span className="kx-badge" aria-hidden="true"><Icon /></span>
                    <div>
                      <h3 id={`sc-${card.id}`} className="kx-product-name">{card.name}</h3>
                      <p className="kx-product-purpose">{card.purpose}</p>
                    </div>
                  </div>
                  {card.chips.length > 0 && (
                    <ul className="kx-chips" aria-label={card.chipsLabel}>
                      {card.chips.map((chip) => (
                        <li key={chip.label} className={`kx-chip${chip.soon ? " kx-chip-soon" : ""}`}>
                          {chip.label}
                          {chip.soon && <span className="kx-chip-flag">soon</span>}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="kx-product-foot">
                    <span>{card.stat}</span>
                    {card.href ? (
                      <span className="bh-btn bh-btn-primary kx-product-cta">
                        {card.cta}
                        <FaArrowRight aria-hidden="true" className="text-[0.8em]" />
                      </span>
                    ) : (
                      <span className="kx-soon-pill">{card.cta}</span>
                    )}
                  </div>
                </div>
                <div className={`kx-stage showcase-stage showcase-stage-${card.id}`}>{card.stage}</div>
              </>
            );
            return card.href ? (
              <a key={card.id} href={card.href} className={`kx-product kx-product-${card.id}`} aria-labelledby={`sc-${card.id}`}>{body}</a>
            ) : (
              <div key={card.id} className={`kx-product kx-product-${card.id} is-planned`} role="group" aria-labelledby={`sc-${card.id}`}>{body}</div>
            );
          })}
        </div>
      </section>
      </Reveal>

      {/* AI, as cards: live ones first, planned ones marked. */}
      <Reveal>
      <section aria-labelledby="ai-heading" className="kx-section">
        <SectionHead
          id="ai-heading"
          eyebrow="AI-Powered Help"
          icon={FaWandMagicSparkles}
          before="AI That Helps You"
          accent="Learn"
          note="What works today, and what is being built. Anything not ready yet is marked."
        />
        <div className="mt-8">
          <FocusCarousel label="AI help, live and planned" autoplayMs={2000} slideWidth="min(82vw, 400px)">
            {AI.map(({ icon: Icon, title, body, live }, index) => (
              <article key={title} className={`ai-card${live ? "" : " is-soon"}`}>
                <span className="ai-num" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <span className="ai-icon" aria-hidden="true"><Icon /></span>
                <h3 className="ai-title">{title}</h3>
                <p className="ai-body">{body}</p>
                <span className="ai-status">{live ? "Live now" : "Coming soon"}</span>
              </article>
            ))}
          </FocusCarousel>
        </div>
      </section>
      </Reveal>

      <Reveal>
      <section aria-labelledby="brand-faq" className="kx-section">
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
      </Reveal>

      <Reveal><WaitlistSection /></Reveal>
    </div>
  );
}

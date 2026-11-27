import { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
import CountUpNumber from "../components/landing/CountUpNumber";
import HowItWorks from "../components/landing/HowItWorks";
import InteractiveTeaser from "../components/landing/InteractiveTeaser";
import TestimonialsStrip from "../components/landing/TestimonialsStrip";
import TiltCard3D from "../components/landing/TiltCard3D";
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
  const [open, setOpen] = useState(0);
  const reduce = useReducedMotion();
  return (
    <div className="kx-faq">
      {FAQS.map((item, index) => {
        const isOpen = open === index;
        const panelId = `faq-panel-${index}`;
        return (
          <div
            key={item.q}
            className={`kx-faq-item transition-colors duration-200 ${isOpen ? "bg-white/70" : ""}`}
          >
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : index)}
              className="kx-faq-q w-full text-left"
            >
              <span>{item.q}</span>
              <motion.span
                className="kx-faq-toggle"
                aria-hidden="true"
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 320, damping: 24 }}
              >
                <FaChevronDown />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  role="region"
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <p className="kx-faq-a">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
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
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
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
              stat: (
                <>
                  <CountUpNumber value={SCHOOL.lessons} /> lessons scripted, animation in production
                </>
              ),
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
              stat: (
                <>
                  <CountUpNumber value={PRO.subjects} /> subjects, <CountUpNumber value={PRO.chapters} /> chapters mapped
                </>
              ),
              cta: "Explore Professional",
            },
          // eslint-disable-next-line no-unused-vars
          ].map(({ icon: Icon, ...card }) => {
            const spotlightColor =
              card.id === "school" ? "rgba(242, 160, 7, 0.14)" : "rgba(29, 78, 216, 0.13)";
            return (
              <TiltCard3D
                key={card.id}
                as="a"
                href={card.href}
                spotlightColor={spotlightColor}
                className={`kx-product kx-product-${card.id} flex h-full flex-col justify-between gap-5`}
                aria-labelledby={`sc-${card.id}`}
              >
                <div className="kx-product-copy">
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
                </div>

                <div className={`kx-stage showcase-stage showcase-stage-${card.id} min-h-[230px]`}>
                  {card.stage}
                </div>

                <div className="kx-product-foot !mt-0 !flex-row !items-center !justify-between">
                  <span className="text-sm font-medium text-ink/70">{card.stat}</span>
                  <span className="bh-btn bh-btn-primary kx-product-cta shrink-0">
                    {card.cta}
                    <FaArrowRight aria-hidden="true" className="text-[0.8em]" />
                  </span>
                </div>
              </TiltCard3D>
            );
          })}

          <div className="lg:col-span-2">
            <TiltCard3D
              as="div"
              spotlightColor="rgba(15, 118, 110, 0.12)"
              className="kx-product kx-product-corporate is-planned flex flex-col gap-4 md:flex-row md:items-center md:justify-between !py-5"
              role="group"
              aria-labelledby="sc-corporate"
            >
              <div className="flex items-center gap-4">
                <span className="kx-badge shrink-0" aria-hidden="true"><FaBuilding /></span>
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 id="sc-corporate" className="kx-product-name !text-xl">Kanthast Corporate</h3>
                    <span className="kx-soon-pill">Coming soon</span>
                  </div>
                  <p className="kx-product-purpose mt-0.5 text-sm">
                    Visual onboarding and compliance modules for teams — same one-idea-at-a-time clarity.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 md:shrink-0">
                <ul className="kx-chips" aria-label="Corporate tracks">
                  <li className="kx-chip">Teams</li>
                  <li className="kx-chip">Onboarding</li>
                  <li className="kx-chip kx-chip-soon">Custom Tracks <span className="kx-chip-flag">soon</span></li>
                </ul>
                <a href="#waitlist" className="bh-btn bh-btn-ghost text-sm">
                  Join waitlist
                  <FaArrowRight aria-hidden="true" className="text-[0.8em]" />
                </a>
              </div>
            </TiltCard3D>
          </div>
        </div>
      </section>
      </Reveal>

      {/* AI, as cards: live ones first, planned ones marked. */}
      <Reveal><HowItWorks /></Reveal>
      <Reveal><InteractiveTeaser /></Reveal>
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
            {/* eslint-disable-next-line no-unused-vars */}
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

      <Reveal><TestimonialsStrip /></Reveal>

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

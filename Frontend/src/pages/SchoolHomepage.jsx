import { useState } from "react";
import { Link } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa6";
import Seo from "../components/Seo";
import { ORGANIZATION_ID, SITE_URL, breadcrumbSchema, faqSchema } from "../utils/seo";
import ScriptPage from "../components/landing/ScriptPage";
import NeoZippy from "../components/landing/NeoZippy";
import SCHOOL_CATALOG from "../data/schoolCatalog";

const { classes: CLASSES, totals: TOTALS } = SCHOOL_CATALOG;

// The shape of every lesson, taken from the writers' brief. It is a real
// sequence, so it is numbered.
const LESSON_SHAPE = [
  { title: "A hook", body: "Each lesson opens on a funny or surprising moment, like a bulb that seems to know you pressed the switch." },
  { title: "The idea, drawn step by step", body: "Diagrams, maps, timelines and proofs are animated as they are built, the way the textbook expects students to draw them." },
  { title: "An exam tip", body: "A common mistake, a frequently asked question or a marking-scheme point, where one fits." },
  { title: "A three-point recap", body: "Neo closes every lesson with the three things to remember, shown on screen." },
];

const FOR_PARENTS = [
  { title: "Tied to the textbook", body: "Every lesson names its class, subject and chapter in the new NCERT books, so you can match it to schoolwork." },
  { title: "No ads, no social feed", body: "Kanthast has nothing to scroll and nobody to follow. Time on it is time on a lesson." },
  { title: "Made for phones", body: "Lessons are short enough for a bus ride and work on any modern phone or laptop." },
];
const PARENTS_NEXT = [
  { title: "Questions after every lesson", body: "A few questions at the end, so a gap shows up while the idea is fresh." },
  { title: "Progress you can see", body: "A view of what your child watched this week, chapter by chapter." },
];

const FAQS = [
  {
    q: "Which classes and boards does Kanthast School cover?",
    a: "Classes VIII, IX and X, following CBSE and the new NCERT textbooks introduced for 2025-26. Classes I to VII will follow. State boards are not covered yet.",
  },
  {
    q: "Which subjects are included?",
    a: "Mathematics, Science, Social Science, English and Hindi in all three classes, with Sanskrit in Class VIII and Information Technology in Classes IX and X.",
  },
  {
    q: "Can my child watch lessons now?",
    a: `Not yet. All ${TOTALS.lessons} lessons for Classes VIII to X are scripted and checked against the textbooks, and the animated videos are being produced now.`,
  },
  {
    q: "How long is each lesson?",
    a: "Between 2 and 3.5 minutes. Each lesson covers one sub-topic of a chapter, so a chapter is a short series rather than one long video.",
  },
  {
    q: "Are Hindi and Sanskrit lessons in English?",
    a: "No. Language lessons are taught in their own language. Only the directions for the animation team are written in English.",
  },
  {
    q: "How much does it cost?",
    a: `${SCHOOL_CATALOG.price}. Payments open when the first lessons are released.`,
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
            <span className="flex-1 text-lg font-semibold text-ink group-hover:text-[var(--school-ink)]">{item.q}</span>
            <FaChevronDown aria-hidden="true" className="shrink-0 text-sm text-ink-subtle transition-transform group-open:rotate-180" />
          </summary>
          <p className="max-w-[65ch] pb-6 leading-relaxed text-ink-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

export default function SchoolHomepage() {
  return (
    <div className="page-aurora brand-page school-page overflow-x-clip text-ink">
      <Seo
        title="Kanthast School | Animated NCERT lessons for Classes VIII, IX and X"
        description={`Short animated lessons for the new NCERT books (2025-26), Classes VIII to X: Maths, Science, Social Science, English, Hindi and more. ${TOTALS.lessons} lessons across ${TOTALS.chapters} chapters, now in production.`}
        path="/school"
        jsonLd={[
          ...CLASSES.map((cls) => ({
            "@type": "Course",
            "@id": `${SITE_URL}/school#${cls.id}`,
            name: `Kanthast School: ${cls.name}`,
            description: `${cls.lessons} short animated lessons across ${cls.chapters} chapters of the new NCERT books for ${cls.name}: ${cls.subjects.join(", ")}.`,
            url: `${SITE_URL}/school#${cls.id}`,
            inLanguage: ["en", "hi"],
            educationalLevel: cls.name,
            teaches: cls.subjects,
            provider: { "@id": ORGANIZATION_ID },
          })),
          faqSchema(FAQS),
          breadcrumbSchema([
            { name: "Kanthast", path: "/" },
            { name: "School", path: "/school" },
          ]),
        ]}
      />

      <section className="site-container grid items-center gap-12 pb-16 pt-16 md:pb-24 md:pt-24 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div>
          <h1 className="brand-title max-w-[15ch]">Every chapter, as a short cartoon that explains it properly.</h1>
          <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-ink-muted md:text-xl">
            Kanthast School turns the new NCERT books for Classes VIII to X into animated lessons of{" "}
            {SCHOOL_CATALOG.lessonLength}, guided by Neo the owl and Zippy the spark.
          </p>
          <p className="school-status mt-6">
            All {TOTALS.lessons} lessons are scripted. The animated videos are being made now.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/school/signup" className="door-cta door-cta-school">Create a School account</Link>
            <a href="#classes" className="door-cta school-cta-ghost">See what is covered</a>
          </div>
        </div>
        <NeoZippy />
      </section>

      <section aria-labelledby="guides-heading" className="site-container py-16 md:py-20">
        <h2 id="guides-heading" className="brand-h2">Two guides, in every lesson.</h2>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <div className="guide">
            <p className="guide-name guide-neo">Neo</p>
            <p className="mt-2 max-w-[48ch] text-ink-muted">
              A round, cheerful owl in a lab coat, goggles pushed up on his forehead. Calm and a little witty, he does
              the explaining.
            </p>
          </div>
          <div className="guide">
            <p className="guide-name guide-zippy">Zippy</p>
            <p className="mt-2 max-w-[48ch] text-ink-muted">
              A small, bouncy electric-blue spark. He asks the questions a student would ask, and sometimes gets things
              wrong so Neo can put them right.
            </p>
          </div>
        </div>
      </section>

      <section id="classes" aria-labelledby="classes-heading" className="site-container scroll-mt-28 py-16 md:py-20">
        <h2 id="classes-heading" className="brand-h2">What is covered</h2>
        <p className="mt-4 max-w-[60ch] text-lg text-ink-muted">
          {TOTALS.lessons} lessons across {TOTALS.chapters} chapters, written for the NCERT books introduced in 2025-26.
          Classes I to VII will follow.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {CLASSES.map((cls) => (
            <article key={cls.id} id={cls.id} className="class-col scroll-mt-28">
              <h3 className="class-name">{cls.name}</h3>
              <p className="class-count">
                <span className="tabular-nums">{cls.lessons}</span> lessons, <span className="tabular-nums">{cls.chapters}</span> chapters
              </p>
              <p className="mt-4 text-sm font-semibold text-ink">Subjects</p>
              <p className="mt-1 text-ink-muted">{cls.subjects.join(", ")}</p>
              <p className="mt-4 text-sm font-semibold text-ink">Chapters include</p>
              <ul className="mt-1 grid gap-1 text-ink-muted">
                {cls.sample.map((chapter) => (
                  <li key={chapter}>{chapter}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="shape-heading" className="site-container py-16 md:py-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
          <div>
            <h2 id="shape-heading" className="brand-h2">How every lesson runs</h2>
            <ol className="mt-8 grid gap-6">
              {LESSON_SHAPE.map((step, index) => (
                <li key={step.title} className="shape-step">
                  <span className="shape-no" aria-hidden="true">{index + 1}</span>
                  <div>
                    <p className="font-semibold text-ink">{step.title}</p>
                    <p className="mt-1 text-ink-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="mb-4 text-ink-muted">Here is the start of a real script, from Class X Science.</p>
            <ScriptPage />
          </div>
        </div>
      </section>

      <section id="parents" aria-labelledby="parents-heading" className="site-container scroll-mt-28 py-16 md:py-20">
        <h2 id="parents-heading" className="brand-h2">For parents</h2>
        <div className="mt-10 grid gap-12 md:grid-cols-2">
          <ul className="grid gap-6">
            {FOR_PARENTS.map((item) => (
              <li key={item.title} className="ai-item ai-item-school">
                <p className="font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-ink-muted">{item.body}</p>
              </li>
            ))}
          </ul>
          <ul className="grid content-start gap-6">
            {PARENTS_NEXT.map((item) => (
              <li key={item.title} className="ai-item ai-item-next">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                  {item.title}
                  <span className="soon-badge">Coming soon</span>
                </p>
                <p className="mt-1 text-ink-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="pricing" aria-labelledby="pricing-heading" className="site-container scroll-mt-28 py-16 md:py-20">
        <div className="school-price">
          <div>
            <h2 id="pricing-heading" className="brand-h2">{SCHOOL_CATALOG.price}</h2>
            <p className="mt-3 max-w-[48ch] text-ink-muted">
              One price for Kanthast School. Payments open when the first lessons are released; until then, creating an
              account is free.
            </p>
          </div>
          <Link to="/school/signup" className="door-cta door-cta-school">Create a School account</Link>
        </div>
      </section>

      <section aria-labelledby="school-faq" className="site-container grid gap-10 py-16 md:py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <h2 id="school-faq" className="brand-h2">Questions parents ask</h2>
        <FaqList />
      </section>

      <section className="site-container flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between">
        <p className="max-w-[52ch] text-ink-muted">
          Preparing for NEET-PG, INI-CET or USMLE instead?{" "}
          <Link to="/professional" className="font-semibold text-[var(--pro)] underline-offset-4 hover:underline">
            See Kanthast Professional
          </Link>
        </p>
      </section>
    </div>
  );
}

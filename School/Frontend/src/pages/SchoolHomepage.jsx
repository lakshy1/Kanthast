import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CaretDown } from "@phosphor-icons/react";
import Seo from "../components/Seo";
import { ORGANIZATION_ID, SITE_URL, breadcrumbSchema, faqSchema } from "../utils/seo";
import ScriptPage from "../components/landing/ScriptPage";
import NeoZippy from "../components/landing/NeoZippy";
import Reveal from "../components/home/Reveal";
import SnapRow from "../components/home/SnapRow";
import TaglineReveal from "../components/home/TaglineReveal";
import SCHOOL_CATALOG, { SAMPLE_SCRIPT } from "../data/schoolCatalog";
import { PILOT_TESTERS } from "../data/pilotTesters";
import "../styles/school-home.css";

const { classes: CLASSES, totals: TOTALS } = SCHOOL_CATALOG;

// First lessons open on this date. Everything else on the page stays honest about
// what is scripted (all of it) and what is animated (added as it is produced).
const FIRST_LESSONS = "1\u00a0December\u00a02026";
const CTA_LABEL = "Create a free account";

const BENEFITS = [
  {
    title: "One idea per lesson",
    body: `Each lesson covers one sub topic in ${SCHOOL_CATALOG.lessonLength}, so a long chapter becomes a short series your child can finish in a sitting.`,
  },
  {
    title: "Drawn as it is built",
    body: "Diagrams, maps, timelines and proofs animate step by step, the way the textbook expects students to draw them.",
  },
  {
    title: "Matched to the textbook",
    body: "Every lesson names its class, subject and chapter in the new NCERT books, so you can line it up with schoolwork.",
  },
];

const LESSON_SHAPE = [
  { title: "A hook", body: "Each lesson opens on a funny or surprising moment, like a bulb that seems to know you pressed the switch." },
  { title: "The idea, drawn step by step", body: "The concept is animated as it is built, one stage at a time." },
  { title: "An exam tip", body: "A common mistake, a frequently asked question or a marking scheme point, where one fits." },
  { title: "A three point recap", body: "Neo closes every lesson with the three things to remember, shown on screen." },
];

const GUIDES = [
  {
    name: "Neo",
    tone: "text-[var(--school-ink)]",
    body: "A round, cheerful owl in a lab coat, goggles pushed up on his forehead. Calm and a little witty, he does the explaining.",
  },
  {
    name: "Zippy",
    tone: "text-brand",
    body: "A small, bouncy electric blue spark. He asks the questions a student would ask, and sometimes gets things wrong so Neo can put them right.",
  },
];

const FOR_PARENTS = [
  { title: "Tied to the textbook", body: "Every lesson names its class, subject and chapter, so you can match it to what is being taught in school." },
  { title: "No ads, no social feed", body: "Kanthast has nothing to scroll and nobody to follow. Time on it is time on a lesson." },
  { title: "Made for phones", body: "Lessons are short enough for a bus ride and work on any modern phone or laptop." },
];
const COMING_NEXT = [
  { title: "Questions after every lesson", body: "A few questions at the end, so a gap shows up while the idea is fresh." },
  { title: "Progress you can see", body: "A view of what your child watched this week, chapter by chapter." },
];

const TIMELINE = [
  { when: "Today", what: "Create a free account and choose your child's class." },
  { when: FIRST_LESSONS, what: "The first animated lessons open." },
  { when: "After that", what: "More lessons are added as they are produced. We will tell you before anything is charged." },
];

const FAQS = [
  {
    q: "Which classes and boards does Kanthast School cover?",
    a: "Classes VIII, IX and X, following CBSE and the new NCERT textbooks introduced for the 2025 to 2026 session. Classes I to VII will follow. State boards are not covered yet.",
  },
  {
    q: "Which subjects are included?",
    a: "Mathematics, Science, Social Science, English and Hindi in all three classes, with Sanskrit in Class VIII and Information Technology in Classes IX and X.",
  },
  {
    q: "Can my child watch lessons now?",
    a: `Not yet. The first lessons open on ${FIRST_LESSONS}. All ${TOTALS.lessons} lessons for Classes VIII to X are scripted and checked against the textbooks, and the rest of the animated videos are added as they are produced.`,
  },
  {
    q: "Why create an account before the lessons open?",
    a: "So your account and your child's class are ready on the first day. Joining is free and nothing is charged today.",
  },
  {
    q: "How long is each lesson?",
    a: "Between 2 and 3.5 minutes. Each lesson covers one sub topic of a chapter, so a chapter is a short series rather than one long video.",
  },
  {
    q: "Are Hindi and Sanskrit lessons in English?",
    a: "No. Language lessons are taught in their own language. Only the directions for the animation team are written in English.",
  },
  {
    q: "Can students ask questions?",
    a: "Yes. Signed in students can post doubts to their class and use Ask AI. The class feed needs a parent's approval and is moderated.",
  },
  {
    q: "How much does it cost?",
    a: `${SCHOOL_CATALOG.price} for one class for one academic year. Payments are not open yet, and we will tell you before anything is charged.`,
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
          <summary className="flex min-h-touch cursor-pointer list-none items-center gap-4 rounded-lg py-4 [&::-webkit-details-marker]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--school-ink)]">
            <span className="title-2 flex-1 text-ink">{item.q}</span>
            <CaretDown aria-hidden="true" weight="bold" className="shrink-0 text-ink-subtle transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-180" />
          </summary>
          <p className="body-3 max-w-[65ch] pb-6 text-ink-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}

function CtaBlock({ align = "start" }) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <Link to="/signup" className="sh-btn">
        {CTA_LABEL}
        <ArrowRight aria-hidden="true" weight="bold" />
      </Link>
      <p className="caption-1 mt-3 text-ink-muted">Free to join. Nothing is charged today.</p>
    </div>
  );
}

export default function SchoolHomepage() {
  const [scriptOpen, setScriptOpen] = useState(false);
  const firstScene = SAMPLE_SCRIPT.scenes[0];

  return (
    <div className="school-home school-page overflow-x-clip text-ink">
      <Seo
        title="Kanthast School | Animated NCERT lessons for Classes VIII, IX and X"
        description={`Short animated lessons for the new NCERT books, Classes VIII to X: Maths, Science, Social Science, English, Hindi and more. ${TOTALS.lessons} lessons across ${TOTALS.chapters} chapters. First lessons open on ${FIRST_LESSONS}.`}
        path="/"
        jsonLd={[
          ...CLASSES.map((cls) => ({
            "@type": "Course",
            "@id": `${SITE_URL}/#${cls.id}`,
            name: `Kanthast School: ${cls.name}`,
            description: `${cls.lessons} short animated lessons across ${cls.chapters} chapters of the new NCERT books for ${cls.name}: ${cls.subjects.join(", ")}.`,
            url: `${SITE_URL}/#${cls.id}`,
            inLanguage: ["en", "hi"],
            educationalLevel: cls.name,
            teaches: cls.subjects,
            provider: { "@id": ORGANIZATION_ID },
          })),
          faqSchema(FAQS),
          breadcrumbSchema([{ name: "Kanthast School", path: "/" }]),
        ]}
      />

      {/* 1. Hero: one offer, one audience, one action */}
      <section className="site-container grid items-center gap-12 pb-12 pt-12 md:pb-20 md:pt-16 lg:grid-cols-2">
        <div>
          <p className="caption-3 inline-flex rounded-full bg-[var(--school-soft)] px-3 py-1 text-[var(--school-ink)]">
            Kanthast School · Classes VIII to X
          </p>
          <h1 className="heading-1 mt-4 max-w-[680px] text-ink">Every NCERT chapter, explained in a three&nbsp;minute cartoon</h1>
          <p className="title-1 mt-6 max-w-[680px] text-ink-muted">
            Neo the owl and Zippy the spark walk your child through each chapter of the new NCERT books, one short lesson at a time.
          </p>
          <div className="mt-8">
            <CtaBlock />
          </div>
          <p className="body-2 mt-8 max-w-[56ch] text-ink">
            {TOTALS.lessons} lessons scripted and checked against the textbooks. First lessons open on {FIRST_LESSONS}.
          </p>
        </div>

        <figure className="rounded-2xl border border-line bg-surface p-2">
          <div className="grid aspect-[4/3] place-items-center rounded-lg bg-brand-soft p-6">
            <NeoZippy className="h-full w-full max-w-[420px]" />
          </div>
          <figcaption className="p-4">
            <p className="caption-3 text-[var(--school-ink)]">From the script · {SAMPLE_SCRIPT.context}</p>
            <p className="body-3 mt-1 line-clamp-3 text-ink-muted">{firstScene.animation}</p>
          </figcaption>
        </figure>
      </section>

      {/* 2. Why it works: outcomes, three cards, swipeable on phones */}
      <section aria-labelledby="why-heading" className="site-container py-12 md:py-16">
        <Reveal>
          <h2 id="why-heading" className="heading-2 max-w-[680px]">A chapter is long. A lesson should be short.</h2>
        </Reveal>
        <Reveal className="mt-10" delay={80}>
          <SnapRow label="Benefits">
            {BENEFITS.map((item) => (
              <article key={item.title} className="h-full rounded-2xl border border-line bg-surface p-6">
                <h3 className="title-card text-ink">{item.title}</h3>
                <p className="body-3 mt-2 text-ink-muted">{item.body}</p>
              </article>
            ))}
          </SnapRow>
        </Reveal>
      </section>

      {/* 3. Tagline reveal */}
      <section aria-label="What Kanthast School is for" className="site-container py-12 md:py-16">
        <TaglineReveal lines={["Every chapter, drawn out step by step.", "So the idea sticks before the exam does."]} />
      </section>

      {/* 4. How a lesson runs, with a real script as proof */}
      <section aria-labelledby="shape-heading" className="site-container py-12 md:py-16">
        <Reveal>
          <h2 id="shape-heading" className="heading-2 max-w-[680px]">How every lesson runs</h2>
        </Reveal>
        <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal className="min-w-0">
            <SnapRow label="Lesson steps" columns="md:grid-cols-2" itemWidth="w-[80%]">
              {LESSON_SHAPE.map((step, index) => (
                <article key={step.title} className="h-full rounded-2xl border border-line bg-surface p-6">
                  <p className="caption-3 text-[var(--school-ink)]">Step {index + 1}</p>
                  <h3 className="title-card mt-1 text-ink">{step.title}</h3>
                  <p className="body-3 mt-2 text-ink-muted">{step.body}</p>
                </article>
              ))}
            </SnapRow>
          </Reveal>
          <Reveal delay={80} className="min-w-0">
            <p className="body-2 mb-3 text-ink-muted">Here is the start of a real script, from {SAMPLE_SCRIPT.context}.</p>
            <div className={`${scriptOpen ? "" : "max-md:max-h-96 max-md:overflow-hidden"}`}>
              <ScriptPage />
            </div>
            <button
              type="button"
              onClick={() => setScriptOpen((v) => !v)}
              aria-expanded={scriptOpen}
              className="button-md mt-3 inline-flex min-h-touch items-center gap-2 rounded-xl border border-line-strong px-4 py-2 text-ink transition-colors duration-300 hover:bg-surface md:hidden"
            >
              {scriptOpen ? "Show less" : "Read the full script"}
              <CaretDown aria-hidden="true" weight="bold" className={`transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${scriptOpen ? "rotate-180" : ""}`} />
            </button>
          </Reveal>
        </div>
      </section>

      {/* 5. The two guides */}
      <section aria-labelledby="guides-heading" className="site-container py-12 md:py-16">
        <Reveal>
          <h2 id="guides-heading" className="heading-2 max-w-[680px]">Two guides, in every lesson</h2>
        </Reveal>
        <Reveal className="mt-10" delay={80}>
          <SnapRow label="Guides" columns="md:grid-cols-2">
            {GUIDES.map((guide) => (
              <article key={guide.name} className="h-full rounded-2xl border border-line bg-surface p-6">
                <h3 className={`title-card ${guide.tone}`}>{guide.name}</h3>
                <p className="body-3 mt-2 max-w-[48ch] text-ink-muted">{guide.body}</p>
              </article>
            ))}
          </SnapRow>
        </Reveal>
      </section>

      {/* 6. Coverage */}
      <section id="classes" aria-labelledby="classes-heading" className="site-container scroll-mt-28 py-12 md:py-16">
        <Reveal>
          <h2 id="classes-heading" className="heading-2 max-w-[680px]">What is covered</h2>
          <p className="title-1 mt-4 max-w-[680px] text-ink-muted">
            {TOTALS.lessons} lessons across {TOTALS.chapters} chapters of the new NCERT books for the 2025 to 2026 session. Classes I to VII will follow.
          </p>
        </Reveal>
        <Reveal className="mt-10" delay={80}>
          <SnapRow label="Classes">
            {CLASSES.map((cls) => (
              <article key={cls.id} id={cls.id} className="h-full scroll-mt-28 rounded-2xl border border-line bg-surface p-6">
                <h3 className="heading-3 text-ink">{cls.name}</h3>
                <p className="body-1 mt-1 text-[var(--school-ink)]">
                  <span className="tabular-nums">{cls.lessons}</span> lessons, <span className="tabular-nums">{cls.chapters}</span> chapters
                </p>
                <p className="caption-1 mt-6 text-ink">Subjects</p>
                <p className="body-3 mt-1 text-ink-muted">{cls.subjects.join(", ")}</p>
                <p className="caption-1 mt-6 text-ink">Chapters include</p>
                <ul className="body-3 mt-1 grid gap-1 text-ink-muted">
                  {cls.sample.map((chapter) => (
                    <li key={chapter}>{chapter}</li>
                  ))}
                </ul>
              </article>
            ))}
          </SnapRow>
        </Reveal>
      </section>

      {/* 7. Pilot testers: appears only once real, consented names are added to data/pilotTesters.js */}
      {PILOT_TESTERS.length > 0 && (
        <section aria-labelledby="pilot-heading" className="site-container py-12 md:py-16">
          <Reveal>
            <h2 id="pilot-heading" className="heading-2 max-w-[680px]">Tried by our pilot testers</h2>
          </Reveal>
          <Reveal className="mt-10" delay={80}>
            <SnapRow label="Pilot testers">
              {PILOT_TESTERS.map((person) => (
                <figure key={person.name} className="h-full rounded-2xl border border-line bg-surface p-6">
                  <blockquote className="body-3 text-ink">{person.quote}</blockquote>
                  <figcaption className="mt-4">
                    <p className="body-1 text-ink">{person.name}</p>
                    <p className="caption-1 text-ink-muted">{person.role}</p>
                  </figcaption>
                </figure>
              ))}
            </SnapRow>
          </Reveal>
        </section>
      )}

      {/* 8. For parents */}
      <section id="parents" aria-labelledby="parents-heading" className="site-container scroll-mt-28 py-12 md:py-16">
        <Reveal>
          <h2 id="parents-heading" className="heading-2 max-w-[680px]">For parents</h2>
        </Reveal>
        <Reveal className="mt-10" delay={80}>
          <SnapRow label="Parent benefits">
            {FOR_PARENTS.map((item) => (
              <article key={item.title} className="h-full rounded-2xl border border-line bg-surface p-6">
                <h3 className="title-card text-ink">{item.title}</h3>
                <p className="body-3 mt-2 text-ink-muted">{item.body}</p>
              </article>
            ))}
          </SnapRow>
        </Reveal>
        <Reveal className="mt-8" delay={120}>
          <h3 className="caption-1 text-ink-muted">Coming next</h3>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {COMING_NEXT.map((item) => (
              <li key={item.title} className="rounded-2xl border border-dashed border-line-strong p-4">
                <p className="body-1 flex flex-wrap items-center gap-2 text-ink">
                  {item.title}
                  <span className="caption-3 rounded-full bg-[var(--school-soft)] px-2 py-0.5 text-[var(--school-ink)]">Coming soon</span>
                </p>
                <p className="body-3 mt-1 text-ink-muted">{item.body}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      </section>

      {/* 9. Launch plan and price */}
      <section id="pricing" aria-labelledby="pricing-heading" className="site-container scroll-mt-28 py-12 md:py-16">
        <Reveal className="rounded-2xl border border-line bg-surface p-6 md:p-10">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="caption-3 text-[var(--school-ink)]">Price</p>
              <h2 id="pricing-heading" className="heading-2 mt-1">{SCHOOL_CATALOG.price}</h2>
              <p className="body-3 mt-2 max-w-[48ch] text-ink-muted">
                For one class, for one academic year. Creating an account is free, and payments are not open yet.
              </p>
              <div className="mt-6">
                <CtaBlock />
              </div>
            </div>
            <ol className="grid gap-6">
              {TIMELINE.map((step) => (
                <li key={step.when} className="grid gap-1 border-b border-line pb-6 last:border-b-0 last:pb-0">
                  <p className="body-1 text-ink">{step.when}</p>
                  <p className="body-3 text-ink-muted">{step.what}</p>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>

      {/* 10. FAQ */}
      <section aria-labelledby="school-faq" className="site-container grid gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <Reveal>
          <h2 id="school-faq" className="heading-2">Questions parents ask</h2>
        </Reveal>
        <Reveal delay={80}>
          <FaqList />
        </Reveal>
      </section>

      {/* 11. Final CTA, identical to the top */}
      <section aria-labelledby="final-heading" className="site-container pb-20 pt-12 text-center md:pb-24 md:pt-16">
        <Reveal>
          <h2 id="final-heading" className="heading-2 mx-auto max-w-[680px]">Be ready for {FIRST_LESSONS}</h2>
          <p className="title-1 mx-auto mt-4 max-w-[680px] text-ink-muted">
            Set up your account and your child's class today, so the first lesson is one tap away.
          </p>
          <div className="mt-8">
            <CtaBlock align="center" />
          </div>
        </Reveal>
      </section>
    </div>
  );
}

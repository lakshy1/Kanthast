import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BookOpenText, CaretDown, DeviceMobile, Pause, PencilSimpleLine, Play, Prohibit, Quotes, Timer } from "@phosphor-icons/react";
import Seo from "../components/Seo";
import { ORGANIZATION_ID, SITE_URL, breadcrumbSchema, faqSchema } from "../utils/seo";
import Reveal from "../components/home/Reveal";
import SnapRow from "../components/home/SnapRow";
import FocusCarousel from "../components/home/FocusCarousel";
import FaqChild from "../components/home/FaqChild";
import ScrollTagline from "../components/home/ScrollTagline";
import LessonStage from "../components/home/LessonStage";
import usePrefersReducedMotion from "../components/home/usePrefersReducedMotion";
import { NeoSolo, ZippySolo } from "../components/home/Characters";
import SCHOOL_CATALOG from "../data/schoolCatalog";
import { PILOT_TESTERS } from "../data/pilotTesters";
import "../styles/school-home.css";
import { LESSONS_OPEN, PAYMENTS_OPEN } from "../config/launch";

const { classes: CLASSES, totals: TOTALS } = SCHOOL_CATALOG;

// First lessons open on this date. Everything else on the page stays honest about
// what is scripted (all of it) and what is animated (added as it is produced).
const FIRST_LESSONS = "1\u00a0December\u00a02026";
const CTA_LABEL = "Create a free account";
// Rs 5,000 a year, spread over twelve months, rounded.
const PER_MONTH = "about Rs 417 a month";
// What a plan covers, in words that stay true while lessons are still being released.
const PLAN_INCLUDES = [
  "Every lesson for one class, as each is released",
  "Kanthast Assistant for questions about a topic",
  "Resume where you stopped, and progress by chapter",
];

const BENEFITS = [
  {
    icon: Timer,
    title: "One idea per lesson",
    body: `Each lesson covers one sub topic in ${SCHOOL_CATALOG.lessonLength}, so a long chapter becomes a short series your child can finish in a sitting.`,
  },
  {
    icon: PencilSimpleLine,
    title: "Drawn as it is built",
    body: "Diagrams, maps, timelines and proofs animate step by step, the way the textbook expects students to draw them.",
  },
  {
    icon: BookOpenText,
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
    role: "The explainer",
    Art: NeoSolo,
    panel: "bg-white",
    tone: "text-[var(--school-ink)]",
    body: "A round, cheerful owl in a lab coat, goggles pushed up on his forehead. Calm and a little witty, he does the explaining.",
  },
  {
    name: "Zippy",
    role: "The question asker",
    Art: ZippySolo,
    panel: "bg-white",
    tone: "text-brand",
    body: "A small, bouncy electric blue spark. He asks the questions a student would ask, and sometimes gets things wrong so Neo can put them right.",
  },
];

const FOR_PARENTS = [
  { icon: BookOpenText, title: "Tied to the textbook", body: "Every lesson names its class, subject and chapter, so you can match it to what is being taught in school." },
  { icon: Prohibit, title: "No ads, no public feed", body: "Kanthast shows no ads and has no public profiles. Class questions stay inside your child's class, need a parent's approval and are moderated." },
  { icon: DeviceMobile, title: "Made for phones", body: "Lessons are short enough for a bus ride and work on any modern phone or laptop." },
];
const DATA_POINTS = [
  { title: "What we ask for", body: "Your child's name, email, phone number and class, to set up the account and show the right lessons." },
  { title: "Who sees questions", body: "Questions posted to the class feed go to your child's class only. A parent or guardian must first approve, using a code sent to their email, and posts are moderated." },
  { title: "No ads", body: "Kanthast shows no advertising to students." },
];
const COMING_NEXT = [
  { title: "Questions after every lesson", body: "A few questions at the end, so a gap shows up while the idea is fresh." },
  { title: "Progress you can see", body: "A view of what your child watched this week, chapter by chapter." },
];

const TIMELINE = [
  { when: "Today", what: "Create a free account and choose your child's class." },
  LESSONS_OPEN
    ? { when: "Now", what: "The first animated lessons are open." }
    : { when: FIRST_LESSONS, what: "The first animated lessons open." },
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
    a: LESSONS_OPEN
      ? `Yes, the lessons that are finished. All ${TOTALS.lessons} lessons for Classes VIII to X are scripted and checked against the textbooks, and the animated videos open as they are produced.`
      : `Not yet. The first lessons open on ${FIRST_LESSONS}. All ${TOTALS.lessons} lessons for Classes VIII to X are scripted and checked against the textbooks, and the rest of the animated videos are added as they are produced.`,
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
    a: `${SCHOOL_CATALOG.price} for one class for one academic year, once payments open. Until then every available lesson is free with an account, and we will tell you before anything is charged.`,
  },
];

function FaqList({ open, setOpen }) {
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

function CtaBlock({ align = "start", onDark = false }) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <Link to="/signup" className="sh-btn">
        {CTA_LABEL}
        <ArrowRight aria-hidden="true" weight="bold" />
      </Link>
      <p className={`caption-1 mt-4 ${onDark ? "text-white/70" : "text-ink-muted"}`}>{PAYMENTS_OPEN ? "Free to join." : "Free to join. Nothing is charged today."}</p>
    </div>
  );
}

/* The hero shows a real clip from a finished lesson: silent, looping, and only playing while it is on screen. */
function HeroClip() {
  const reduce = usePrefersReducedMotion();
  const videoRef = useRef(null);
  // Plays by default, paused by default for people who prefer reduced motion; their own choice always wins.
  const [choice, setChoice] = useState(null);
  const [visible, setVisible] = useState(true);
  const wantsPlay = choice ?? !reduce;
  const playing = wantsPlay && visible;
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    const el = videoRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.3 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (playing) el.play().catch(() => {});
    else el.pause();
  }, [playing]);

  return (
    <figure className="sh-clip sh-card p-2">
      {/* No visible controls: the clip is a short silent loop. Clicking or pressing Enter pauses or resumes it. */}
      <button
        type="button"
        onClick={() => setChoice(!wantsPlay)}
        aria-label={playing ? "Pause the clip" : "Play the clip"}
        aria-pressed={!playing}
        className="sh-clip-frame relative block aspect-video w-full overflow-hidden rounded-lg bg-black"
      >
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="metadata"
          poster={`${base}hero-lesson.webp`}
          src={`${base}hero-lesson.mp4`}
          aria-label="A short clip from the Class VIII Science lesson From Wonder to Investigation, with Neo the owl and Zippy the spark."
          className="h-full w-full object-cover"
        />
      </button>
    </figure>
  );
}

/* Desktop: the stage stays put while the four steps scroll past it. Phones: the stage sits above a swipe row. */
function LessonScrolly() {
  const [step, setStep] = useState(0);
  const blockRefs = useRef([]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setStep(Number(entry.target.dataset.step))),
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    blockRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:gap-16">
      <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
        <div className="sh-card p-2">
          <LessonStage step={step} />
          <p className="caption-3 px-2 pb-2 pt-3 text-[var(--school-ink)]">Step {step + 1} · {LESSON_SHAPE[step].title}</p>
        </div>

        <div className="mt-6 lg:hidden">
          <SnapRow label="Lesson steps" columns="md:grid-cols-2" itemWidth="w-[85%]" onActiveChange={setStep}>
            {LESSON_SHAPE.map((item, index) => (
              <article key={item.title} className="sh-card h-full p-6">
                <p className="caption-3 text-[var(--school-ink)]">Step {index + 1}</p>
                <h3 className="title-card mt-1 text-ink">{item.title}</h3>
                <p className="body-3 mt-2 text-ink-muted">{item.body}</p>
              </article>
            ))}
          </SnapRow>
        </div>
      </div>

      <ol className="hidden lg:grid lg:gap-8">
        {LESSON_SHAPE.map((item, index) => (
          <li
            key={item.title}
            ref={(el) => (blockRefs.current[index] = el)}
            data-step={index}
            className={`flex min-h-[44vh] flex-col justify-center transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${step === index ? "opacity-100" : "opacity-40"}`}
          >
            <p className="caption-3 text-[var(--school-ink)]">Step {index + 1}</p>
            <h3 className="heading-3 mt-1 text-ink">{item.title}</h3>
            <p className="title-2 mt-3 max-w-[44ch] text-ink-muted">{item.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ClassPicker() {
  const [selected, setSelected] = useState(CLASSES[CLASSES.length - 1].id);
  const cls = CLASSES.find((c) => c.id === selected);
  return (
    <div className="mt-10">
      <div role="tablist" aria-label="Choose a class" className="flex gap-2">
        {CLASSES.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            id={`tab-${c.id}`}
            aria-selected={selected === c.id}
            aria-controls="class-panel"
            onClick={() => setSelected(c.id)}
            className={`button-md min-h-touch flex-1 rounded-xl border-2 px-4 py-2 transition-colors duration-300 md:flex-none md:px-8 ${
              selected === c.id ? "border-[var(--school-ink)] bg-[var(--school)] text-[#2b1600]" : "border-line-strong bg-surface text-ink hover:bg-surface-sunken"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div id="class-panel" role="tabpanel" aria-labelledby={`tab-${cls.id}`} className="sh-card mt-6 grid gap-8 p-6 md:grid-cols-2 md:p-10">
        <div>
          <h3 className="heading-3 text-ink">{cls.name}</h3>
          <p className="body-1 mt-1 text-[var(--school-ink)]">
            <span className="tabular-nums">{cls.lessons}</span> lessons, <span className="tabular-nums">{cls.chapters}</span> chapters
          </p>
          <p className="caption-1 mt-6 text-ink">Subjects</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {cls.subjects.map((subject) => (
              <li key={subject} className="caption-1 rounded-full bg-[var(--school-soft)] px-3 py-1 text-[var(--school-ink)]">{subject}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="caption-1 text-ink">Chapters include</p>
          <ol className="mt-4 grid gap-0">
            {cls.sample.map((chapter, index) => (
              <li key={chapter} className="flex items-stretch gap-4">
                <span className="flex flex-col items-center" aria-hidden="true">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--school)] text-sm font-semibold text-[#2b1600]">{index + 1}</span>
                  {index < cls.sample.length - 1 && <span className="my-1 w-0.5 flex-1 bg-line-strong" />}
                </span>
                <span className="body-2 pb-6 pt-1 text-ink">{chapter}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export default function SchoolHomepage() {
  const [faqOpen, setFaqOpen] = useState(null);
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

      {/* 1. Hero: one offer, one action, and the product shown working */}
      <div className="band-sky band-hero">
        <section className="site-container grid items-center gap-10 pb-12 pt-12 md:pb-20 md:pt-16 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="caption-3 inline-flex rounded-full bg-[var(--school-soft)] px-3 py-1 text-[var(--school-ink)]">
              Kanthast School · Classes VIII to X
            </p>
            <h1 className="heading-1 mt-4 max-w-[680px] text-ink">NCERT chapters for Classes VIII to X, explained in short animated&nbsp;lessons</h1>
            <p className="title-1 mt-6 max-w-[680px] text-ink-muted">
              Neo the owl and Zippy the spark walk your child through each chapter of the new NCERT books, one lesson of {SCHOOL_CATALOG.lessonLength} at a time.
            </p>
            <div className="mt-8">
              <CtaBlock />
            </div>
            <p className="body-2 mt-8 max-w-[56ch] text-ink">
              {TOTALS.lessons} lessons scripted and checked against the textbooks.{" "}
              {LESSONS_OPEN ? "Lessons open as each animation is finished." : `First lessons open on ${FIRST_LESSONS}.`}
            </p>
          </div>
          <HeroClip />
        </section>
      </div>

      {/* 2. Why it works */}
      <section aria-labelledby="why-heading" className="site-container py-12 md:py-16">
        <Reveal>
          <h2 id="why-heading" className="heading-2 max-w-[680px]">A chapter is long. A lesson should be short.</h2>
        </Reveal>
        <Reveal className="mt-10" delay={80}>
          <SnapRow label="Benefits">
            {BENEFITS.map(({ icon: Icon, title, body }) => (
              <article key={title} className="sh-card h-full p-6">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--school-soft)] text-2xl text-[var(--school-ink)]">
                  <Icon aria-hidden="true" weight="duotone" />
                </span>
                <h3 className="title-card mt-4 text-ink">{title}</h3>
                <p className="body-3 mt-2 text-ink-muted">{body}</p>
              </article>
            ))}
          </SnapRow>
        </Reveal>
      </section>

      {/* 3. Tagline reveal */}
      <div className="band-night">
        <ScrollTagline
          label="What Kanthast School is for"
          lines={["Every chapter, drawn out step by step.", "So the idea *sticks* before the exam does."]}
          accent="#f2a007"
          glow="255 214 102"
          textClass="heading-2"
          badge="Classes VIII to X"
          video={`${import.meta.env.BASE_URL}tagline-bg.mp4`}
          poster={`${import.meta.env.BASE_URL}tagline-bg.webp`}
          chips={[
            { label: "2 to 3.5 minute lessons", x: "5%", y: "15%", depth: 0.7, at: 0.05 },
            { label: "Neo and Zippy", x: "38%", y: "9%", depth: 1.2, at: 0.15 },
            { label: "New NCERT books", r: "5%", y: "18%", depth: 0.9, at: 0.28 },
            { label: "923 lessons scripted", x: "3%", y: "58%", depth: 1.1, at: 0.4 },
            { label: "Maths, Science, English and more", r: "4%", y: "66%", depth: 0.6, at: 0.55 },
            { label: PAYMENTS_OPEN ? "Rs 5,000 a year" : "Free until payments open", x: "36%", y: "82%", depth: 0.8, at: 0.7 },
          ]}
        />
      </div>

      {/* 4. How a lesson runs: scroll-driven, with a real script as proof */}
      <section aria-labelledby="shape-heading" className="site-container py-12 md:py-16">
        <Reveal>
          <h2 id="shape-heading" className="heading-2 max-w-[680px]">How every lesson runs</h2>
          <p className="title-1 mt-4 max-w-[680px] text-ink-muted">Scroll through the four moments of a lesson. This circuit comes from a real Class X Science script.</p>
        </Reveal>
        <LessonScrolly />
      </section>

      {/* 5. The two guides */}
      <div className="band-sun">
        <section aria-labelledby="guides-heading" className="site-container py-12 md:py-16">
          <Reveal>
            <h2 id="guides-heading" className="heading-2 max-w-[680px]">Two guides, in every lesson</h2>
          </Reveal>
          <Reveal className="mt-10" delay={80}>
            <SnapRow label="Guides" columns="md:grid-cols-2">
              {GUIDES.map(({ name, role, Art, tone, body }) => (
                <article key={name} className="sh-card flex h-full flex-col gap-4 p-6 md:flex-row md:items-center">
                  <Art className="h-40 w-40 shrink-0 self-center" />
                  <div>
                    <p className="caption-3 text-ink-muted">{role}</p>
                    <h3 className={`heading-3 ${tone}`}>{name}</h3>
                    <p className="body-3 mt-2 text-ink-muted">{body}</p>
                  </div>
                </article>
              ))}
            </SnapRow>
          </Reveal>
        </section>
      </div>

      {/* 6. Coverage: pick a class */}
      <section id="classes" aria-labelledby="classes-heading" className="site-container scroll-mt-28 py-12 md:py-16">
        <Reveal>
          <h2 id="classes-heading" className="heading-2 max-w-[680px]">What is covered</h2>
          <p className="title-1 mt-4 max-w-[680px] text-ink-muted">
            {TOTALS.lessons} lessons across {TOTALS.chapters} chapters of the new NCERT books for the 2025 to 2026 session. Classes I to VII will follow.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <ClassPicker />
        </Reveal>
      </section>

      {/* 7. Pilot testers: appears only once real, consented names are added to data/pilotTesters.js */}
      {PILOT_TESTERS.length > 0 && (
        <div className="band-sky">
          <section aria-labelledby="pilot-heading" className="site-container py-12 md:py-16">
            <Reveal>
              <h2 id="pilot-heading" className="heading-2 max-w-[680px]">Tried by our pilot testers</h2>
              <p className="title-1 mt-4 max-w-[680px] text-ink-muted">Reviews from people who tried Kanthast during our pilot, shown with their permission.</p>
            </Reveal>
            <Reveal className="mt-8" delay={80}>
              <FocusCarousel label="Pilot tester reviews" autoplayMs={7000} slideWidth="min(80vw, 460px)">
                {PILOT_TESTERS.map((person) => (
                  <figure key={person.name} className="sh-card flex h-full flex-col gap-6 p-6 md:p-8">
                    <Quotes aria-hidden="true" weight="fill" className="text-4xl text-[var(--school)]" />
                    <blockquote className="title-1 text-ink">{person.quote}</blockquote>
                    <figcaption className="mt-auto flex items-center gap-3">
                      <span aria-hidden="true" className="grid h-11 w-11 place-items-center rounded-full bg-[var(--school-soft)] text-lg font-semibold text-[var(--school-ink)]" style={{ fontFamily: "var(--font-heading)" }}>
                        {person.name[0]}
                      </span>
                      <span>
                        <span className="body-1 block text-ink">{person.name}</span>
                        <span className="caption-1 block text-ink-muted">{person.role}</span>
                      </span>
                    </figcaption>
                  </figure>
                ))}
              </FocusCarousel>
            </Reveal>
          </section>
        </div>
      )}

      {/* 8. For parents: three benefits, then what is coming next, as one carousel */}
      <div className="band-mint">
        <section id="parents" aria-labelledby="parents-heading" className="site-container scroll-mt-28 py-12 md:py-16">
          <Reveal>
            <h2 id="parents-heading" className="heading-2 max-w-[680px]">For parents</h2>
          </Reveal>
          <Reveal className="mt-8" delay={80}>
            <FocusCarousel label="What parents get" slideWidth="min(78vw, 380px)">
              {FOR_PARENTS.map(({ icon: Icon, title, body }) => (
                <article key={title} className="sh-card h-full p-6 md:p-8">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[#e3f6ee] text-2xl text-[#0b6b4a]">
                    <Icon aria-hidden="true" weight="duotone" />
                  </span>
                  <h3 className="title-card mt-5 text-ink">{title}</h3>
                  <p className="body-3 mt-2 text-ink-muted">{body}</p>
                </article>
              ))}
              {COMING_NEXT.map((item) => (
                <article key={item.title} className="h-full rounded-2xl border-2 border-dashed border-[#0b6b4a]/45 bg-white/50 p-6 md:p-8">
                  <span className="caption-3 inline-flex rounded-full bg-white px-3 py-1 text-[#0b6b4a]">Coming soon</span>
                  <h3 className="title-card mt-5 text-ink">{item.title}</h3>
                  <p className="body-3 mt-2 text-ink-muted">{item.body}</p>
                </article>
              ))}
            </FocusCarousel>
          </Reveal>
        </section>
      </div>

      {/* Your child's data. Facts only, taken from how signup and class questions work today.
          LEGAL REVIEW NEEDED before launch: DPDP Act consent wording and the Privacy Policy link. */}
      <section id="privacy" aria-labelledby="privacy-heading" className="site-container scroll-mt-28 py-12 md:py-16">
        <Reveal>
          <h2 id="privacy-heading" className="heading-2 max-w-[680px]">Your child's data</h2>
          <p className="title-1 mt-4 max-w-[680px] text-ink-muted">Plainly, what Kanthast asks for and who can see what.</p>
        </Reveal>
        <Reveal className="mt-8" delay={80}>
          <ul className="grid gap-4 md:grid-cols-3">
            {DATA_POINTS.map((item) => (
              <li key={item.title} className="sh-card p-6">
                <h3 className="title-card text-ink">{item.title}</h3>
                <p className="body-3 mt-2 text-ink-muted">{item.body}</p>
              </li>
            ))}
          </ul>
          <p className="body-3 mt-6 text-ink-muted">
            Read the full <Link to="/privacy" className="font-semibold text-[var(--school-ink)] underline underline-offset-4">Privacy Policy</Link>, or ask us anything through <Link to="/contact" className="font-semibold text-[var(--school-ink)] underline underline-offset-4">Contact</Link>.
          </p>
        </Reveal>
      </section>

      {/* 9. Launch plan and price */}
      <section id="pricing" aria-labelledby="pricing-heading" className="site-container scroll-mt-28 py-12 md:py-16">
        <Reveal className="sh-card p-6 md:p-10">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="caption-3 text-[var(--school-ink)]">Price</p>
              <h2 id="pricing-heading" className="heading-2 mt-1">{SCHOOL_CATALOG.price}</h2>
              <p className="body-3 mt-2 max-w-[48ch] text-ink-muted">
                For one class, for one academic year, {PER_MONTH}. Creating an account is free.{PAYMENTS_OPEN ? "" : " Payments are not open yet."}
              </p>
              <ul className="mt-5 grid gap-2">
                {PLAN_INCLUDES.map((item) => (
                  <li key={item} className="body-3 flex gap-2 text-ink"><span aria-hidden="true" className="text-[var(--school-ink)]">&#10003;</span>{item}</li>
                ))}
              </ul>
              <p className="caption-1 mt-4 max-w-[48ch] text-ink-muted">
                {PAYMENTS_OPEN ? "" : "Refund terms will be published before payments open. "}See the <Link to="/refunds" className="underline underline-offset-4">Refund Policy</Link>.
              </p>
              <div className="mt-6">
                <CtaBlock />
              </div>
            </div>
            <ol className="grid gap-6">
              {TIMELINE.map((step, index) => (
                <li key={step.when} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--school)] text-sm font-semibold text-[#2b1600]" aria-hidden="true">{index + 1}</span>
                  <div>
                    <p className="body-1 text-ink">{step.when}</p>
                    <p className="body-3 text-ink-muted">{step.what}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </section>

      {/* 10. FAQ */}
      <section aria-labelledby="school-faq" className="site-container grid gap-10 py-12 md:py-16 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <h2 id="school-faq" className="heading-2">Questions parents ask</h2>
          </Reveal>
          <Reveal delay={80} className="mt-6">
            <FaqChild questions={FAQS} openIndex={faqOpen} />
          </Reveal>
        </div>
        <Reveal delay={80}>
          <FaqList open={faqOpen} setOpen={setFaqOpen} />
        </Reveal>
      </section>

      {/* 11. Final CTA, identical to the top */}
      <div className="band-night">
        <section aria-labelledby="final-heading" className="site-container py-16 text-center md:py-24">
          <Reveal>
            <h2 id="final-heading" className="heading-2 mx-auto max-w-[680px] text-white">{LESSONS_OPEN ? "Start your first lesson" : `Be ready for ${FIRST_LESSONS}`}</h2>
            <p className="title-1 mx-auto mt-4 max-w-[680px] text-white/75">
              {LESSONS_OPEN ? "Create your account and choose your child's class to start watching." : "Set up your account and your child's class today, so the first lesson is one tap away."}
            </p>
            <div className="mt-8">
              <CtaBlock align="center" onDark />
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}

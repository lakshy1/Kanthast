import React, { useEffect, useMemo, useRef, useState } from "react";
import Seo from "../components/Seo";
import { ORGANIZATION_ID, SITE_URL, faqSchema } from "../utils/seo";
import { FaArrowRight, FaChevronDown } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { LuLaptop, LuSmartphone } from "react-icons/lu";
import { useScroll, useTransform } from "framer-motion";
import TourScreen from "../components/landing/TourScreen";
import TypedAccent from "../components/landing/TypedAccent";
import FaqStudent from "../components/landing/FaqStudent";
import { HeroGlow, TiltFrame } from "../components/landing/CursorEffects";
import DeviceShowcase, { MacbookFrame } from "../components/landing/DeviceShowcase";
import SYLLABUS_SNAPSHOT from "../data/syllabusSnapshot";
import MEDICAL_PLANS from "../data/medicalPlans";
import ScrollTagline from "../components/landing/ScrollTagline";
import Reveal from "../components/landing/Reveal";
import "../styles/pro-home.css";
import LANDING_PROOF from "../data/landingProof";
import { HOME_FAQS } from "../data/faqs";
import { PILOT_TESTERS } from "../data/pilotTesters";
import SyllabusSection from "../components/landing/SyllabusSection";
import WaitlistSection from "../components/landing/WaitlistSection";
import PilotSection from "../components/landing/PilotSection";
import { LESSONS_OPEN, PAYMENTS_OPEN } from "../config/launch";
import { getMedicineUsmleContent } from "../utils/authApi";


const EXAMS = [
  { label: "NEET PG", path: "/neet-pg" },
  { label: "INI CET", path: "/ini-cet" },
  { label: "USMLE", path: "/usmle" },
  { label: "NEET UG", soon: true },
];

const TOUR_STEPS = [
  {
    id: "find",
    title: "Find it where your syllabus puts it",
    body: "Pick a subject, jump to a chapter. Every lecture is listed with its length, so there is no hunting through playlists.",
    url: "kanthast.in/library",
    range: [0, 0.31],
  },
  {
    id: "watch",
    title: "Watch short, pick up where you stopped",
    body: "Lectures are planned at about seven minutes. Leave halfway and your next visit resumes at the same second, at the speed you prefer.",
    url: "kanthast.in/video",
    caption: "Sample playback state shown.",
    range: [0.4, 0.66],
  },
  {
    id: "track",
    title: "See how far through each subject you are",
    body: "Your dashboard keeps the lecture to resume on top and counts what you have watched in each subject.",
    url: "kanthast.in/dashboard",
    caption: "Sample progress shown. Totals are the planned lectures in each subject.",
    range: [0.72, 1],
  },
];

const FAQS = HOME_FAQS;

const cleanName = (name = "") => name.replace(/\s*\(New\)\s*$/, "");

// Live counts from the public catalog, falling back to the bundled snapshot so
// the page never waits on a sleeping backend.
function useSyllabusSummary() {
  const [subjects, setSubjects] = useState(SYLLABUS_SNAPSHOT.subjects);

  useEffect(() => {
    let active = true;
    getMedicineUsmleContent()
      .then((data) => {
        const live = data?.content?.subjects;
        if (!active || !Array.isArray(live) || live.length === 0) return;
        setSubjects(
          live.map((subject) => ({
            name: subject.name,
            chapters: subject.chapters?.length || 0,
            lectures: (subject.chapters || []).reduce((sum, c) => sum + (c.videos?.length || 0), 0),
            sampleChapters: (subject.chapters || []).slice(0, 4).map((c) => cleanName(c.name)),
          }))
        );
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(
    () => ({
      subjects: subjects.length,
      chapters: subjects.reduce((sum, s) => sum + s.chapters, 0),
    }),
    [subjects]
  );

  return { subjects, totals };
}

function useIsLoggedIn() {
  const [loggedIn] = useState(() => {
    try {
      return Boolean(localStorage.getItem("kanthastToken") && localStorage.getItem("kanthastUser"));
    } catch {
      return false;
    }
  });
  return loggedIn;
}

// Phone widths: each step gets its own MacBook, scrubbing that step's slice of
// the storyboard as the step scrolls through the viewport.
function StepFrame({ step }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "end 0.35"] });
  const progress = useTransform(scrollYProgress, [0, 1], step.range);
  return (
    <div ref={ref} className="mt-8 lg:hidden">
      <MacbookFrame alt={step.url} className="drop-shadow-[0_30px_50px_rgba(6,11,28,0.5)]">
        <TourScreen progress={progress} />
      </MacbookFrame>
      {step.caption ? <p className="mt-4 text-sm text-ink-muted">{step.caption}</p> : null}
    </div>
  );
}

function ProductTour() {
  const [active, setActive] = useState(0);
  const stepRefs = useRef([]);
  const stepsRef = useRef(null);
  // Desktop: one sticky MacBook whose screen is scrubbed by scroll through the
  // three steps — down plays forward, up rewinds.
  const { scrollYProgress } = useScroll({ target: stepsRef, offset: ["start center", "end end"] });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(Number(entry.target.dataset.index));
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    stepRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section aria-labelledby="tour-heading" className="relative bg-surface pb-24 pt-16 text-ink md:pb-32 md:pt-24">
      <div className="site-container">
        {/* Phones: the heading stays pinned on its own */}
        <div className="tour-heading-bar sticky z-20 -mx-5 px-5 py-3 text-center md:-mx-8 md:px-8 lg:hidden" style={{ top: "calc(var(--navbar-h, 4rem) - 1px)" }}>
          <h2 id="tour-heading" className="mx-auto text-xl font-bold tracking-tight md:whitespace-nowrap">
            One place for the whole loop: find, watch, keep going.
          </h2>
        </div>

        <div className="mt-10 lg:mt-0 lg:grid lg:grid-cols-12 lg:gap-x-16">
          <ol ref={stepsRef} className="relative z-10 min-w-0 lg:col-span-5 lg:col-start-1 lg:row-start-1 lg:pt-28">
            {TOUR_STEPS.map((item, index) => (
              <li
                key={item.id}
                ref={(el) => {
                  stepRefs.current[index] = el;
                }}
                data-index={index}
                className="flex flex-col justify-center py-10 lg:min-h-[80vh] lg:py-0"
              >
                <div
                  className={`border-t pt-6 transition-colors duration-slow ease-brand ${
                    index === active ? "border-brand" : "border-line-strong"
                  }`}
                >
                  <p className={`mb-3 text-xs font-semibold uppercase tracking-wide tabular-nums transition-colors duration-slow ease-brand ${index === active ? "text-brand" : "text-ink-subtle"}`}>
                    Step {index + 1} of {TOUR_STEPS.length}
                  </p>
                  <h3
                    className={`[text-wrap:balance] text-2xl font-bold tracking-tight transition-colors duration-slow ease-brand md:text-3xl ${
                      index === active ? "text-ink" : "text-ink lg:text-ink/45"
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-ink-muted">{item.body}</p>
                  {index === TOUR_STEPS.length - 1 && (
                    <Link to={LESSONS_OPEN ? "/signup" : "#waitlist"} className="btn-primary mt-8 inline-flex px-6">
                      {LESSONS_OPEN ? "Create a free account" : "Join the waitlist"}
                      <FaArrowRight aria-hidden="true" />
                    </Link>
                  )}
                </div>
                <StepFrame step={item} />
              </li>
            ))}
          </ol>

          {/* Desktop: heading and laptop are ONE pinned layer, so they hold their places together and leave together */}
          <div
            aria-hidden="true"
            className="pointer-events-none sticky hidden self-start lg:col-span-12 lg:col-start-1 lg:row-start-1 lg:block"
            style={{ top: "calc(var(--navbar-h, 4rem) - 1px)" }}
          >
            <p className="py-3 text-center text-[clamp(1.5rem,3.4vw,2.25rem)] font-bold tracking-tight whitespace-nowrap">
              One place for the whole loop: find, watch, keep going.
            </p>
            <div className="ml-[calc(41.6667%+2rem)] mt-10 pointer-events-auto">
              <div aria-hidden="true" className="home-glow" />
              <TiltFrame>
                <MacbookFrame
                  alt=""
                  className="drop-shadow-[0_45px_80px_rgba(6,11,28,0.55)]"
                >
                  <TourScreen progress={scrollYProgress} />
                </MacbookFrame>
              </TiltFrame>
              <p className="mt-6 text-center text-sm text-ink-muted">{TOUR_STEPS[active].caption || " "}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProofSections() {
  const { stats, faculty, testimonials } = LANDING_PROOF;
  if (!stats.length && !faculty.length && !testimonials.length) return null;

  return (
    <section aria-label="Kanthast in numbers and people" className="bg-surface py-20 text-ink md:py-28">
      <div className="site-container space-y-20">
        {stats.length > 0 && (
          <dl className="grid gap-8 sm:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dd className="text-4xl font-black tabular-nums tracking-tight">{stat.value}</dd>
                <dt className="mt-1 text-ink-muted">{stat.label}</dt>
              </div>
            ))}
          </dl>
        )}

        {faculty.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">The people teaching you</h2>
            <ul className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {faculty.map((person) => (
                <li key={person.name}>
                  <img
                    src={person.photo}
                    alt={person.name}
                    loading="lazy"
                    className="aspect-[4/5] w-full rounded-card object-cover"
                  />
                  <p className="mt-4 font-bold">{person.name}</p>
                  <p className="text-sm text-ink-muted">{person.credentials}</p>
                  <p className="text-sm text-brand">{person.subject}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {testimonials.length > 0 && (
          <ul className="grid gap-10 md:grid-cols-2">
            {testimonials.map((item) => (
              <li key={item.name}>
                <blockquote className="text-xl leading-relaxed">“{item.quote}”</blockquote>
                <p className="mt-4 font-semibold">{item.name}</p>
                <p className="text-sm text-ink-muted">{item.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function FaqSection() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section aria-labelledby="faq-heading" className="border-t border-line bg-surface-sunken py-20 md:py-28">
      <div className="site-container grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-x-20">
        <div className="lg:col-start-1">
          <h2 id="faq-heading" className="text-4xl text-ink md:text-6xl">
            FAQ
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-muted">
            The questions students ask first, before they open a single lecture. More on the <Link to="/help" className="font-semibold text-brand underline-offset-4 hover:underline">Help page</Link>.
          </p>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="lg:sticky lg:top-28">
            <FaqStudent questions={FAQS} openIndex={openIndex} />
          </div>
        </div>

        <div className="divide-y divide-line border-y border-line lg:col-start-1">
          {FAQS.map((item, index) => {
            const open = openIndex === index;
            return (
              <details
                key={item.q}
                open={open}
                onToggle={(event) => {
                  if (event.currentTarget.open) setOpenIndex(index);
                  else if (open) setOpenIndex(null);
                }}
                className="group"
              >
                <summary className="flex min-h-touch cursor-pointer list-none items-center gap-5 py-5 [&::-webkit-details-marker]:hidden">
                  <span className="w-7 shrink-0 font-sans text-sm font-bold tabular-nums text-brand">
                    0{index + 1}
                  </span>
                  <span
                    className={`flex-1 text-lg font-semibold transition-colors duration-200 ${
                      open ? "text-brand" : "text-ink group-hover:text-brand"
                    }`}
                  >
                    {item.q}
                  </span>
                  <span
                    className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors duration-200 ${
                      open ? "border-brand bg-brand-soft text-brand" : "border-line text-ink-subtle"
                    }`}
                  >
                    <FaChevronDown
                      aria-hidden="true"
                      className="text-xs transition-transform duration-base ease-brand group-open:rotate-180"
                    />
                  </span>
                </summary>
                <p className="pb-6 pl-12 pr-14 leading-relaxed text-ink-muted">{item.a}</p>
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const Homepage = () => {
  const loggedIn = useIsLoggedIn();
  const { subjects, totals } = useSyllabusSummary();
  const startHref = loggedIn ? "/dashboard" : "/signup";
  const startLabel = loggedIn ? "Go to your dashboard" : "Get started free";

  return (
    <div className="home-page pro-home page-aurora overflow-x-clip text-ink">
        <Seo
          title="Kanthast Professional | Animated lectures for NEET-PG, INI-CET and USMLE"
          description="Short animated medical lectures for NEET-PG, INI-CET and USMLE, laid out subject by subject with resume and progress tracking. NEET-UG is coming soon."
          path="/"
          jsonLd={[
            {
              "@type": "Course",
              "@id": `${SITE_URL}/#course`,
              name: "Kanthast Professional",
              description:
                "Animated medical lectures for NEET-PG, INI-CET and USMLE preparation, organised by subject and chapter.",
              url: `${SITE_URL}/`,
              inLanguage: "en",
              educationalLevel: "Postgraduate medical entrance",
              teaches: subjects.map((subject) => subject.name),
              provider: { "@id": ORGANIZATION_ID },
              hasCourseInstance: { "@type": "CourseInstance", courseMode: "Online" },
            },
            faqSchema(FAQS),
          ]}
        />

        {/* Hero */}
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-copy">
              <p className="kx-eyebrow">Kanthast Professional</p>
              <h1 className="hero-title">
                <span className="block">Medicine, explained</span>
                <span className="hero-accent block"><TypedAccent text="in motion." /></span>
              </h1>
              <p className="hero-sub">Medical lectures for NEET&nbsp;PG, INI&nbsp;CET and&nbsp;USMLE, organised by subject.</p>
              <p className="hero-desc">
                Short animated lectures laid out subject by subject and chapter by chapter, with
                your place saved in every lecture.
              </p>
              <div className="hero-actions">
                <Link to={startHref} className="hero-btn hero-btn-primary">
                  {startLabel}
                  <FaArrowRight aria-hidden="true" className="hero-btn-icon" />
                </Link>
              </div>
              <p className="mt-3 text-sm text-ink-muted">
                {LESSONS_OPEN ? "Free to start. Create an account and open your first lecture." : "Free to start. Lectures are coming soon, so create a free account to be ready."}
              </p>
              <ul className="hero-exams" aria-label="Exams covered">
                {EXAMS.map((exam) => (
                  <li key={exam.label}>
                    {exam.path ? (
                      <Link to={exam.path} className="hero-exam">{exam.label}</Link>
                    ) : (
                      <span className={`hero-exam${exam.soon ? " hero-exam-soon" : ""}`}>
                        {exam.label}
                        {exam.soon && <span className="hero-exam-badge">Coming soon</span>}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="hero-devices">
              <HeroGlow className="hero-glow" />
              <DeviceShowcase
                desktopSrc={`${import.meta.env.BASE_URL}device-macbook-screen.webp`}
                mobileSrc={`${import.meta.env.BASE_URL}device-iphone-screen.webp`}
                desktopAlt="The Kanthast lecture player on a laptop, with the chapter's lectures listed beside the video."
                mobileAlt="The Kanthast home screen on a phone, with the lecture to resume and progress by subject."
              />
              <p className="hero-caption">
                <span aria-hidden="true" className="hero-caption-icons">
                  <LuLaptop />
                  <LuSmartphone />
                </span>
                Learn on any device. Pick up where you left off.
              </p>
            </div>
          </div>
        </section>

        <div className="pro-band-night">
          <ScrollTagline
            label="What Kanthast Professional is for"
            lines={["Hard ideas, animated until they *click*.", "Short lectures, your place saved, every subject mapped."]}
            accent="#77E0C0"
            glow="119 224 192"
            textClass="text-3xl font-semibold md:text-4xl lg:text-5xl"
            badge="Medicine library"
            video={`${import.meta.env.BASE_URL}tagline-bg.mp4`}
            poster={`${import.meta.env.BASE_URL}tagline-bg.webp`}
            chips={[
              { label: "NEET PG", x: "6%", y: "15%", depth: 0.7, at: 0.05 },
              { label: LESSONS_OPEN ? "Lectures open" : "Lectures coming soon", x: "37%", y: "9%", depth: 1.2, at: 0.15 },
              { label: "INI CET", r: "6%", y: "18%", depth: 0.9, at: 0.28 },
              { label: "Resume where you stopped", x: "3%", y: "58%", depth: 1.1, at: 0.4 },
              { label: "USMLE", r: "5%", y: "66%", depth: 0.6, at: 0.55 },
              { label: "5 subjects mapped", x: "38%", y: "82%", depth: 0.8, at: 0.7 },
            ]}
          />
        </div>

        <ProductTour />

        <SyllabusSection subjects={subjects} totals={totals} />

        {!LESSONS_OPEN && (
          <WaitlistSection
            plansLine={MEDICAL_PLANS.map((plan) => `${plan.durationLabel.replace(" Plan", "")} ${plan.priceLabel}`).join(", ")}
            startHref={startHref}
            startLabel={startLabel}
          />
        )}

        {PAYMENTS_OPEN && (
        <section id="pricing" aria-labelledby="home-pricing-heading" className="border-t border-line bg-surface py-20 md:py-28">
          <div className="site-container">
            <Reveal>
              <h2 id="home-pricing-heading" className="max-w-2xl text-3xl md:text-5xl">One library. Two plans, in rupees.</h2>
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-muted">
                The same Medicine library serves NEET PG, INI CET and USMLE. Start with a free account.
              </p>
            </Reveal>
            <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:max-w-4xl">
              {MEDICAL_PLANS.map((plan, planIndex) => (
                <Reveal as="li" delay={planIndex * 120} key={plan.id} className={`pro-plan flex flex-col p-8 ${plan.highlight ? "pro-plan-best" : ""}`}>
                  <p className="flex items-center gap-3 text-xl font-bold text-ink">
                    {plan.durationLabel}
                    {plan.highlight && <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">Best value</span>}
                  </p>
                  <p className="mt-6 text-5xl font-bold tabular-nums text-ink">{plan.priceLabel}</p>
                  <p className="mt-4 flex-1 leading-relaxed text-ink-muted">{plan.desc}</p>
                </Reveal>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link to={startHref} className="btn-primary px-7 text-base">
                {startLabel}
                <FaArrowRight aria-hidden="true" />
              </Link>
              <Link to="/pricing" className="font-semibold text-brand underline-offset-4 hover:underline">
                What every plan includes
              </Link>
            </div>
            <p className="mt-3 text-sm text-ink-muted">Free to start. Lectures are coming soon, so create a free account to be ready.</p>
          </div>
        </section>
        )}

        <ProofSections />

        <PilotSection people={PILOT_TESTERS} />

        <FaqSection />

        {/* Close */}
        <section className="aurora-close relative overflow-hidden border-t border-line bg-surface text-ink">
          <div aria-hidden="true" className="home-glow home-glow-close" />
          <div className="site-container relative flex flex-col items-start justify-between gap-8 py-20 md:flex-row md:items-center">
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-5xl">
              Start with a free account.
            </h2>
            <Link to={startHref} className="btn-primary shrink-0 px-7 text-base">
              {startLabel}
              <FaArrowRight aria-hidden="true" />
            </Link>
          </div>
        </section>
    </div>
  );
};

export default Homepage;

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
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
import LANDING_PROOF from "../data/landingProof";
import { getMedicineUsmleContent } from "../utils/authApi";


const EXAMS = [
  { label: "NEET-PG", to: "/courses#neet-pg" },
  { label: "INI-CET", to: "/courses#ini-cet" },
  { label: "USMLE", to: "/courses#medicine" },
];

const TOUR_STEPS = [
  {
    id: "find",
    title: "Find it where your syllabus puts it",
    body: "Pick a subject, jump to a chapter, and every lecture is listed with its length. No hunting through playlists.",
    url: "kanthast.in/lists",
    range: [0, 0.31],
  },
  {
    id: "watch",
    title: "Watch short, pick up where you stopped",
    body: "Lectures are planned at around seven minutes each. Leave halfway and the next visit resumes at the same second, at the speed you prefer.",
    url: "kanthast.in/video",
    caption: "Sample playback state shown.",
    range: [0.4, 0.66],
  },
  {
    id: "track",
    title: "See how far through each subject you are",
    body: "Your dashboard keeps the lecture to resume on top and counts what you have watched, subject by subject.",
    url: "kanthast.in/dashboard",
    caption: "Sample progress shown. Totals count planned lectures.",
    range: [0.72, 1],
  },
];

const FAQS = [
  {
    q: "Are the lectures available to watch?",
    a: "Yes, and more are added all the time. New animated lectures go live regularly, subject by subject. Every planned lecture is already listed, so you can see what is coming, and each one opens the moment its video is published.",
  },
  {
    q: "Which exams is Kanthast for?",
    a: "NEET-PG, INI-CET and USMLE. All three draw on the same subject-by-subject medical library.",
  },
  {
    q: "What can I open without paying?",
    a: "With a free account, the first two lectures in every section are open once they are published. A plan unlocks the rest of the lectures and images as they are released.",
  },
  {
    q: "Will it remember where I stopped?",
    a: "Yes. Leave a lecture halfway and your next visit resumes at the same second, at the playback speed you prefer.",
  },
  {
    q: "Is there more than the video?",
    a: "Yes. Lectures come with written notes and an images page, so you can revise a topic without rewatching it.",
  },
  {
    q: "How do I track my progress?",
    a: "Your dashboard keeps the lecture to resume on top and counts what you have watched, subject by subject.",
  },
  {
    q: "Can I ask questions while I study?",
    a: "Yes. Signed-in students can ask the Kanthast Assistant about a topic or about using the platform.",
  },
  {
    q: "Does it work on my phone?",
    a: "Yes. The whole site is built for phones, including the library, the player and resume.",
  },
  {
    q: "Can I get a refund?",
    a: "Refunds follow our Refund Policy, linked in the footer of every page. For anything it does not cover, contact us and we will help.",
  },
];

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
      {step.caption ? <p className="mt-4 text-sm text-white/65">{step.caption}</p> : null}
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
        <h2 id="tour-heading" className="max-w-2xl text-3xl font-bold tracking-tight md:text-5xl">
          One place for the whole loop: find, watch, keep going.
        </h2>

        <div className="mt-14 lg:grid lg:grid-cols-12 lg:gap-16">
          <ol ref={stepsRef} className="min-w-0 lg:col-span-5">
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
                    index === active ? "border-brand" : "border-white/15 max-lg:border-white/25"
                  }`}
                >
                  <h3
                    className={`[text-wrap:balance] text-2xl font-bold tracking-tight transition-colors duration-slow ease-brand md:text-3xl ${
                      index === active ? "text-white" : "text-white lg:text-white/45"
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-white/70">{item.body}</p>
                </div>
                <StepFrame step={item} />
              </li>
            ))}
          </ol>

          <div className="hidden lg:col-span-7 lg:block">
            <div className="sticky top-[max(7rem,calc(50vh-17rem))]">
              <div aria-hidden="true" className="home-glow" />
              <TiltFrame>
                <MacbookFrame
                  alt="The Kanthast library, lecture player and progress dashboard, shown in turn as you scroll."
                  className="drop-shadow-[0_45px_80px_rgba(6,11,28,0.55)]"
                >
                  <TourScreen progress={scrollYProgress} />
                </MacbookFrame>
              </TiltFrame>
              <p className="mt-6 text-center text-sm text-white/65" aria-live="polite">
                {TOUR_STEPS[active].caption || " "}
              </p>
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
            The questions students ask first, before they open a single lecture.
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
    <div className="home-page overflow-x-clip bg-surface text-ink">
        <Helmet>
          <title>Kanthast | Animated medical lectures for NEET-PG, INI-CET and USMLE</title>
          <meta
            name="description"
            content="Short animated medical lectures organised by subject and chapter, with resume and progress tracking, for NEET-PG, INI-CET and USMLE preparation."
          />
          <link rel="canonical" href="https://kanthast.in/" />
          <meta property="og:title" content="Kanthast | Animated medical lectures for NEET-PG, INI-CET and USMLE" />
          <meta
            property="og:description"
            content="Short animated medical lectures organised by subject and chapter, with resume and progress tracking."
          />
          <meta property="og:url" content="https://kanthast.in/" />
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              name: "Kanthast",
              url: "https://kanthast.in",
              description:
                "Animated medical lectures for NEET-PG, INI-CET and USMLE preparation, organised by subject and chapter.",
            })}
          </script>
        </Helmet>

        {/* Hero */}
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-copy">
              <h1 className="hero-title">
                <span className="block">Medicine, explained</span>
                <span className="hero-accent block"><TypedAccent text="in motion." /></span>
              </h1>
              <p className="hero-sub">For NEET-PG, INI-CET and USMLE.</p>
              <p className="hero-desc">
                Short animated lectures laid out subject by subject and chapter by chapter, with
                your place saved in every lecture.
              </p>
              <div className="hero-actions">
                <Link to={startHref} className="hero-btn hero-btn-primary">
                  {startLabel}
                  <FaArrowRight aria-hidden="true" className="hero-btn-icon" />
                </Link>
                <Link to="/pricing" className="hero-btn hero-btn-secondary">
                  See pricing
                </Link>
              </div>
              <ul className="hero-exams" aria-label="Exams covered">
                {EXAMS.map((exam) => (
                  <li key={exam.label}>
                    <Link to={exam.to} className="hero-exam">
                      {exam.label}
                      <FaArrowRight aria-hidden="true" className="hero-exam-icon" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hero-devices">
              <HeroGlow className="hero-glow" />
              <DeviceShowcase
                desktopSrc="/device-macbook-screen.png"
                mobileSrc="/device-iphone-screen.png"
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

        <ProductTour />

        {/* Syllabus coverage */}
        <section aria-labelledby="syllabus-heading" className="border-t border-line bg-surface-sunken py-20 md:py-28">
          <div className="site-container">
            <div className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <h2 id="syllabus-heading" className="text-3xl font-bold tracking-tight text-ink md:text-5xl">
                  The syllabus is mapped. The lectures are on their way.
                </h2>
                <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-muted">
                  {totals.subjects} subjects and {totals.chapters} chapters are laid out today. Lectures
                  are being produced and released subject by subject.
                </p>
                <Link to="/lists" className="btn-secondary mt-8">
                  Browse the library
                  <FaArrowRight aria-hidden="true" />
                </Link>
              </div>

              <ul className="divide-y divide-line border-y border-line lg:col-span-7">
                {subjects.map((subject) => (
                  <li key={subject.name} className="grid gap-1 py-5 sm:grid-cols-[12rem_1fr] sm:gap-6">
                    <p className="font-bold text-ink">
                      {subject.name}
                      <span className="ml-2 text-sm font-medium tabular-nums text-ink-subtle">
                        {subject.chapters} chapters
                      </span>
                    </p>
                    <p className="text-ink-muted">{subject.sampleChapters.join(" · ")} …</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <ProofSections />

        <FaqSection />

        {/* Close */}
        <section className="relative overflow-hidden border-t border-line bg-surface text-ink">
          <div aria-hidden="true" className="home-glow home-glow-close" />
          <div className="site-container relative flex flex-col items-start justify-between gap-8 py-20 md:flex-row md:items-center">
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight md:text-5xl">
              Open the library and start with the first lecture.
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

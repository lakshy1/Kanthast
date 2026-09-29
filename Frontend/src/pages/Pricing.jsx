import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { motion as Motion, useReducedMotion } from "framer-motion";
import { FaArrowRight, FaCheck, FaLock, FaPlay } from "react-icons/fa6";
import { Link } from "react-router-dom";
import MEDICAL_PLANS from "../data/medicalPlans";
import SYLLABUS_SNAPSHOT from "../data/syllabusSnapshot";

// What a plan adds, from the plan copy in data/medicalPlans.js.
const PLAN_INCLUDES = [
  "Every locked lecture in the Medicine library",
  "Every lecture's images page",
  "New lectures as soon as they are released",
  "Resume and progress on your dashboard",
];

// Real lectures from one chapter; the first two in every section are free.
const { tourPreview } = SYLLABUS_SNAPSHOT;
const PREVIEW_LECTURES = tourPreview.lectures.slice(0, 4);
const FREE_PER_SECTION = 2;

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

// A section of the library as a free account sees it: rows arrive in turn,
// the first two unlock with a mint play button, the rest stay locked.
function FreePreview() {
  const reduce = useReducedMotion();
  const row = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, x: 18 },
    show: (i) => ({ opacity: 1, x: 0, transition: { delay: 0.15 + i * 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] } }),
  };
  const unlock = {
    hidden: reduce ? { scale: 1 } : { scale: 0.3, opacity: 0 },
    show: (i) => ({ scale: 1, opacity: 1, transition: { delay: 0.9 + i * 0.25, type: "spring", stiffness: 360, damping: 16 } }),
  };

  return (
    <div aria-hidden="true" className="overflow-hidden rounded-card border border-line bg-surface shadow-e3">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <span className="text-sm font-bold text-ink">{tourPreview.chapter}</span>
        <span className="text-xs text-ink-subtle">{tourPreview.subject}</span>
      </div>
      <Motion.ul initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.5 }} className="divide-y divide-line">
        {PREVIEW_LECTURES.map((lecture, i) => {
          const free = i < FREE_PER_SECTION;
          return (
            <Motion.li key={lecture.name} custom={i} variants={row} className="flex items-center gap-4 px-5 py-3">
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-sm font-semibold ${free ? "text-ink" : "text-ink-subtle"}`}>{lecture.name}</span>
                <span className="text-xs tabular-nums text-ink-subtle">{lecture.duration}</span>
              </span>
              {free ? (
                <Motion.span custom={i} variants={unlock} className="relative grid h-9 w-9 place-items-center rounded-full bg-brand text-brand-fg">
                  {!reduce && <span className="free-ping absolute inset-0 rounded-full bg-brand" style={{ animationDelay: `${1.4 + i * 0.3}s` }} />}
                  <FaPlay className="relative ml-0.5 text-[11px]" />
                </Motion.span>
              ) : (
                <span className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-subtle">
                  <FaLock className="text-[11px]" />
                </span>
              )}
            </Motion.li>
          );
        })}
      </Motion.ul>
      <div className="flex items-center gap-2 border-t border-line bg-brand-soft px-5 py-3 text-xs font-semibold text-brand">
        <span className="h-1.5 w-1.5 rounded-full bg-brand" />
        Free in every section: the first {FREE_PER_SECTION} lectures
      </div>
    </div>
  );
}

export default function Pricing() {
  const loggedIn = useIsLoggedIn();
  const planHref = loggedIn ? "/subscription" : "/signup";

  return (
    <div className="home-page overflow-x-clip bg-surface text-ink">
      <Helmet>
        <title>Pricing | Kanthast</title>
        <meta
          name="description"
          content="Kanthast plans for the Medicine library: start free, then unlock every lecture and image as it is released. Prices in USD."
        />
        <link rel="canonical" href="https://kanthast.in/pricing" />
      </Helmet>

      <section className="relative overflow-hidden pb-20 pt-12 md:pb-28 md:pt-16">
        <div aria-hidden="true" className="home-glow pricing-glow" />
        <div className="site-container relative">
          <h1 className="font-sans text-4xl font-extrabold tracking-[-0.035em] md:text-6xl">Pricing</h1>

          <div className="mt-12 grid gap-10 xl:grid-cols-[minmax(0,1.55fr)_auto_minmax(0,1fr)] xl:gap-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">With a plan</p>
              <h2 className="mt-3 text-3xl md:text-4xl">Unlock the full library</h2>
            <ul className="mt-7 grid gap-6 md:grid-cols-2">
              {MEDICAL_PLANS.map((plan) => (
                <li
                  key={plan.id}
                  className={`relative flex flex-col overflow-hidden rounded-card border bg-surface-raised p-8 ${
                    plan.highlight ? "border-2 border-brand shadow-e3" : "border-line shadow-e2"
                  }`}
                >
                  {plan.highlight && (
                    <span className="pricing-ribbon absolute right-[-52px] top-[26px] w-[190px] rotate-45 bg-brand py-1.5 text-center text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand-fg shadow-e2">
                      Best value
                    </span>
                  )}
                  <h3 className="pr-16 text-xl font-bold text-ink">{plan.durationLabel}</h3>
                  <p className="mt-6 text-5xl font-black tabular-nums tracking-tight text-ink">${plan.amountUsd}</p>
                  <p className="mt-4 flex-1 leading-relaxed text-ink-muted">{plan.desc}</p>
                  <Link to={planHref} className={`${plan.highlight ? "btn-primary" : "btn-secondary"} mt-8 w-full`}>
                    {loggedIn ? `Choose the ${plan.durationLabel.toLowerCase()}` : "Sign up, then choose this plan"}
                  </Link>
                </li>
              ))}
            </ul>
              <div className="mt-8 rounded-card border border-line bg-surface-sunken/60 p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-muted">Every plan includes</p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {PLAN_INCLUDES.map((item) => (
                    <li key={item} className="flex gap-3 leading-relaxed text-ink-muted">
                      <FaCheck aria-hidden="true" className="mt-1.5 shrink-0 text-sm text-brand" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* broken divider with "or": vertical from 1280px, horizontal below */}
            <div aria-hidden="true" className="relative flex items-center justify-center xl:flex-col">
              <span className="h-px flex-1 border-t-2 border-dashed border-line-strong xl:h-auto xl:w-px xl:border-l-2 xl:border-t-0" />
              <span className="mx-4 grid h-12 w-12 shrink-0 place-items-center rounded-full border border-line-strong bg-surface-raised text-sm font-bold uppercase text-brand xl:mx-0 xl:my-4">
                or
              </span>
              <span className="h-px flex-1 border-t-2 border-dashed border-line-strong xl:h-auto xl:w-px xl:border-l-2 xl:border-t-0" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">No plan needed</p>
              <h2 className="mt-3 text-3xl md:text-4xl">Explore the platform first</h2>
              <div className="mt-7">
                <FreePreview />
              </div>
              <div className="mt-7 flex flex-col gap-4">
                {!loggedIn && (
                  <Link to="/signup" className="btn-primary self-start px-7 text-base">
                    Create a free account
                    <FaArrowRight aria-hidden="true" />
                  </Link>
                )}
                <p className="text-ink-muted">
                  Questions about a plan?{" "}
                  <Link to="/contact" className="font-semibold text-brand underline-offset-4 hover:underline">
                    Contact us
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

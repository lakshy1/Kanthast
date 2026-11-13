import React from "react";

// Opening band for the marketing pages, in the shared Kanthast language: an
// eyebrow pill, a Plus Jakarta headline with one blue, underlined phrase, and
// muted lead copy. `aside` fills the right column on wide screens.
export default function PageHero({ kicker, title, accent, lead, children, aside }) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="home-glow page-hero-glow" />
      <div className="site-container relative grid gap-12 pb-16 pt-14 md:pb-24 md:pt-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center">
        <div className="min-w-0">
          {kicker ? (
            <p className="kx-eyebrow">{kicker}</p>
          ) : null}
          <h1 className="mt-5 text-[2.5rem] font-extrabold leading-[1.06] text-ink sm:text-5xl lg:text-[4rem]">
            {title}{" "}
            {accent ? (
              <span className="kx-u kx-accent">
                {accent}
                <svg viewBox="0 0 200 18" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M3 13 C 50 5, 120 3, 197 9" />
                </svg>
              </span>
            ) : null}
          </h1>
          {lead ? (
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted md:text-xl">{lead}</p>
          ) : null}
          {children}
        </div>
        {aside ? <div className="min-w-0">{aside}</div> : null}
      </div>
    </section>
  );
}

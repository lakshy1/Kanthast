import React from "react";

// Opening band for the marketing pages, in the homepage's language: solid
// navy, a heavy Inter headline with one mint phrase, cool-grey lead copy and
// a single blue bloom. `aside` fills the right column on wide screens.
export default function PageHero({ kicker, title, accent, lead, children, aside }) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-surface">
      <div aria-hidden="true" className="home-glow page-hero-glow" />
      <div className="site-container relative grid gap-12 pb-16 pt-14 md:pb-24 md:pt-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center">
        <div className="min-w-0">
          {kicker ? (
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">{kicker}</p>
          ) : null}
          <h1 className="mt-4 font-sans text-[2.5rem] font-extrabold leading-[1.06] tracking-[-0.04em] text-ink sm:text-5xl lg:text-[4rem]">
            {title} {accent ? <span className="text-brand">{accent}</span> : null}
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

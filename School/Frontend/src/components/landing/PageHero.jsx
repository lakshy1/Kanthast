import React from "react";
import { Eyebrow, Accent } from "../ui/Brandmarks";

// Opening band for the marketing pages, in the homepage's language: solid
// navy, a heavy Inter headline with one mint phrase, cool-grey lead copy and
// a single blue bloom. `aside` fills the right column on wide screens.
export default function PageHero({ kicker, title, accent, lead, children, aside }) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="home-glow page-hero-glow" />
      <div className="site-container relative grid gap-12 pb-16 pt-14 md:pb-24 md:pt-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center">
        <div className="min-w-0">
          {kicker ? <Eyebrow>{kicker}</Eyebrow> : null}
          <h1 className="kx-title kx-page-title mt-5">
            {title}{" "}
            {accent ? (() => {
              const [, word, mark] = accent.match(/^(.*?)([.!?]?)$/);
              return <Accent after={mark}>{word}</Accent>;
            })() : null}
          </h1>
          {lead ? (
            <p className="kx-page-lead mt-6">{lead}</p>
          ) : null}
          {children}
        </div>
        {aside ? <div className="min-w-0">{aside}</div> : null}
      </div>
    </section>
  );
}

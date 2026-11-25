import Reveal from "./Reveal";

// Reviews from consented pilot testers (data/pilotTesters.js). Plain cards: the words are the proof.
export default function PilotSection({ people }) {
  if (!people.length) return null;
  return (
    <section aria-labelledby="pilot-heading" className="border-t border-line bg-surface py-20 md:py-24">
      <div className="site-container">
        <Reveal>
          <p className="kx-eyebrow">Pilot testers</p>
          <h2 id="pilot-heading" className="mt-4 max-w-[680px] text-3xl font-bold tracking-tight [text-wrap:balance] md:text-5xl">
            What our pilot testers say.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-7 text-ink-muted [text-wrap:pretty]">
            Words from people who tried Kanthast during our pilot, shown with their permission.
          </p>
        </Reveal>
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {people.map((person, index) => (
            <Reveal as="li" key={person.name} delay={index * 100} className="flex flex-col rounded-2xl border border-line bg-surface-sunken p-8">
              <blockquote className="flex-1 text-xl leading-7 text-ink [text-wrap:pretty]">&ldquo;{person.quote}&rdquo;</blockquote>
              <figcaption className="mt-8 flex items-center gap-3">
                <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-base font-semibold text-brand">{person.name[0]}</span>
                <span>
                  <span className="block font-semibold text-ink">{person.name}</span>
                  <span className="block text-sm text-ink-muted">{person.role}</span>
                </span>
              </figcaption>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";
import Reveal from "./Reveal";
import ProWaitlist from "./ProWaitlist";

const NEXT = [
  { title: "Join today", body: "Leave one email address. That is all we ask for." },
  { title: "First lectures publish", body: "We email you once, when the first lectures are ready to watch." },
  { title: "Before any charge", body: "Payments are not open. We tell you first, and you decide." },
];

// Lectures are not playable yet, so the single ask here is the waitlist, not a purchase.
export default function WaitlistSection({ plansLine, startHref, startLabel }) {
  return (
    <section id="waitlist" aria-labelledby="home-waitlist-heading" className="border-t border-line bg-surface py-20 md:py-24">
      <div className="site-container grid gap-12 lg:grid-cols-12 lg:gap-16">
        <Reveal className="lg:col-span-7">
          <p className="kx-eyebrow">Waitlist</p>
          <h2 id="home-waitlist-heading" className="mt-4 max-w-[680px] text-3xl font-bold tracking-tight [text-wrap:balance] md:text-5xl">
            Be first when lectures open.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-7 text-ink-muted [text-wrap:pretty]">
            Medical lectures for NEET PG, INI CET and USMLE, laid out subject by subject. Leave your email and we will tell you the day the first ones publish.
          </p>
          <ProWaitlist />
          <p className="mt-8 max-w-xl text-sm leading-5 text-ink-muted">
            Planned plans, in rupees: {plansLine}.{" "}
            <Link to="/pricing" className="font-semibold text-brand underline-offset-4 hover:underline">What every plan includes</Link>
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Want to look around now?{" "}
            <Link to={startHref} className="font-semibold text-brand underline-offset-4 hover:underline">{startLabel}</Link>.
          </p>
        </Reveal>

        <Reveal className="lg:col-span-5" delay={120}>
          <div className="rounded-2xl border border-line bg-surface-sunken p-8">
            <h3 className="text-lg font-semibold text-ink">What happens next</h3>
            <ol className="mt-6 grid gap-6">
              {NEXT.map((item, index) => (
                <li key={item.title} className="flex gap-4">
                  <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-semibold tabular-nums text-white">{index + 1}</span>
                  <div>
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="mt-1 text-sm leading-5 text-ink-muted">{item.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

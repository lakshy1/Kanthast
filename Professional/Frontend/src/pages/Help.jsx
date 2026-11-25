import { Link } from "react-router-dom";
import Seo from "../components/Seo";
import { FAQS } from "../data/faqs";
import { EXAMS } from "../data/exams";
import { breadcrumbSchema, faqSchema } from "../utils/seo";

export default function Help() {
  return (
    <div className="page-aurora overflow-x-clip text-ink">
      <Seo
        title="Help | Kanthast Professional"
        description="Answers about Kanthast Professional: lectures, exams covered, pricing, progress, refunds and more."
        path="/help"
        jsonLd={[faqSchema(FAQS), breadcrumbSchema([{ name: "Kanthast Professional", path: "/" }, { name: "Help", path: "/help" }])]}
      />
      <section className="site-container pb-16 pt-16 md:pt-24">
        <p className="kx-eyebrow">Kanthast Professional</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-6xl">Help</h1>
        <p className="mt-4 max-w-xl text-lg text-ink-muted">Every question students ask us. Cannot find yours? <Link to="/contact" className="font-semibold text-brand underline-offset-4 hover:underline">Write to us</Link>.</p>
        <div className="mt-10 max-w-3xl divide-y divide-line border-y border-line">
          {FAQS.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {item.q}
                <span aria-hidden="true" className="text-ink-subtle transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="pb-6 leading-relaxed text-ink-muted">{item.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-sm text-ink-subtle">
          By exam:{" "}
          {EXAMS.map((e, i) => (
            <span key={e.slug}><Link className="underline" to={e.path}>{e.name}</Link>{i < EXAMS.length - 1 ? ", " : ""}</span>
          ))}
        </p>
      </section>
    </div>
  );
}

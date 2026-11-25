import { Link } from "react-router-dom";
import { FaArrowRight, FaCheck, FaXmark } from "react-icons/fa6";
import Seo from "../components/Seo";
import ProWaitlist from "../components/landing/ProWaitlist";
import SYLLABUS_SNAPSHOT from "../data/syllabusSnapshot";
import { EXAMS, examBySlug } from "../data/exams";
import { LESSONS_OPEN } from "../config/launch";
import { ORGANIZATION_ID, SITE_URL, breadcrumbSchema, faqSchema } from "../utils/seo";

// What Kanthast Professional has today, and what it does not. Keep in step with the homepage FAQ.
const TODAY = [
  "Animated lectures laid out subject by subject and chapter by chapter (lectures open as each video is published)",
  "Written notes and an images page for each lecture",
  "Resume where you stopped, and progress by subject",
  "Kanthast Assistant for questions about a topic",
];
const NOT_YET = [
  "A question bank, previous year questions or mock tests",
  "Topic weightage or a syllabus map for this specific exam",
];

export default function ExamPage({ slug }) {
  const exam = examBySlug(slug);
  const others = EXAMS.filter((e) => e.slug !== slug);
  const subjects = SYLLABUS_SNAPSHOT.subjects;
  const chapters = subjects.reduce((sum, s) => sum + s.chapters, 0);
  const faqs = [
    ...exam.faqs,
    { q: "Are the lectures available to watch?", a: LESSONS_OPEN ? "Yes, the lectures that are published. Each one opens the moment its video is published." : "Not yet. Lectures are coming soon and open as each video is published. Join the waitlist and we will email you when the first ones are live." },
  ];

  return (
    <div className="page-aurora overflow-x-clip text-ink">
      <Seo
        title={`Kanthast Professional for ${exam.name} | Animated medical lectures`}
        description={`Animated medical lectures by subject and chapter for ${exam.name}. ${subjects.length} subjects and ${chapters} chapters are mapped; lectures open as they are published.`}
        path={exam.path}
        jsonLd={[
          {
            "@type": "WebPage",
            "@id": `${SITE_URL}${exam.path}#page`,
            name: `Kanthast Professional for ${exam.name}`,
            url: `${SITE_URL}${exam.path}`,
            isPartOf: { "@id": `${SITE_URL}/#course` },
            publisher: { "@id": ORGANIZATION_ID },
          },
          faqSchema(faqs),
          breadcrumbSchema([
            { name: "Kanthast Professional", path: "/" },
            { name: exam.name, path: exam.path },
          ]),
        ]}
      />

      <section className="site-container pb-12 pt-16 md:pb-16 md:pt-24">
        <p className="kx-eyebrow">Kanthast Professional</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight md:text-6xl">Animated medical lectures for {exam.name}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-muted">
          Short lectures laid out by subject and chapter, with your place saved.{" "}
          {LESSONS_OPEN ? "Lectures open as each video is published." : "Lectures are coming soon and open as each video is published."}
        </p>
        <div className="mt-8">
          {LESSONS_OPEN ? (
            <Link to="/signup" className="btn-primary px-7 text-base">
              Create a free account
              <FaArrowRight aria-hidden="true" />
            </Link>
          ) : (
            <a href="#waitlist" className="btn-primary px-7 text-base">
              Join the waitlist
              <FaArrowRight aria-hidden="true" />
            </a>
          )}
        </div>
      </section>

      <section aria-labelledby="exam-about" className="border-t border-line bg-surface py-14 md:py-20">
        <div className="site-container grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <h2 id="exam-about" className="text-3xl font-bold md:text-4xl">About {exam.name}</h2>
            <p className="mt-2 text-sm text-ink-subtle">{exam.long}</p>
          </div>
          <div className="lg:col-span-7">
            <p className="text-lg leading-relaxed text-ink-muted">{exam.about}</p>
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              Dates, pattern, eligibility and syllabus change from year to year. Always check {exam.official} for the current details.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="exam-offer" className="border-t border-line bg-surface-sunken py-14 md:py-20">
        <div className="site-container">
          <h2 id="exam-offer" className="text-3xl font-bold md:text-4xl">What Kanthast offers for {exam.name}</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <div>
              <h3 className="text-lg font-bold">Today</h3>
              <ul className="mt-4 grid gap-3">
                {TODAY.map((item) => (
                  <li key={item} className="flex gap-3 text-ink-muted"><FaCheck aria-hidden="true" className="mt-1 shrink-0 text-brand" />{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold">Not included yet</h3>
              <ul className="mt-4 grid gap-3">
                {NOT_YET.map((item) => (
                  <li key={item} className="flex gap-3 text-ink-muted"><FaXmark aria-hidden="true" className="mt-1 shrink-0 text-ink-subtle" />{item}</li>
                ))}
              </ul>
            </div>
          </div>
          <h3 className="mt-14 text-lg font-bold">Subjects mapped so far</h3>
          <p className="mt-1 text-ink-muted">{subjects.length} subjects and {chapters} chapters. One library serves all three exams.</p>
          <ul className="mt-6 grid gap-x-10 border-t border-line md:grid-cols-2">
            {subjects.map((s) => (
              <li key={s.name} className="flex items-baseline justify-between gap-4 border-b border-line py-3">
                <span className="font-semibold">{s.name}</span>
                <span className="text-sm tabular-nums text-ink-subtle">{s.chapters} chapters</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {!LESSONS_OPEN && (
      <section id="waitlist" aria-labelledby="exam-waitlist" className="border-t border-line bg-surface py-14 md:py-20">
        <div className="site-container">
          <h2 id="exam-waitlist" className="max-w-2xl text-3xl font-bold md:text-5xl">Be first when lectures open.</h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-muted">
            Payments are not open, and we will tell you before anything is charged.
          </p>
          <ProWaitlist />
        </div>
      </section>
      )}

      <section aria-labelledby="exam-faq" className="border-t border-line bg-surface-sunken py-14 md:py-20">
        <div className="site-container">
          <h2 id="exam-faq" className="text-3xl font-bold md:text-4xl">Questions about {exam.name}</h2>
          <dl className="mt-8 grid max-w-3xl gap-6">
            {faqs.map((item) => (
              <div key={item.q}>
                <dt className="font-bold">{item.q}</dt>
                <dd className="mt-1 leading-relaxed text-ink-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-8 text-ink-muted">
            More answers on the <Link to="/help" className="font-semibold text-brand underline-offset-4 hover:underline">Help page</Link>. Preparing for another exam?{" "}
            {others.map((o, i) => (
              <span key={o.slug}>
                <Link to={o.path} className="font-semibold text-brand underline-offset-4 hover:underline">{o.name}</Link>
                {i < others.length - 1 ? ", " : "."}
              </span>
            ))}
          </p>
        </div>
      </section>
    </div>
  );
}

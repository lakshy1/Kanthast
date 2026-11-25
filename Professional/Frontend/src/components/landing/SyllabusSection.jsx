import { Link } from "react-router-dom";
import { FaArrowRight, FaChevronDown } from "react-icons/fa6";
import { LESSONS_OPEN } from "../../config/launch";

// Subjects as an accordion: the bar shows each subject's share of the mapped chapters, and opening a row shows
// real chapter names. Counts are syllabus entries, not published videos, so the status line says so.
export default function SyllabusSection({ subjects, totals }) {
  const most = Math.max(1, ...subjects.map((s) => s.chapters));
  return (
    <section aria-labelledby="syllabus-heading" className="aurora-band border-t border-line bg-surface-sunken py-20 md:py-24">
      <div className="site-container">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
            <p className="kx-eyebrow">Syllabus</p>
            <h2 id="syllabus-heading" className="mt-4 max-w-[680px] text-3xl font-bold tracking-tight text-ink [text-wrap:balance] md:text-5xl">
              {totals.chapters} chapters across {totals.subjects} subjects, mapped.
            </h2>
            <p className="mt-4 max-w-md text-lg leading-7 text-ink-muted [text-wrap:pretty]">
              {LESSONS_OPEN
                ? "Lectures open as each video is published."
                : "Every chapter is laid out and named. Lectures are coming soon and open as each video is published."}
            </p>
            <Link to="/library" className="btn-secondary mt-8">
              Browse the library
              <FaArrowRight aria-hidden="true" />
            </Link>
          </div>

          <ul className="grid gap-3 lg:col-span-7">
            {subjects.map((subject, index) => {
              const rest = Math.max(0, subject.chapters - subject.sampleChapters.length);
              return (
                <li key={subject.name}>
                  <details name="syllabus-subjects" open={index === 0} className="syl-item group rounded-2xl border border-line bg-surface">
                    <summary className="flex min-h-touch cursor-pointer list-none items-center gap-4 rounded-2xl px-6 py-4 [&::-webkit-details-marker]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                      <span className="min-w-0 flex-1">
                        <span className="block text-lg font-semibold text-ink">{subject.name}</span>
                        <span className="mt-2 flex items-center gap-3">
                          <span aria-hidden="true" className="h-1 flex-1 overflow-hidden rounded-full bg-brand-soft">
                            <span className="block h-full rounded-full bg-brand" style={{ width: `${Math.round((subject.chapters / most) * 100)}%` }} />
                          </span>
                          <span className="shrink-0 text-sm font-medium tabular-nums text-ink-muted">{subject.chapters} chapters</span>
                        </span>
                      </span>
                      <FaChevronDown aria-hidden="true" className="shrink-0 text-sm text-ink-subtle transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-180" />
                    </summary>
                    <div className="syl-body px-6 pb-6">
                      <ul className="flex flex-wrap gap-2" aria-label={`Chapters in ${subject.name}`}>
                        {subject.sampleChapters.map((chapter) => (
                          <li key={chapter} className="rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand">{chapter}</li>
                        ))}
                        {rest > 0 && <li className="rounded-full border border-line px-3 py-1 text-sm text-ink-muted">and {rest} more</li>}
                      </ul>
                      {subject.lectures > 0 && (
                        <p className="mt-4 text-sm text-ink-muted">
                          {subject.lectures} lectures planned{LESSONS_OPEN ? "" : ", opening as each video is published"}.
                        </p>
                      )}
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

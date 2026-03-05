function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`} />;
}

export function ListsPageSkeleton() {
  return (
    <>
      <div className="space-y-8">
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4].map((key) => (
            <SkeletonBlock key={key} className="h-12 w-40 rounded-2xl" />
          ))}
        </div>

        <div className="px-2">
          <SkeletonBlock className="h-12 w-72" />
        </div>

        {[1, 2].map((sectionKey) => (
          <div
            key={sectionKey}
            className="rounded-3xl bg-white/80 border border-slate-200 p-6 md:p-7 shadow-[0_18px_40px_rgba(15,23,42,0.06)]"
          >
            <SkeletonBlock className="h-11 w-96 max-w-full" />
            <div className="mt-6 space-y-3">
              {[1, 2, 3].map((rowKey) => (
                <div key={rowKey} className="rounded-2xl border border-slate-200/80 px-4 py-4 bg-slate-50/60">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="space-y-2 w-full">
                      <SkeletonBlock className="h-8 w-4/5" />
                      <SkeletonBlock className="h-4 w-20" />
                    </div>
                    <div className="flex items-center gap-2">
                      <SkeletonBlock className="h-11 w-11 rounded-full" />
                      <SkeletonBlock className="h-11 w-11 rounded-full" />
                      <SkeletonBlock className="h-11 w-11 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <aside className="self-start lg:sticky lg:top-24 overflow-visible h-fit">
        <div className="rounded-3xl bg-[#f4f2fa] border border-[#d8d3e7] p-6 shadow-[0_15px_35px_rgba(76,29,149,0.12)]">
          <SkeletonBlock className="h-7 w-28 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((key) => (
              <SkeletonBlock key={key} className="h-10 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}

export function SummaryPageSkeleton() {
  return (
    <div className="mt-6 grid lg:grid-cols-[1.4fr_1fr] gap-6">
      <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="mt-4 h-4 w-full" />
        <SkeletonBlock className="mt-2 h-4 w-11/12" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((key) => (
            <div key={key} className="rounded-xl bg-slate-50 border border-slate-200 p-4">
              <SkeletonBlock className="h-5 w-full" />
            </div>
          ))}
        </div>
      </article>

      <aside className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 p-6 shadow-[0_18px_40px_rgba(14,116,144,0.12)]">
        <SkeletonBlock className="h-7 w-52" />
        <SkeletonBlock className="mt-4 h-4 w-full" />
        <div className="mt-5 space-y-3">
          {[1, 2, 3].map((key) => (
            <SkeletonBlock key={key} className="h-11 w-full" />
          ))}
        </div>
      </aside>
    </div>
  );
}

export function VideoPageSkeleton() {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 md:p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <SkeletonBlock className="w-full aspect-video rounded-2xl" />
      <SkeletonBlock className="mt-3 h-4 w-32" />
    </section>
  );
}

export function VideoMetaSkeleton() {
  return (
    <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <SkeletonBlock className="h-7 w-44" />
      <div className="mt-4 space-y-3">
        {[1, 2, 3].map((key) => (
          <SkeletonBlock key={key} className="h-16 w-full" />
        ))}
      </div>
      <SkeletonBlock className="mt-6 h-24 w-full rounded-2xl" />
    </aside>
  );
}

export function ImagesPageSkeleton() {
  return (
    <section className="mt-6 grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, idx) => (
        <article
          key={idx}
          className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
        >
          <SkeletonBlock className="h-52 w-full rounded-none" />
          <div className="p-4 space-y-2">
            <SkeletonBlock className="h-5 w-24" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-3/4" />
          </div>
        </article>
      ))}
    </section>
  );
}

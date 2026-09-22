function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-xl bg-line ${className}`} />;
}

export function ProfileSkeleton() {
  return (
    <div className="mt-6 grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
      <div className="rounded-card border border-line bg-surface p-6 shadow-e2">
        <div className="flex items-center justify-between mb-5">
          <SkeletonBlock className="h-8 w-52" />
          <SkeletonBlock className="h-9 w-28 rounded-lg" />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-control border border-line bg-surface-sunken px-4 py-3">
              <SkeletonBlock className="h-3 w-20 mb-2" />
              <SkeletonBlock className="h-5 w-32" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-card border border-line bg-surface p-6 shadow-e2">
        <SkeletonBlock className="h-8 w-24 mb-4" />
        <SkeletonBlock className="h-52 w-full rounded-xl" />
      </div>
    </div>
  );
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
            className="rounded-card bg-surface/80 border border-line p-6 md:p-7 shadow-e2"
          >
            <SkeletonBlock className="h-11 w-96 max-w-full" />
            <div className="mt-6 space-y-3">
              {[1, 2, 3].map((rowKey) => (
                <div key={rowKey} className="rounded-card border border-line/80 px-4 py-4 bg-surface-sunken/60">
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
        <div className="rounded-card bg-surface-sunken border border-line p-6 shadow-e2">
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
      <article className="rounded-card border border-line bg-surface p-6 shadow-e2">
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="mt-4 h-4 w-full" />
        <SkeletonBlock className="mt-2 h-4 w-11/12" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((key) => (
            <div key={key} className="rounded-control bg-surface-sunken border border-line p-4">
              <SkeletonBlock className="h-5 w-full" />
            </div>
          ))}
        </div>
      </article>

      <aside className="rounded-card border border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50 p-6 shadow-e2">
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
    <section className="rounded-card border border-line bg-surface p-4 md:p-6 shadow-e2">
      <SkeletonBlock className="w-full aspect-video rounded-2xl" />
      <SkeletonBlock className="mt-3 h-4 w-32" />
    </section>
  );
}

export function VideoMetaSkeleton() {
  return (
    <aside className="rounded-card border border-line bg-surface p-5 shadow-e2">
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
          className="rounded-card overflow-hidden border border-line bg-surface shadow-e2"
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

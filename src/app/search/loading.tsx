export default function SearchLoading() {
  return (
    <>
      <div className="bg-neutral-900">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="animate-pulse space-y-2">
            <div className="h-3 w-24 rounded bg-white/20" />
            <div className="h-8 w-48 rounded bg-white/20" />
            <div className="h-4 w-32 rounded bg-white/20" />
          </div>
          <div className="mt-6 animate-pulse rounded-3xl border border-neutral-200 bg-white p-5 sm:p-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_0.7fr_0.5fr_auto]">
              <div className="h-12 rounded-xl bg-neutral-200" />
              <div className="h-12 rounded-xl bg-neutral-200" />
              <div className="h-12 rounded-xl bg-neutral-200" />
              <div className="h-12 rounded-xl bg-neutral-200" />
              <div className="h-12 rounded-xl bg-neutral-200" />
            </div>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-6 h-4 w-40 animate-pulse rounded bg-neutral-200" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse flex-col gap-6 rounded-2xl border border-neutral-200 bg-white p-6 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-3">
                <div className="h-4 w-40 rounded bg-neutral-200" />
                <div className="flex items-center gap-4">
                  <div className="h-7 w-16 rounded bg-neutral-200" />
                  <div className="h-0.5 w-16 bg-neutral-200" />
                  <div className="h-7 w-16 rounded bg-neutral-200" />
                </div>
              </div>
              <div className="flex items-center gap-8">
                <div className="space-y-2">
                  <div className="h-7 w-20 rounded bg-neutral-200" />
                  <div className="h-4 w-16 rounded bg-neutral-200" />
                </div>
                <div className="h-10 w-28 rounded-xl bg-neutral-200" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

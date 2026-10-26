export default function SeatMapLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="space-y-2">
        <div className="h-3 w-24 rounded bg-neutral-200" />
        <div className="h-8 w-48 rounded bg-neutral-200" />
        <div className="h-4 w-32 rounded bg-neutral-200" />
      </div>

      <div className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-16 rounded bg-neutral-200" />
            <div className="h-5 w-24 rounded bg-neutral-200" />
            <div className="h-4 w-20 rounded bg-neutral-200" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div className="h-5 w-32 rounded bg-neutral-200" />
          <div className="flex gap-4">
            <div className="h-4 w-16 rounded bg-neutral-200" />
            <div className="h-4 w-16 rounded bg-neutral-200" />
            <div className="h-4 w-16 rounded bg-neutral-200" />
          </div>
        </div>
        <div className="mx-auto mt-6 w-fit rounded-[2.5rem] border-2 border-neutral-200 bg-neutral-50 px-8 pt-6 pb-8">
          <div className="mx-auto mb-4 h-2 w-3/4 rounded-full bg-neutral-200" />
          <div className="mb-6 flex items-center justify-between border-b border-neutral-300 pb-4">
            <div className="h-6 w-16 rounded-lg bg-neutral-200" />
            <div className="h-3 w-12 rounded bg-neutral-200" />
            <div className="h-6 w-12 rounded-lg bg-neutral-200" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, row) => (
              <div
                key={row}
                className="grid grid-cols-[3rem_3rem_2rem_3rem_3rem] items-center gap-3"
              >
                <div className="h-12 w-12 rounded-xl bg-neutral-200" />
                <div className="h-12 w-12 rounded-xl bg-neutral-200" />
                <div className="h-3 w-4 rounded bg-neutral-200" />
                <div className="h-12 w-12 rounded-xl bg-neutral-200" />
                <div className="h-12 w-12 rounded-xl bg-neutral-200" />
              </div>
            ))}
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end">
          <div className="h-12 w-44 rounded-xl bg-neutral-200" />
        </div>
      </div>
    </div>
  );
}

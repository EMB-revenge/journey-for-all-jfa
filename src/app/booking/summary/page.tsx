import { type Metadata } from "next";
import Link from "next/link";

import { SummaryView } from "~/app/_components/booking/summary-view";
import { Navbar } from "~/app/_components/navbar";
import { seatMapParamsSchema } from "~/lib/seat-map";

export const metadata: Metadata = { title: "Review booking | JFA Transit" };

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const parsed = seatMapParamsSchema.safeParse(await searchParams);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        {parsed.success ? (
          <SummaryView params={parsed.data} />
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-300 px-6 py-12 text-center">
            <p className="text-lg font-semibold text-neutral-900">
              This link is incomplete
            </p>
            <p className="mt-2 text-neutral-600">
              Search for a trip and pick your seats again.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-black"
            >
              Back to search
            </Link>
          </div>
        )}
      </main>
    </>
  );
}

import { redirect } from "next/navigation";

import { Navbar } from "~/app/_components/navbar";
import { SearchForm } from "~/app/_components/search-form";
import { TripCard } from "~/app/_components/trip-card";
import { formatLongDate } from "~/app/_lib/format";
import { seatMapHref } from "~/lib/seat-map";
import { api } from "~/trpc/server";

type SearchPageProps = {
  searchParams: Promise<{
    from?: string;
    to?: string;
    date?: string;
    passengers?: string;
  }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { from, to, date, passengers: passengersParam } = await searchParams;

  if (!from || !to || !date) redirect("/");

  const passengers = passengersParam ? Number(passengersParam) : 1;

  const [cities, trips] = await Promise.all([
    api.city.list(),
    api.schedule.search({
      originCityId: from,
      destCityId: to,
      date,
      passengers,
    }),
  ]);

  const fromName = cities.find((c) => c.id === from)?.name ?? "Unknown";
  const toName = cities.find((c) => c.id === to)?.name ?? "Unknown";

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-charcoal">
          <div className="mx-auto max-w-7xl px-6 py-10">
            <div>
              <p className="text-sm font-semibold tracking-[0.25em] text-yellow-400 uppercase">
                Search results
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white">
                {fromName} → {toName}
              </h1>
              <p className="mt-1 text-white/70">{formatLongDate(date)}</p>
            </div>
            <div className="mt-6">
              <SearchForm
                initialFrom={from}
                initialTo={to}
                initialDate={date}
                initialPassengers={String(passengers)}
              />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12">
          {trips.length > 0 ? (
            <>
              <p className="mb-6 text-neutral-600">
                {trips.length} {trips.length === 1 ? "trip" : "trips"} for{" "}
                {passengers} {passengers === 1 ? "passenger" : "passengers"}
              </p>
              <div className="space-y-4">
                {trips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    seatMapHref={seatMapHref({
                      scheduleId: trip.id,
                      passengers,
                      from,
                      to,
                      date,
                    })}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-300 px-6 py-12 text-center">
              <p className="text-lg font-semibold text-neutral-900">
                No trips found
              </p>
              <p className="mt-2 text-neutral-600">
                Try searching for a different date or route.
              </p>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

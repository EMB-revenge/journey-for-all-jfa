import { TRPCError } from "@trpc/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Navbar } from "~/app/_components/navbar";
import { SeatPicker } from "~/app/_components/seat-picker";
import { formatLongDate, formatTime } from "~/app/_lib/format";
import { api } from "~/trpc/server";

type SeatsPageProps = {
  params: Promise<{ scheduleId: string }>;
};

export default async function SeatsPage({ params }: SeatsPageProps) {
  const { scheduleId } = await params;

  let trip;
  try {
    trip = await api.schedule.seats({ scheduleId });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
    if (error instanceof TRPCError && error.code === "PRECONDITION_FAILED") {
      return (
        <>
          <Navbar />
          <main className="mx-auto max-w-7xl px-6 py-24 text-center">
            <h1 className="text-2xl font-bold text-neutral-900">
              This trip is no longer available
            </h1>
            <p className="mt-2 text-neutral-600">
              It has already departed or was cancelled.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-yellow-300"
            >
              Search again
            </Link>
          </main>
        </>
      );
    }
    throw error;
  }

  return (
    <>
      <Navbar />
      <main>
        <section className="bg-neutral-900">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold tracking-[0.25em] text-yellow-400 uppercase">
                Choose your seats
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white">
                {trip.originCity} → {trip.destCity}
              </h1>
              <p className="mt-1 text-white/70">
                {formatLongDate(trip.travelDate.toISOString().slice(0, 10))} ·{" "}
                {formatTime(trip.departureTime)} –{" "}
                {formatTime(trip.arrivalTime)} · {trip.busName} ({trip.busType})
              </p>
            </div>
            <Link
              href="/"
              className="w-fit rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:border-yellow-400 hover:text-yellow-400"
            >
              Change search
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12">
          <SeatPicker
            scheduleId={trip.scheduleId}
            seats={trip.seats.map((seat) => ({
              id: seat.id,
              seatNumber: seat.seatNumber,
              available: seat.status === "AVAILABLE",
            }))}
            fare={trip.fare}
          />
        </section>
      </main>
    </>
  );
}
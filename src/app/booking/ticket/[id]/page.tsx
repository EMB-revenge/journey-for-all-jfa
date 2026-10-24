import { TRPCError } from "@trpc/server";
import { type Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Navbar } from "~/app/_components/navbar";
import {
  formatBookedAt,
  formatDuration,
  formatLongDate,
  formatTime,
} from "~/app/_lib/format";
import { api } from "~/trpc/server";

export const metadata: Metadata = { title: "Your ticket | JFA Transit" };

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let booking;
  try {
    booking = await api.booking.get({ id });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "UNAUTHORIZED") {
      redirect(
        `/login?redirectTo=${encodeURIComponent(`/booking/ticket/${id}`)}`,
      );
    }
    if (error instanceof TRPCError && error.code === "NOT_FOUND") notFound();
    throw error;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-[0.25em] text-neutral-500 uppercase">
              Booking confirmed
            </p>
            <h1 className="mt-2 text-3xl font-bold text-neutral-900">
              {booking.originCity} → {booking.destCity}
            </h1>
          </div>
          <span className="rounded-lg bg-green-100 px-3 py-1 text-sm font-bold text-green-800">
            {booking.status}
          </span>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
          <div className="flex flex-wrap items-baseline justify-between gap-2 bg-neutral-900 px-6 py-4">
            <p className="text-sm text-white/70">Booking reference</p>
            <p className="font-mono text-lg font-bold text-yellow-400">
              {booking.bookingReference}
            </p>
          </div>

          <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                Date
              </p>
              <p className="mt-1 font-semibold text-neutral-900">
                {formatLongDate(booking.travelDate.toISOString().slice(0, 10))}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                Bus
              </p>
              <p className="mt-1 font-semibold text-neutral-900">
                {booking.busName} · {booking.busType}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                Departure
              </p>
              <p className="mt-1 font-semibold text-neutral-900">
                {formatTime(booking.departureTime)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                Arrival
              </p>
              <p className="mt-1 font-semibold text-neutral-900">
                {formatTime(booking.arrivalTime)} ·{" "}
                {formatDuration(booking.durationMinutes)}
              </p>
            </div>
          </div>

          <div className="border-t border-neutral-200 px-6 py-6">
            <h2 className="text-lg font-semibold text-neutral-900">
              {booking.seats.length === 1 ? "Passenger" : "Passengers"}
            </h2>
            <ul className="mt-4 divide-y divide-neutral-200">
              {booking.seats.map((seat) => (
                <li
                  key={seat.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-3"
                >
                  <div>
                    <p className="font-semibold text-neutral-900">
                      {seat.passengerName}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {seat.passengerEmail} · {seat.passengerPhone}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900">
                    Seat {seat.seatNumber}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-neutral-200 px-6 py-6">
            <div className="flex items-center justify-between text-sm text-neutral-600">
              <span>
                {booking.seats.length} × ₱
                {booking.unitFare.toLocaleString("en-PH")}
              </span>
              <span className="text-2xl font-bold text-neutral-900">
                ₱{booking.totalAmount.toLocaleString("en-PH")}
              </span>
            </div>
            <p className="mt-4 text-sm text-neutral-500">
              Booked on {formatBookedAt(booking.createdAt)}
            </p>
          </div>
        </div>

        <p className="mt-4 text-sm text-neutral-500">
          Arrive 30 minutes early and present this ticket when boarding.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/my-bookings"
            className="rounded-xl border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:border-yellow-400"
          >
            My bookings
          </Link>
          <Link
            href="/"
            className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-yellow-300"
          >
            Book another trip
          </Link>
        </div>
      </main>
    </>
  );
}

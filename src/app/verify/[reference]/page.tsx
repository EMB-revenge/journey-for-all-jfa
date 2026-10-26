import { TRPCError } from "@trpc/server";
import { type Metadata } from "next";
import Link from "next/link";

import { Navbar } from "~/app/_components/navbar";
import {
  formatLongDate,
  formatTime,
  seatLabel,
} from "~/app/_lib/format";
import { api } from "~/trpc/server";

export const metadata: Metadata = { title: "Verify ticket | JFA Transit" };

const statusStyles: Record<string, { label: string; className: string }> = {
  CONFIRMED: {
    label: "Valid ticket",
    className: "border-green-200 bg-green-50 text-green-800",
  },
  CANCELLED: {
    label: "Cancelled booking",
    className: "border-red-200 bg-red-50 text-red-700",
  },
};

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference: rawReference } = await params;
  const reference = decodeURIComponent(rawReference);

  let booking;
  try {
    booking = await api.booking.verify({ reference });
  } catch (error) {
    if (error instanceof TRPCError && error.code === "NOT_FOUND") {
      booking = null;
    } else {
      throw error;
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
        {!booking ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <p className="text-xl font-bold text-red-700">Ticket not found</p>
            <p className="mt-2 text-sm text-red-700">
              No booking matches {reference}. Do not accept this ticket.
            </p>
          </div>
        ) : (
          <>
            <div
              className={`rounded-2xl border px-6 py-8 text-center ${
                (statusStyles[booking.status] ?? {
                  className: "border-amber-200 bg-amber-50 text-amber-800",
                }).className
              }`}
            >
              <p className="text-sm font-semibold tracking-[0.25em] uppercase">
                Ticket check
              </p>
              <p className="mt-2 text-3xl font-bold">
                {statusStyles[booking.status]?.label ?? booking.status}
              </p>
              <p className="mt-2 font-mono text-sm">
                {booking.bookingReference}
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">
              <h1 className="text-xl font-bold text-neutral-900">
                {booking.originCity} → {booking.destCity}
              </h1>

              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                    Date
                  </dt>
                  <dd className="mt-1 font-semibold text-neutral-900">
                    {formatLongDate(
                      booking.travelDate.toISOString().slice(0, 10),
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                    Bus
                  </dt>
                  <dd className="mt-1 font-semibold text-neutral-900">
                    {booking.busName} · {booking.busType}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                    Departure
                  </dt>
                  <dd className="mt-1 font-semibold text-neutral-900">
                    {formatTime(booking.departureTime)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                    Arrival
                  </dt>
                  <dd className="mt-1 font-semibold text-neutral-900">
                    {formatTime(booking.arrivalTime)}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 border-t border-neutral-200 pt-4">
                <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
                  {booking.passengers.length === 1 ? "Passenger" : "Passengers"}
                </p>
                <ul className="mt-2 divide-y divide-neutral-200">
                  {booking.passengers.map((passenger) => (
                    <li
                      key={passenger.id}
                      className="flex items-center justify-between py-2"
                    >
                      <span className="font-semibold text-neutral-900">
                        {passenger.maskedName}
                      </span>
                      <span className="text-sm font-semibold text-neutral-900">
                        Seat {seatLabel(passenger.seatNumber)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-neutral-500">
              Ask the passenger for a valid ID that matches the booking.
            </p>
          </>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm font-semibold text-neutral-700 underline decoration-neutral-300 underline-offset-4"
          >
            JFA Transit home
          </Link>
        </div>
      </main>
    </>
  );
}
import { TRPCError } from "@trpc/server";
import { type Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DownloadTicketButton } from "~/app/_components/booking/download-ticket-button";
import { TicketQr } from "~/app/_components/booking/ticket-qr";
import { Navbar } from "~/app/_components/navbar";
import {
  formatBookedAt,
  formatDuration,
  formatLongDate,
  formatTime,
  seatLabel,
} from "~/app/_lib/format";
import { verifyBaseUrl } from "~/app/_lib/verify-url";
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

  // The QR points at this site's own public verify page. On localhost the
  // helper swaps in the LAN address so a phone can actually reach it.
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ??
    requestHeaders.get("host") ??
    "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const verifyUrl = `${verifyBaseUrl(protocol, host)}/verify/${booking.verificationCode}`;

  const confirmed = booking.status === "CONFIRMED";
  const boarded = booking.checkedInAt !== null;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-[0.25em] text-neutral-500 uppercase">
              {confirmed ? "Booking confirmed" : "Booking status"}
            </p>
            <h1 className="mt-2 text-2xl font-bold text-neutral-900 sm:text-3xl">
              {booking.originCity} → {booking.destCity}
            </h1>
          </div>
          <span
            className={`rounded-lg px-3 py-1 text-sm font-bold ${
              boarded
                ? "bg-blue-100 text-blue-800"
                : confirmed
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {boarded ? "BOARDED" : booking.status}
          </span>
        </div>

        <div
          id="ticket-card"
          className="mt-6 overflow-hidden rounded-2xl border border-neutral-200 bg-white"
        >
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
            <p className="mt-1 text-sm break-all text-neutral-500">
              Contact: {booking.contact.name} · {booking.contact.email}
              {booking.contact.phone ? ` · ${booking.contact.phone}` : ""}
            </p>
            <ul className="mt-4 divide-y divide-neutral-200">
              {booking.seats.map((seat) => (
                <li
                  key={seat.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 py-3"
                >
                  <p className="font-semibold break-words text-neutral-900">
                    {seat.passengerName}
                  </p>
                  <p className="text-sm font-semibold text-neutral-900">
                    Seat {seatLabel(seat.seatNumber)}
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
            {booking.checkedInAt && (
              <p className="mt-1 text-sm font-semibold text-blue-700">
                Boarded at {formatBookedAt(booking.checkedInAt)}
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-4 border-t border-dashed border-neutral-300 bg-neutral-50 px-6 py-6 sm:flex-row sm:gap-6">
            <TicketQr value={verifyUrl} />
            <div className="text-center sm:text-left">
              <p className="font-semibold text-neutral-900">
                Scan for verification
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                Staff scan this code to check that your ticket is valid before
                you board.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm text-neutral-500">
          Arrive 30 minutes early and present this ticket when boarding.
        </p>

        <div className="mt-8 flex flex-wrap items-start gap-3">
          <DownloadTicketButton
            targetId="ticket-card"
            fileName={`ticket-${booking.bookingReference}`}
          />
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

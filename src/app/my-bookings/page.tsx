import { TRPCError } from "@trpc/server";
import { type Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CancelBookingButton } from "~/app/_components/booking/cancel-booking-button";
import { Navbar } from "~/app/_components/navbar";
import { formatLongDate, formatTime } from "~/app/_lib/format";
import { isDeparted } from "~/lib/dates";
import { api } from "~/trpc/server";

export const metadata: Metadata = { title: "My bookings | JFA Transit" };

export default async function MyBookingsPage() {
  let bookings;
  try {
    bookings = await api.booking.list();
  } catch (error) {
    if (error instanceof TRPCError && error.code === "UNAUTHORIZED") {
      redirect(`/login?redirectTo=${encodeURIComponent("/my-bookings")}`);
    }
    throw error;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div>
          <p className="text-sm font-semibold tracking-[0.25em] text-neutral-500 uppercase">
            Your trips
          </p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-900">
            My bookings
          </h1>
        </div>

        {bookings.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 px-6 py-12 text-center">
            <p className="text-lg font-semibold text-neutral-900">
              No bookings yet
            </p>
            <p className="mt-2 text-neutral-600">
              Search for a trip and your tickets will show up here.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-black transition hover:bg-yellow-300"
            >
              Find a trip
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {bookings.map((booking) => {
              const cancelled = booking.status === "CANCELLED";
              const boarded = booking.checkedInAt !== null;
              const canCancel =
                booking.status === "CONFIRMED" &&
                !boarded &&
                !isDeparted(booking.travelDate, booking.departureTime);

              return (
                <li
                  key={booking.id}
                  className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-neutral-500">
                      {booking.bookingReference}
                    </p>
                    <p className="mt-1 text-xl font-bold text-neutral-900">
                      {booking.originCity} → {booking.destCity}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {formatLongDate(
                        booking.travelDate.toISOString().slice(0, 10),
                      )}{" "}
                      · {formatTime(booking.departureTime)}
                      {cancelled
                        ? " · Seats released"
                        : ` · ${booking.seats.length} ${
                            booking.seats.length === 1 ? "seat" : "seats"
                          } · ₱${booking.totalAmount.toLocaleString("en-PH")}`}
                    </p>
                    {canCancel && (
                      <div className="mt-3">
                        <CancelBookingButton
                          bookingId={booking.id}
                          reference={booking.bookingReference}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`rounded-lg px-3 py-1 text-sm font-bold ${
                        cancelled
                          ? "bg-red-100 text-red-700"
                          : boarded
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {boarded && !cancelled ? "BOARDED" : booking.status}
                    </span>
                    <Link
                      href={`/booking/ticket/${booking.id}`}
                      className="rounded-xl border border-neutral-300 px-5 py-2 text-sm font-semibold text-neutral-900 transition hover:border-yellow-400"
                    >
                      View ticket
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
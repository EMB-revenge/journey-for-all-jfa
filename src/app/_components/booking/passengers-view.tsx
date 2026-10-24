"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { HoldCountdown } from "~/app/_components/booking/hold-countdown";
import { formatDuration, formatLongDate, formatTime } from "~/app/_lib/format";
import { useBookingFlow } from "~/context/BookingFlowProvider";
import { searchHref, seatMapHref, type SeatMapParams } from "~/lib/seat-map";
import { api } from "~/trpc/react";

/**
 * Hold recap after a successful hold: the passenger forms come with booking
 * confirm. Deliberately a recap, not a booking.
 */
export function PassengersView({ params }: { params: SeatMapParams }) {
  const router = useRouter();
  const utils = api.useUtils();
  const { state, dispatch } = useBookingFlow();
  const [mounted, setMounted] = useState(false);

  // The hold lives in client state only, so render it after hydration.
  useEffect(() => {
    setMounted(true);
  }, []);

  const hasHold =
    mounted &&
    state.scheduleId === params.scheduleId &&
    state.expiresAt !== null;

  const { data } = api.schedule.seats.useQuery(
    { scheduleId: params.scheduleId },
    { enabled: hasHold },
  );
  const { mutate: releaseHolds } = api.hold.release.useMutation();

  const changeSeats = useCallback(() => {
    releaseHolds(
      { scheduleId: params.scheduleId },
      {
        onSettled: () => {
          dispatch({ type: "holdCleared" });
          void utils.schedule.seats.invalidate();
          router.push(seatMapHref(params));
        },
      },
    );
  }, [dispatch, params, releaseHolds, router, utils]);

  // Expiry is the server's call, never the timer's (SPEC 12): release, clear,
  // and drop the passenger back on the same seat map.
  const handleExpire = useCallback(() => {
    releaseHolds(
      { scheduleId: params.scheduleId },
      {
        onSettled: () => {
          dispatch({ type: "holdCleared" });
          void utils.schedule.seats.invalidate();
          router.replace(seatMapHref(params));
        },
      },
    );
  }, [dispatch, params, releaseHolds, router, utils]);

  if (!mounted) {
    return <p className="py-16 text-center text-neutral-600">Loading...</p>;
  }

  if (!state.expiresAt || state.scheduleId !== params.scheduleId) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 px-6 py-12 text-center">
        <p className="text-lg font-semibold text-neutral-900">
          No active seat hold
        </p>
        <p className="mt-2 text-neutral-600">
          Your five-minute hold may have expired. Pick your seats again to
          continue.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={seatMapHref(params)}
            className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-black"
          >
            Back to seat map
          </Link>
          <Link
            href={searchHref(params)}
            className="rounded-xl border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-900"
          >
            Back to results
          </Link>
        </div>
      </div>
    );
  }

  const seatNumbers = state.selectedSeatIds
    .map((id) => data?.seats.find((seat) => seat.id === id)?.seatNumber)
    .filter((seatNumber) => seatNumber !== undefined)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-[0.25em] text-neutral-500 uppercase">
            Seats held
          </p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-900">
            You have {state.selectedSeatIds.length}{" "}
            {state.selectedSeatIds.length === 1 ? "seat" : "seats"} for five
            minutes
          </h1>
        </div>
        <HoldCountdown expiresAt={state.expiresAt} onExpire={handleExpire} />
      </div>

      <div className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Trip
          </p>
          <p className="mt-1 font-semibold text-neutral-900">
            {data
              ? `${data.originCity} → ${data.destCity}`
              : "Your selected trip"}
          </p>
          {data && (
            <p className="text-sm text-neutral-500">
              {formatLongDate(data.travelDate.toISOString().slice(0, 10))} ·{" "}
              {formatTime(data.departureTime)} to {formatTime(data.arrivalTime)}
            </p>
          )}
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Seats
          </p>
          <p className="mt-1 font-semibold text-neutral-900">
            {seatNumbers.length > 0
              ? seatNumbers.join(", ")
              : `${state.selectedSeatIds.length} selected`}
          </p>
          {data && (
            <p className="text-sm text-neutral-500">
              {data.busName} · {formatDuration(data.durationMinutes)} · ₱
              {data.fare.toLocaleString("en-PH")} per passenger
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <p className="font-semibold text-neutral-900">
          Passenger details come next
        </p>
        <p className="mt-2 text-neutral-600">
          Seats are only held for now. Names and contact details per seat, the
          booking summary, and your ticket come with booking confirmation. Keep
          this tab open until then.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={changeSeats}
            className="rounded-xl border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:border-yellow-400"
          >
            Change seats
          </button>
          <Link
            href={searchHref(params)}
            className="rounded-xl px-6 py-3 text-sm font-semibold text-neutral-700 underline decoration-neutral-300 underline-offset-4"
          >
            Back to results
          </Link>
        </div>
      </div>
    </div>
  );
}

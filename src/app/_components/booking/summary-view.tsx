"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { HoldCountdown } from "~/app/_components/booking/hold-countdown";
import { formatDuration, formatLongDate, formatTime } from "~/app/_lib/format";
import { useAuth } from "~/context/AuthContext";
import { useBookingFlow } from "~/context/BookingFlowProvider";
import { searchHref, seatMapHref, type SeatMapParams } from "~/lib/seat-map";
import { api } from "~/trpc/react";

/**
 * Last look before the booking is written: trip, passengers, and the fare the
 * confirm transaction will snapshot (SPEC 9).
 */
export function SummaryView({ params }: { params: SeatMapParams }) {
  const router = useRouter();
  const utils = api.useUtils();
  const { session } = useAuth();
  const { state, dispatch } = useBookingFlow();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

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

  const seatNumbers = useMemo(
    () =>
      new Map((data?.seats ?? []).map((seat) => [seat.id, seat.seatNumber])),
    [data],
  );

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

  const { mutate: confirmBooking, isPending } = api.booking.confirm.useMutation(
    {
      onSuccess: ({ id }) => {
        setConfirmed(true);
        dispatch({ type: "reset" });
        router.push(`/booking/ticket/${id}`);
      },
      onError: (mutationError) => {
        const payload = mutationError.data?.conflict;

        // A lost seat or an expired hold sends the passenger back to the map.
        // The holds go too, so the seats are not blocked for five minutes.
        if (payload && "takenSeats" in payload) {
          const numbers = payload.takenSeats
            .map((seatId) => seatNumbers.get(seatId))
            .filter((seatNumber) => seatNumber !== undefined)
            .sort((a, b) => a - b);
          setError(
            numbers.length > 0
              ? `Seat ${numbers.join(", ")} was taken while you were confirming. Pick another.`
              : "Someone took one of those seats. Pick another.",
          );
          dispatch({ type: "holdCleared" });
          releaseHolds({ scheduleId: params.scheduleId });
          void utils.schedule.seats.invalidate();
          return;
        }

        if (payload && "reason" in payload) {
          setError("Your hold expired before the booking went through.");
          dispatch({ type: "holdCleared" });
          void utils.schedule.seats.invalidate();
          return;
        }

        setError(
          mutationError.message ||
            "We could not confirm the booking. Please try again.",
        );
      },
    },
  );

  if (!mounted) {
    return <p className="py-16 text-center text-neutral-600">Loading...</p>;
  }

  // The booking is written but the ticket page is still loading: without this
  // the cleared flow would flash "No active seat hold" at a confirmed booking.
  if (confirmed) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center">
        <p className="text-lg font-semibold text-neutral-900">
          Booking confirmed
        </p>
        <p className="mt-2 text-neutral-600">Loading your ticket...</p>
      </div>
    );
  }

  if (!state.expiresAt || state.scheduleId !== params.scheduleId) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 px-6 py-12 text-center">
        <p className="text-lg font-semibold text-neutral-900">
          {error ?? "No active seat hold"}
        </p>
        <p className="mt-2 text-neutral-600">
          Pick your seats again to continue. Nothing was booked.
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

  if (state.passengerDetails.length !== state.selectedSeatIds.length) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 px-6 py-12 text-center">
        <p className="text-lg font-semibold text-neutral-900">
          Passenger details are missing
        </p>
        <p className="mt-2 text-neutral-600">
          Add a name for every held seat before confirming.
        </p>
        <Link
          href={seatMapHref(params, "/booking/passengers")}
          className="mt-6 inline-block rounded-xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-black"
        >
          Back to passenger details
        </Link>
      </div>
    );
  }

  const total = (data?.fare ?? 0) * state.passengerDetails.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-[0.25em] text-neutral-500 uppercase">
            Review booking
          </p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-900">
            Check everything before you confirm
          </h1>
        </div>
        <HoldCountdown expiresAt={state.expiresAt} onExpire={handleExpire} />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      )}

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
            Bus
          </p>
          <p className="mt-1 font-semibold text-neutral-900">
            {data?.busName ?? "Loading"}
          </p>
          {data && (
            <p className="text-sm text-neutral-500">
              {data.busType} · {formatDuration(data.durationMinutes)}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Passengers</h2>
        <ul className="mt-4 divide-y divide-neutral-200">
          {state.passengerDetails.map((passenger) => (
            <li
              key={passenger.seatId}
              className="flex flex-wrap items-baseline justify-between gap-2 py-3"
            >
              <p className="font-semibold text-neutral-900">{passenger.name}</p>
              <p className="text-sm font-semibold text-neutral-900">
                Seat {seatNumbers.get(passenger.seatId) ?? "—"}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-neutral-200 pt-4 text-sm text-neutral-500">
          Contact:{" "}
          {[session?.user.name, session?.user.email, session?.user.phone]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <span className="text-neutral-600">
            {state.passengerDetails.length} × ₱
            {(data?.fare ?? 0).toLocaleString("en-PH")}
          </span>
          <span className="text-2xl font-bold text-neutral-900">
            ₱{total.toLocaleString("en-PH")}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={seatMapHref(params, "/booking/passengers")}
            className="rounded-xl border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:border-yellow-400"
          >
            Edit passenger details
          </Link>
          <button
            type="button"
            onClick={() =>
              confirmBooking({
                scheduleId: params.scheduleId,
                passengers: state.passengerDetails,
              })
            }
            disabled={!data || isPending}
            className="rounded-xl bg-yellow-400 px-8 py-3 text-base font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
          >
            {isPending ? "Confirming..." : "Confirm booking"}
          </button>
        </div>
      </div>
    </div>
  );
}

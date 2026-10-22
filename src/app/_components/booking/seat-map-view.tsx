"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { formatDuration, formatLongDate, formatTime } from "~/app/_lib/format";
import { useAuth } from "~/context/AuthContext";
import { useBookingFlow } from "~/context/BookingFlowProvider";
import { searchHref, seatMapHref, type SeatMapParams } from "~/lib/seat-map";
import { api } from "~/trpc/react";

function busTypeLabel(value: string) {
  if (value === "AIRCON") return "Aircon";
  if (value === "ORDINARY") return "Ordinary / non-aircon";
  return value;
}

export function SeatMapView({ params }: { params: SeatMapParams }) {
  const router = useRouter();
  const { session, isPending: authPending } = useAuth();
  const { state, dispatch } = useBookingFlow();

  const [conflict, setConflict] = useState<string | null>(null);
  const [holdError, setHoldError] = useState<string | null>(null);

  const { data, error, isLoading, refetch } = api.schedule.seats.useQuery({
    scheduleId: params.scheduleId,
  });

  useEffect(() => {
    dispatch({
      type: "startTrip",
      scheduleId: params.scheduleId,
      passengers: params.passengers,
      from: params.from,
      to: params.to,
      date: params.date,
    });
  }, [
    dispatch,
    params.scheduleId,
    params.passengers,
    params.from,
    params.to,
    params.date,
  ]);

  // A stale selection from an earlier trip must never leak onto this map.
  const selectedSeatIds =
    state.scheduleId === params.scheduleId ? state.selectedSeatIds : [];

  const seatNumbers = useMemo(
    () =>
      new Map((data?.seats ?? []).map((seat) => [seat.id, seat.seatNumber])),
    [data],
  );

  const createHold = api.hold.create.useMutation({
    onSuccess: ({ expiresAt }) => {
      dispatch({ type: "holdStarted", expiresAt });
      router.push(seatMapHref(params, "/booking/passengers"));
    },
    onError: (mutationError) => {
      const payload = mutationError.data?.conflict;

      if (payload && "takenSeats" in payload) {
        const numbers = payload.takenSeats
          .map((id) => seatNumbers.get(id))
          .filter((seatNumber) => seatNumber !== undefined)
          .sort((a, b) => a - b);

        setConflict(
          numbers.length > 0
            ? `Seat ${numbers.join(", ")} was taken while you were deciding. Pick another one.`
            : "Some of those seats were taken. Pick another one.",
        );
        dispatch({ type: "removeSeats", seatIds: payload.takenSeats });
        void refetch();
        return;
      }

      setHoldError(
        mutationError.message ||
          "We could not hold those seats. Please try again.",
      );
    },
  });

  function handleContinue() {
    if (selectedSeatIds.length !== params.passengers) return;

    setConflict(null);
    setHoldError(null);

    // The auth gate sits here, on Continue, not on browsing (SPEC 11).
    if (!session) {
      router.push(
        `/login?redirectTo=${encodeURIComponent(seatMapHref(params))}`,
      );
      return;
    }

    createHold.mutate({
      scheduleId: params.scheduleId,
      seatIds: selectedSeatIds,
    });
  }

  if (isLoading) {
    return (
      <p className="py-16 text-center text-neutral-600">Loading seats...</p>
    );
  }

  if (error || !data) {
    const departed = error?.data?.code === "PRECONDITION_FAILED";

    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 px-6 py-12 text-center">
        <p className="text-lg font-semibold text-neutral-900">
          {departed
            ? "This trip has departed or was cancelled"
            : "We could not load this seat map"}
        </p>
        <p className="mt-2 text-neutral-600">
          {departed
            ? "Pick another trip from the results for your route."
            : "Try again, or start a new search."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {!departed && (
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-xl border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-900"
            >
              Try again
            </button>
          )}
          <Link
            href={searchHref(params)}
            className="rounded-xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-black"
          >
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  const canContinue =
    selectedSeatIds.length === params.passengers &&
    !createHold.isPending &&
    !authPending;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold tracking-[0.25em] text-neutral-500 uppercase">
          Pick your seats
        </p>
        <h1 className="mt-2 text-3xl font-bold text-neutral-900">
          {data.originCity} → {data.destCity}
        </h1>
        <p className="mt-1 text-neutral-600">
          {formatLongDate(data.travelDate.toISOString().slice(0, 10))}
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-neutral-200 bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Departure
          </p>
          <p className="mt-1 font-semibold text-neutral-900">
            {formatTime(data.departureTime)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Arrival
          </p>
          <p className="mt-1 font-semibold text-neutral-900">
            {formatTime(data.arrivalTime)}
          </p>
          <p className="text-sm text-neutral-500">
            {formatDuration(data.durationMinutes)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Bus
          </p>
          <p className="mt-1 font-semibold text-neutral-900">{data.busName}</p>
          <p className="text-sm text-neutral-500">
            {busTypeLabel(data.busType)}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-wide text-neutral-500 uppercase">
            Fare
          </p>
          <p className="mt-1 font-semibold text-neutral-900">
            ₱{data.fare.toLocaleString("en-PH")}
          </p>
          <p className="text-sm text-neutral-500">per passenger</p>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-semibold text-neutral-900">
            {selectedSeatIds.length} of {params.passengers}{" "}
            {params.passengers === 1 ? "seat" : "seats"} selected
          </p>
          <ul className="flex items-center gap-4 text-sm text-neutral-600">
            <li className="flex items-center gap-2">
              <span className="h-4 w-4 rounded border border-neutral-300 bg-white" />
              Available
            </li>
            <li className="flex items-center gap-2">
              <span className="h-4 w-4 rounded border border-yellow-400 bg-yellow-400" />
              Selected
            </li>
            <li className="flex items-center gap-2">
              <span className="h-4 w-4 rounded border border-neutral-200 bg-neutral-100" />
              Occupied
            </li>
          </ul>
        </div>

        {data.seats.length === 0 ? (
          <p className="mt-6 text-neutral-600">
            This bus has no seats configured yet.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8">
            {data.seats.map((seat) => {
              const occupied = seat.status === "OCCUPIED";
              const selected = selectedSeatIds.includes(seat.id);

              return (
                <button
                  key={seat.id}
                  type="button"
                  disabled={occupied}
                  aria-pressed={selected}
                  aria-label={`Seat ${seat.seatNumber}, ${
                    occupied ? "occupied" : selected ? "selected" : "available"
                  }`}
                  onClick={() => {
                    setConflict(null);
                    dispatch({ type: "toggleSeat", seatId: seat.id });
                  }}
                  className={`aspect-square rounded-xl border text-sm font-semibold transition focus:ring-2 focus:ring-yellow-400/60 focus:outline-none ${
                    occupied
                      ? "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400"
                      : selected
                        ? "border-yellow-400 bg-yellow-400 text-black"
                        : "border-neutral-300 bg-white text-neutral-900 hover:border-yellow-400"
                  }`}
                >
                  {seat.seatNumber}
                </button>
              );
            })}
          </div>
        )}

        {conflict && (
          <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {conflict}
          </p>
        )}
        {holdError && (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {holdError}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={searchHref(params)}
            className="text-sm font-semibold text-neutral-700 underline decoration-neutral-300 underline-offset-4"
          >
            Back to results
          </Link>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className="rounded-xl bg-yellow-400 px-8 py-3 text-base font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-yellow-400/40"
            >
              {createHold.isPending
                ? "Holding seats..."
                : session
                  ? "Hold seats and continue"
                  : "Sign in to continue"}
            </button>
            <p className="text-xs text-neutral-500">
              Seats are held for 5 minutes once you continue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { HoldCountdown } from "~/app/_components/booking/hold-countdown";
import { formatDuration, formatLongDate, formatTime } from "~/app/_lib/format";
import { useAuth } from "~/context/AuthContext";
import { useBookingFlow } from "~/context/BookingFlowProvider";
import { fieldErrors, passengerSchema } from "~/lib/schemas";
import { searchHref, seatMapHref, type SeatMapParams } from "~/lib/seat-map";
import type { PassengerDetail } from "~/reducers/bookingFlowReducer";
import { api } from "~/trpc/react";

type Draft = { name: string; email: string; phone: string };

const emptyDraft: Draft = { name: "", email: "", phone: "" };

const fieldClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/40 focus:outline-none";

/**
 * Passenger details for the held seats: one name, email, and phone per seat
 * (SPEC 20.8). Saves to the booking flow and continues to the summary.
 */
export function PassengersView({ params }: { params: SeatMapParams }) {
  const router = useRouter();
  const utils = api.useUtils();
  const { session } = useAuth();
  const { state, dispatch } = useBookingFlow();
  const [mounted, setMounted] = useState(false);

  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(
      state.passengerDetails.map((p) => [
        p.seatId,
        { name: p.name, email: p.email, phone: p.phone },
      ]),
    ),
  );
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>(
    {},
  );

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

  // Held seat ids in seat-number order, so forms read Seat 3, Seat 4, ...
  const orderedSeats = useMemo(() => {
    const numbers = new Map(
      (data?.seats ?? []).map((seat) => [seat.id, seat.seatNumber]),
    );
    return state.selectedSeatIds
      .map((id) => ({ id, seatNumber: numbers.get(id) }))
      .sort((a, b) => (a.seatNumber ?? 0) - (b.seatNumber ?? 0));
  }, [data, state.selectedSeatIds]);

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

  /** The first passenger starts from the signed-in account. */
  function getDraft(seatId: string, index: number): Draft {
    const saved = drafts[seatId];
    if (saved) return saved;
    if (index === 0) {
      return {
        name: session?.user.name ?? "",
        email: session?.user.email ?? "",
        phone: "",
      };
    }
    return emptyDraft;
  }

  function updateDraft(
    seatId: string,
    index: number,
    field: keyof Draft,
    value: string,
  ) {
    setDrafts((prev) => ({
      ...prev,
      [seatId]: { ...(prev[seatId] ?? getDraft(seatId, index)), [field]: value },
    }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: Record<string, Record<string, string>> = {};
    const passengers: PassengerDetail[] = [];

    orderedSeats.forEach((seat, index) => {
      const parsed = passengerSchema.safeParse({
        seatId: seat.id,
        ...getDraft(seat.id, index),
      });
      if (parsed.success) passengers.push(parsed.data);
      else nextErrors[seat.id] = fieldErrors(parsed.error);
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    dispatch({ type: "passengersSaved", passengers });
    router.push(seatMapHref(params, "/booking/summary"));
  }

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

  const seatNumbers = orderedSeats
    .map((seat) => seat.seatNumber)
    .filter((seatNumber) => seatNumber !== undefined);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold tracking-[0.25em] text-neutral-500 uppercase">
            Passenger details
          </p>
          <h1 className="mt-2 text-3xl font-bold text-neutral-900">
            Who is riding in{" "}
            {state.selectedSeatIds.length === 1 ? "this seat" : "these seats"}?
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

      {data ? (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {orderedSeats.map((seat, index) => {
            const draft = getDraft(seat.id, index);
            const seatErrors = errors[seat.id] ?? {};

            return (
              <div
                key={seat.id}
                className="rounded-2xl border border-neutral-200 bg-white p-6"
              >
                <h2 className="text-lg font-semibold text-neutral-900">
                  Passenger {index + 1} · Seat {seat.seatNumber}
                </h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className="mb-2 block text-sm text-neutral-600">
                      Full name
                    </span>
                    <input
                      value={draft.name}
                      onChange={(e) =>
                        updateDraft(seat.id, index, "name", e.target.value)
                      }
                      className={fieldClass}
                      autoComplete="name"
                    />
                    {seatErrors.name && (
                      <span className="mt-1 block text-sm text-red-600">
                        {seatErrors.name}
                      </span>
                    )}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm text-neutral-600">
                      Email
                    </span>
                    <input
                      type="email"
                      value={draft.email}
                      onChange={(e) =>
                        updateDraft(seat.id, index, "email", e.target.value)
                      }
                      className={fieldClass}
                      autoComplete="email"
                    />
                    {seatErrors.email && (
                      <span className="mt-1 block text-sm text-red-600">
                        {seatErrors.email}
                      </span>
                    )}
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm text-neutral-600">
                      Phone number
                    </span>
                    <input
                      type="tel"
                      value={draft.phone}
                      onChange={(e) =>
                        updateDraft(seat.id, index, "phone", e.target.value)
                      }
                      className={fieldClass}
                      autoComplete="tel"
                    />
                    {seatErrors.phone && (
                      <span className="mt-1 block text-sm text-red-600">
                        {seatErrors.phone}
                      </span>
                    )}
                  </label>
                </div>
              </div>
            );
          })}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={changeSeats}
                className="rounded-xl border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:border-yellow-400"
              >
                Change seats
              </button>
              <Link
                href={searchHref(params)}
                className="text-sm font-semibold text-neutral-700 underline decoration-neutral-300 underline-offset-4"
              >
                Back to results
              </Link>
            </div>
            <button
              type="submit"
              className="rounded-xl bg-yellow-400 px-8 py-3 text-base font-semibold text-black transition hover:bg-yellow-300"
            >
              Review booking
            </button>
          </div>
        </form>
      ) : (
        <p className="py-8 text-center text-neutral-600">Loading seats...</p>
      )}
    </div>
  );
}
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { HoldCountdown } from "~/app/_components/booking/hold-countdown";
import {
  formatDuration,
  formatLongDate,
  formatTime,
  seatLabel,
} from "~/app/_lib/format";
import { useAuth } from "~/context/AuthContext";
import { useBookingFlow } from "~/context/BookingFlowProvider";
import { fieldErrors, passengerSchema, phoneSchema } from "~/lib/schemas";
import { searchHref, seatMapHref, type SeatMapParams } from "~/lib/seat-map";
import type { PassengerDetail } from "~/reducers/bookingFlowReducer";
import { authClient } from "~/server/better-auth/client";
import { api } from "~/trpc/react";

const fieldClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/40 focus:outline-none";

/**
 * The held seats only need a name each. Contact details come from the account,
 * so this page never asks for an email or phone twice (SPEC 20.8).
 */
export function PassengersView({ params }: { params: SeatMapParams }) {
  const router = useRouter();
  const utils = api.useUtils();
  const { session } = useAuth();
  const { state, dispatch } = useBookingFlow();
  const [mounted, setMounted] = useState(false);

  const [names, setNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(state.passengerDetails.map((p) => [p.seatId, p.name])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  /** Only used when an older account has no phone yet. */
  const [contactPhone, setContactPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

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
  function getName(seatId: string, index: number): string {
    const saved = names[seatId];
    if (saved !== undefined) return saved;
    return index === 0 ? (session?.user.name ?? "") : "";
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const passengers: PassengerDetail[] = [];

    orderedSeats.forEach((seat, index) => {
      const parsed = passengerSchema.safeParse({
        seatId: seat.id,
        name: getName(seat.id, index),
      });
      if (parsed.success) passengers.push(parsed.data);
      else
        nextErrors[`seat-${seat.id}`] =
          fieldErrors(parsed.error).name ?? "Enter a name";
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // Accounts created before signup asked for a number fill it in once here.
    if (!session?.user.phone) {
      const parsedPhone = phoneSchema.safeParse(contactPhone);
      if (!parsedPhone.success) {
        setErrors({
          contact:
            fieldErrors(parsedPhone.error).phone ??
            "Enter a valid phone number",
        });
        return;
      }

      setSavingPhone(true);
      const { error } = await authClient.updateUser({
        phone: parsedPhone.data,
      });
      setSavingPhone(false);
      if (error) {
        setErrors({
          contact: error.message ?? "Could not save your phone number.",
        });
        return;
      }
    }

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
              ? seatNumbers.map(seatLabel).join(", ")
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
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-neutral-900">
            Contact for this booking
          </h2>
          <Link
            href="/account"
            className="text-sm font-semibold text-neutral-700 underline decoration-neutral-300 underline-offset-4"
          >
            Edit in account
          </Link>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          {session?.user.name} · {session?.user.email}
        </p>

        {session?.user.phone ? (
          <p className="mt-1 text-sm text-neutral-500">{session.user.phone}</p>
        ) : (
          <label className="mt-4 block">
            <span className="mb-2 block text-sm text-neutral-600">
              Mobile number
            </span>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className={fieldClass}
              autoComplete="tel"
            />
            {errors.contact ? (
              <span className="mt-1 block text-sm text-red-600">
                {errors.contact}
              </span>
            ) : (
              <span className="mt-1 block text-sm text-neutral-500">
                Saved to your account for next time.
              </span>
            )}
          </label>
        )}
      </div>

      {data ? (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {orderedSeats.map((seat, index) => {
            const seatError = errors[`seat-${seat.id}`];

            return (
              <div
                key={seat.id}
                className="rounded-2xl border border-neutral-200 bg-white p-6"
              >
                <h2 className="text-lg font-semibold text-neutral-900">
                  Passenger {index + 1} · Seat{" "}
                  {seat.seatNumber !== undefined
                    ? seatLabel(seat.seatNumber)
                    : ""}
                </h2>

                <label className="mt-4 block">
                  <span className="mb-2 block text-sm text-neutral-600">
                    Full name
                  </span>
                  <input
                    value={getName(seat.id, index)}
                    onChange={(e) =>
                      setNames((prev) => ({
                        ...prev,
                        [seat.id]: e.target.value,
                      }))
                    }
                    className={fieldClass}
                    autoComplete="name"
                  />
                  {seatError && (
                    <span className="mt-1 block text-sm text-red-600">
                      {seatError}
                    </span>
                  )}
                </label>
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
              disabled={savingPhone}
              className="rounded-xl bg-yellow-400 px-8 py-3 text-base font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
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

"use client";

import Link from "next/link";
import { useState } from "react";

const MAX_SEATS = 6;

type Seat = { id: string; seatNumber: number; available: boolean };

export function SeatPicker({
  scheduleId,
  seats,
  fare,
}: {
  scheduleId: string;
  seats: Seat[];
  fare: number;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  function toggle(seat: Seat) {
    if (!seat.available) return;
    setSelected((current) => {
      if (current.includes(seat.id)) {
        return current.filter((id) => id !== seat.id);
      }
      if (current.length >= MAX_SEATS) return current;
      return [...current, seat.id];
    });
  }

  const selectedSeats = seats
    .filter((s) => selected.includes(s.id))
    .sort((a, b) => a.seatNumber - b.seatNumber);
  const total = selectedSeats.length * fare;

  // 2 + 2 layout: 4 seats per row with an aisle after the second seat.
  const rows: Seat[][] = [];
  for (let i = 0; i < seats.length; i += 4) {
    rows.push(seats.slice(i, i + 4));
  }

  function seatClass(seat: Seat) {
    if (!seat.available) {
      return "cursor-not-allowed bg-neutral-200 text-neutral-400 line-through";
    }
    if (selected.includes(seat.id)) {
      return "bg-yellow-400 text-black border-yellow-400";
    }
    return "bg-white text-neutral-900 border-neutral-300 hover:border-yellow-400";
  }

  function renderSeat(seat: Seat | undefined, key: string) {
    if (!seat) return <div key={key} className="h-12 w-12" />;
    return (
      <button
        key={seat.id}
        type="button"
        disabled={!seat.available}
        onClick={() => toggle(seat)}
        className={`h-12 w-12 rounded-lg border text-sm font-semibold transition ${seatClass(seat)}`}
      >
        {seat.seatNumber}
      </button>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* Seat map */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-8">
        <div className="mb-6 flex flex-wrap gap-6 text-sm text-neutral-600">
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded border border-neutral-300 bg-white" />
            Available
          </span>
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-yellow-400" />
            Selected
          </span>
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 rounded bg-neutral-200" />
            Unavailable
          </span>
        </div>

        <div className="mx-auto w-fit space-y-3">
          <p className="mb-4 text-center text-xs font-semibold tracking-widest text-neutral-400 uppercase">
            Front of bus
          </p>
          {rows.map((row, i) => (
            <div key={i} className="flex items-center gap-3">
              {renderSeat(row[0], `${i}-0`)}
              {renderSeat(row[1], `${i}-1`)}
              <div className="w-8" />
              {renderSeat(row[2], `${i}-2`)}
              {renderSeat(row[3], `${i}-3`)}
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Your seats</h2>

        {selectedSeats.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-500">
            Pick up to {MAX_SEATS} seats from the map.
          </p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedSeats.map((seat) => (
                <span
                  key={seat.id}
                  className="rounded-lg bg-yellow-400 px-3 py-1 text-sm font-bold text-black"
                >
                  {seat.seatNumber}
                </span>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-neutral-200 pt-4">
              <span className="text-neutral-600">
                {selectedSeats.length} × ₱{fare.toLocaleString("en-PH")}
              </span>
              <span className="text-2xl font-bold text-neutral-900">
                ₱{total.toLocaleString("en-PH")}
              </span>
            </div>
          </>
        )}

        {selectedSeats.length === 0 ? (
          <button
            type="button"
            disabled
            className="mt-6 w-full cursor-not-allowed rounded-xl bg-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-500"
          >
            Continue
          </button>
        ) : (
          <Link
            href={`/trips/${scheduleId}/booking?seats=${selected.join(",")}`}
            className="mt-6 block w-full rounded-xl bg-yellow-400 px-6 py-3 text-center text-sm font-semibold text-black transition hover:bg-yellow-300"
          >
            Continue
          </Link>
        )}
      </aside>
    </div>
  );
}
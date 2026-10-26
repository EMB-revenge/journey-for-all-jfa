import Link from "next/link";

import { formatDuration, formatTime } from "~/app/_lib/format";

export type TripResult = {
  id: string;
  busName: string;
  busType: string;
  departureTime: Date;
  arrivalTime: Date;
  durationMinutes: number;
  fare: number;
  availableSeats: number;
};

function busTypeLabel(value: string): string {
  if (value === "AIRCON") return "Aircon";
  if (value === "ORDINARY") return "Ordinary / non-aircon";
  return value;
}

export function TripCard({
  trip,
  seatMapHref,
}: {
  trip: TripResult;
  seatMapHref: string;
}) {
  const soldOut = trip.availableSeats === 0;

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-neutral-200 bg-white p-6 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm font-semibold text-neutral-500">
          {trip.busName} · {busTypeLabel(trip.busType)}
        </p>
        <div className="mt-2 flex items-center gap-4">
          <p className="text-2xl font-bold text-neutral-900">
            {formatTime(trip.departureTime)}
          </p>
          <div className="text-center text-sm text-neutral-400">
            <p>{formatDuration(trip.durationMinutes)}</p>
            <div className="my-1 h-0.5 w-16 bg-yellow-400" />
          </div>
          <p className="text-2xl font-bold text-neutral-900">
            {formatTime(trip.arrivalTime)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-8 md:text-right">
        <div>
          <p className="text-2xl font-bold text-neutral-900">
            ₱{trip.fare.toLocaleString("en-PH")}
          </p>
          <p
            className={`text-sm ${
              soldOut ? "text-red-600" : "text-neutral-500"
            }`}
          >
            {soldOut ? "Sold out" : `${trip.availableSeats} seats left`}
          </p>
        </div>

        {soldOut ? (
          <span className="rounded-xl bg-neutral-200 px-6 py-3 text-sm font-semibold text-neutral-500">
            Unavailable
          </span>
        ) : (
          <Link
            href={seatMapHref}
            className="group inline-flex items-center gap-2 rounded-xl bg-yellow-400 px-6 py-3 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-yellow-300 hover:shadow-md focus:ring-2 focus:ring-yellow-400/60 focus:outline-none active:translate-y-0"
          >
            Select seat
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
}

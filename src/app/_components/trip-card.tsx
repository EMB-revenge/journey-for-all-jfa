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

export function TripCard({ trip }: { trip: TripResult }) {
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
          // Seat picking lands with Phase 5; until then the card is read-only.
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-xl bg-yellow-400/50 px-6 py-3 text-sm font-semibold text-black"
          >
            Select seat
          </button>
        )}
      </div>
    </div>
  );
}

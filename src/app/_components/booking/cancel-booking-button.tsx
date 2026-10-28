"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "~/trpc/react";

/**
 * Two-step cancel: the first click only asks, so one misclick cannot cancel
 * a trip. The server re-checks everything (owner, status, departure).
 */
export function CancelBookingButton({
  bookingId,
  reference,
}: {
  bookingId: string;
  reference: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  const cancel = api.cancellation.cancel.useMutation({
    onSuccess: () => {
      setConfirming(false);
      router.refresh();
    },
  });

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => {
          cancel.reset();
          setConfirming(true);
        }}
        className="rounded-xl border border-red-300 px-5 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
      >
        Cancel booking
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-semibold text-red-800">
        Cancel booking {reference}?
      </p>
      <p className="mt-1 text-sm text-red-700">
        Your seats are released right away and this cannot be undone.
      </p>

      {cancel.error && (
        <p className="mt-3 text-sm font-semibold text-red-800">
          {cancel.error.message || "Could not cancel this booking."}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => cancel.mutate({ id: bookingId })}
          disabled={cancel.isPending}
          className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cancel.isPending ? "Cancelling..." : "Yes, cancel booking"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={cancel.isPending}
          className="rounded-xl border border-neutral-300 bg-white px-5 py-2 text-sm font-semibold text-neutral-900 transition hover:border-yellow-400"
        >
          Keep booking
        </button>
      </div>
    </div>
  );
}
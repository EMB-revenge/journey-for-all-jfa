"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "~/context/AuthContext";
import { api } from "~/trpc/react";

/**
 * The server mutation is the gate; this only decides whether the button is
 * worth showing. A passenger who crafts the request gets FORBIDDEN.
 */
export function CheckInButton({ code }: { code: string }) {
  const router = useRouter();
  const { session, isPending } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const { mutate, isPending: isCheckingIn } = api.booking.checkIn.useMutation({
    onSuccess: () => router.refresh(),
    onError: (mutationError) => setError(mutationError.message),
  });

  if (isPending) return null;

  if (session?.user.role !== "ADMIN") {
    return session ? null : (
      <div className="mt-4 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-center">
        <Link
          href={`/login?redirectTo=${encodeURIComponent(`/verify/${code}`)}`}
          className="text-sm font-semibold text-neutral-700 underline decoration-neutral-300 underline-offset-4"
        >
          Staff sign in to check this ticket in
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={() => {
          setError(null);
          mutate({ code });
        }}
        disabled={isCheckingIn}
        className="w-full rounded-xl bg-yellow-400 px-6 py-3 text-base font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
      >
        {isCheckingIn ? "Checking in..." : "Mark boarded"}
      </button>
      {error && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}

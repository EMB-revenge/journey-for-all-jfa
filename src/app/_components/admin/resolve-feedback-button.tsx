"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "~/trpc/react";

export function ResolveFeedbackButton({ id }: { id: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const resolve = api.admin.feedback.resolve.useMutation({
    onSuccess: () => router.refresh(),
    onError: (mutationError) => setError(mutationError.message),
  });

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          resolve.mutate({ id });
        }}
        disabled={resolve.isPending}
        className="rounded-xl bg-yellow-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {resolve.isPending ? "Saving..." : "Mark handled"}
      </button>
      {error && (
        <p
          role="alert"
          className="mt-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </>
  );
}

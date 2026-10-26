"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { fieldErrors, profileSchema } from "~/lib/schemas";
import { authClient } from "~/server/better-auth/client";

const fieldClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/40 focus:outline-none";

/** Name and phone live on the account, so bookings never have to ask. */
export function ProfileForm({
  email,
  initialName,
  initialPhone,
}: {
  email: string;
  initialName: string;
  initialPhone: string;
}) {
  const router = useRouter();

  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);

    const parsed = profileSchema.safeParse({ name, phone });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);

    const { error } = await authClient.updateUser({
      name: parsed.data.name,
      phone: parsed.data.phone,
    });
    setSubmitting(false);
    if (error) {
      setFormError(error.message ?? "Could not save your details.");
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <div className="w-full rounded-3xl border border-neutral-200 bg-white p-8">
      <h1 className="text-2xl font-bold text-neutral-900">Your details</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Trips you book use this name and number.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {formError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </p>
        )}
        {saved && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Saved.
          </p>
        )}

        <label className="block">
          <span className="mb-2 block text-sm text-neutral-600">Full name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={fieldClass}
            autoComplete="name"
          />
          {errors.name && (
            <span className="mt-1 block text-sm text-red-600">
              {errors.name}
            </span>
          )}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-neutral-600">Email</span>
          <input
            type="email"
            value={email}
            readOnly
            className={`${fieldClass} bg-neutral-100 text-neutral-500`}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-neutral-600">
            Mobile number
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={fieldClass}
            autoComplete="tel"
          />
          {errors.phone && (
            <span className="mt-1 block text-sm text-red-600">
              {errors.phone}
            </span>
          )}
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-yellow-400 px-6 py-3 text-base font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Save changes"}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap gap-4 border-t border-neutral-200 pt-6 text-sm">
        <Link
          href="/my-bookings"
          className="font-semibold text-neutral-900 underline decoration-neutral-300 underline-offset-4"
        >
          My bookings
        </Link>
        <Link
          href="/change-password"
          className="font-semibold text-neutral-900 underline decoration-neutral-300 underline-offset-4"
        >
          Change password
        </Link>
      </div>
    </div>
  );
}

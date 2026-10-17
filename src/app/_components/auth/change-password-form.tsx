"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { changePasswordSchema, fieldErrors } from "~/lib/schemas";
import { authClient } from "~/server/better-auth/client";

const fieldClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/40 focus:outline-none";

export function ChangePasswordForm() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const parsed = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);

    const { error } = await authClient.changePassword({
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
      revokeOtherSessions: true,
    });
    if (error) {
      setFormError(error.message ?? "Could not change the password.");
      setSubmitting(false);
      return;
    }

    // Changing the password kills other sessions; sign this one out too.
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="w-full rounded-3xl border border-neutral-200 bg-white p-8">
      <h1 className="text-2xl font-bold text-neutral-900">Change password</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Every other device gets signed out. You will sign in again here.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {formError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
          </p>
        )}

        <label className="block">
          <span className="mb-2 block text-sm text-neutral-600">
            Current password
          </span>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={fieldClass}
            autoComplete="current-password"
          />
          {errors.currentPassword && (
            <span className="mt-1 block text-sm text-red-600">
              {errors.currentPassword}
            </span>
          )}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-neutral-600">
            New password
          </span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={fieldClass}
            autoComplete="new-password"
          />
          {errors.newPassword ? (
            <span className="mt-1 block text-sm text-red-600">
              {errors.newPassword}
            </span>
          ) : (
            <span className="mt-1 block text-sm text-neutral-500">
              At least 8 characters.
            </span>
          )}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-neutral-600">
            Confirm new password
          </span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={fieldClass}
            autoComplete="new-password"
          />
          {errors.confirmPassword && (
            <span className="mt-1 block text-sm text-red-600">
              {errors.confirmPassword}
            </span>
          )}
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-yellow-400 px-6 py-3 text-base font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Saving..." : "Change password"}
        </button>
      </form>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { fieldErrors, registerSchema } from "~/lib/schemas";
import { authClient } from "~/server/better-auth/client";

const fieldClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/40 focus:outline-none";

export function RegisterForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);

    const parsed = registerSchema.safeParse({
      name,
      email,
      phone,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSubmitting(true);

    const { error } = await authClient.signUp.email({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      password: parsed.data.password,
    });
    if (error) {
      setFormError(
        error.message ?? "Could not create the account. Try another email.",
      );
      setSubmitting(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="w-full rounded-3xl border border-neutral-200 bg-white p-8">
      <h1 className="text-2xl font-bold text-neutral-900">Create account</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Book trips and keep every ticket in one place.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {formError && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {formError}
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
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
            autoComplete="email"
          />
          {errors.email && (
            <span className="mt-1 block text-sm text-red-600">
              {errors.email}
            </span>
          )}
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
          {errors.phone ? (
            <span className="mt-1 block text-sm text-red-600">
              {errors.phone}
            </span>
          ) : (
            <span className="mt-1 block text-sm text-neutral-500">
              Your tickets use this number. You can change it later.
            </span>
          )}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-neutral-600">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
            autoComplete="new-password"
          />
          {errors.password ? (
            <span className="mt-1 block text-sm text-red-600">
              {errors.password}
            </span>
          ) : (
            <span className="mt-1 block text-sm text-neutral-500">
              At least 8 characters.
            </span>
          )}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-neutral-600">
            Confirm password
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
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-neutral-900">
          Sign in
        </Link>
      </p>
    </div>
  );
}

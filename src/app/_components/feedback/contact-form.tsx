"use client";

import { useState } from "react";

import { feedbackSchema, fieldErrors } from "~/lib/schemas";
import { api } from "~/trpc/react";

const fieldClass =
  "w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/40 focus:outline-none";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const send = api.feedback.send.useMutation({
    onSuccess: () => {
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
      setErrors({});
    },
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = feedbackSchema.safeParse({ name, email, message });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    send.mutate(parsed.data);
  }

  if (sent) {
    return (
      <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6">
        <p className="font-semibold text-green-900">Ticket sent</p>
        <p className="mt-1 text-sm text-green-800">
          The team replies to the email you gave, so check that inbox.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-4 rounded-xl border border-neutral-300 bg-white px-5 py-2 text-sm font-semibold text-neutral-900 transition hover:border-yellow-400"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      {send.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {send.error.message || "Could not send your ticket. Try again."}
        </p>
      )}

      <label className="block">
        <span className="mb-2 block text-sm text-neutral-600">Your name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={fieldClass}
          autoComplete="name"
        />
        {errors.name && (
          <span className="mt-1 block text-sm text-red-600">{errors.name}</span>
        )}
      </label>

      <label className="block">
        <span className="mb-2 block text-sm text-neutral-600">
          Email we can reply to
        </span>
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
        <span className="mb-2 block text-sm text-neutral-600">Message</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          className={fieldClass}
          placeholder="What happened, and which booking or trip is it about?"
        />
        {errors.message && (
          <span className="mt-1 block text-sm text-red-600">
            {errors.message}
          </span>
        )}
      </label>

      <button
        type="submit"
        disabled={send.isPending}
        className="w-full rounded-xl bg-yellow-400 px-6 py-3 text-base font-semibold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {send.isPending ? "Sending..." : "Send ticket"}
      </button>
    </form>
  );
}

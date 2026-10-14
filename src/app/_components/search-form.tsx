"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "~/trpc/react";

export function SearchForm() {
  const router = useRouter();
  const { data: cities, isLoading } = api.city.list.useQuery();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");

  const today = new Date().toLocaleDateString("en-CA");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams({ from, to, date });
    router.push(`/search?${params.toString()}`);
  }

  const fieldClass =
    "w-full rounded-xl border border-neutral-300 bg-white px-4 py-4 text-base text-neutral-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/40 focus:outline-none";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-2xl"
    >
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_0.7fr_auto] md:items-end">
        <label className="block">
          <span className="mb-2 block text-sm text-neutral-600">From</span>
          <select
            className={fieldClass}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            disabled={isLoading}
            required
          >
            <option value="" disabled>
              {isLoading ? "Loading cities..." : "Select departure city"}
            </option>
            {cities?.map((city) => (
              <option key={city.id} value={city.id} disabled={city.id === to}>
                {city.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-neutral-600">To</span>
          <select
            className={fieldClass}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={isLoading}
            required
          >
            <option value="" disabled>
              {isLoading ? "Loading cities..." : "Select destination city"}
            </option>
            {cities?.map((city) => (
              <option
                key={city.id}
                value={city.id}
                disabled={city.id === from}
              >
                {city.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-neutral-600">
            Travel date
          </span>
          <input
            type="date"
            className={fieldClass}
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <button
          type="submit"
          className="rounded-xl bg-yellow-400 px-8 py-4 text-base font-semibold text-black transition hover:bg-yellow-300"
        >
          Search trips
        </button>
      </div>
    </form>
  );
}
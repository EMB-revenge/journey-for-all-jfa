"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Temporary list
const cities = ["Bacolod", "Cebu", "Dumaguete", "Iloilo", "Tagbilaran"];

const popularRoutes = [
  { from: "Cebu", to: "Bacolod" },
  { from: "Cebu", to: "Iloilo" },
];

export function SearchForm() {
  const router = useRouter();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");

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
            required
          >
            <option value="" disabled>
              Select departure city
            </option>
            {cities.map((city) => (
              <option key={city} value={city} disabled={city === to}>
                {city}
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
            required
          >
            <option value="" disabled>
              Select destination city
            </option>
            {cities.map((city) => (
              <option key={city} value={city} disabled={city === from}>
                {city}
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

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
        <span className="text-neutral-500">Popular routes:</span>
        {popularRoutes.map((route) => (
          <button
            key={`${route.from}-${route.to}`}
            type="button"
            onClick={() => {
              setFrom(route.from);
              setTo(route.to);
            }}
            className="font-medium text-neutral-900 underline decoration-yellow-400 decoration-2 underline-offset-4 transition hover:text-neutral-600"
          >
            {route.from} → {route.to}
          </button>
        ))}
      </div>
    </form>
  );
}
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "~/trpc/react";
import { fieldErrors, searchTripsSchema } from "~/lib/schemas";
import { todayInManila } from "~/lib/dates";

export function SearchForm() {
  const router = useRouter();
  const { data: cities, isLoading } = api.city.list.useQuery();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [passengers, setPassengers] = useState("1");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = todayInManila();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const parsed = searchTripsSchema.safeParse({
      originCityId: from,
      destCityId: to,
      date,
      passengers,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});

    const params = new URLSearchParams({
      from: parsed.data.originCityId,
      to: parsed.data.destCityId,
      date: parsed.data.date,
      passengers: String(parsed.data.passengers),
    });
    router.push(`/search?${params.toString()}`);
  }

  const fieldClass =
    "w-full rounded-xl border border-neutral-300 bg-white px-4 py-4 text-base text-neutral-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/40 focus:outline-none";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-2xl"
      noValidate
    >
      <div className="grid gap-4 md:grid-cols-2 md:items-end lg:grid-cols-[1fr_1fr_0.7fr_0.5fr_auto]">
        <label className="block">
          <span className="mb-2 block text-sm text-neutral-600">From</span>
          <select
            className={fieldClass}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            disabled={isLoading}
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
          {errors.originCityId && (
            <span className="mt-1 block text-sm text-red-600">
              {errors.originCityId}
            </span>
          )}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-neutral-600">To</span>
          <select
            className={fieldClass}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            disabled={isLoading}
          >
            <option value="" disabled>
              {isLoading ? "Loading cities..." : "Select destination city"}
            </option>
            {cities?.map((city) => (
              <option key={city.id} value={city.id} disabled={city.id === from}>
                {city.name}
              </option>
            ))}
          </select>
          {errors.destCityId && (
            <span className="mt-1 block text-sm text-red-600">
              {errors.destCityId}
            </span>
          )}
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
          />
          {errors.date && (
            <span className="mt-1 block text-sm text-red-600">
              {errors.date}
            </span>
          )}
        </label>

        <label className="block">
          <span className="mb-2 block text-sm text-neutral-600">
            Passengers
          </span>
          <select
            className={fieldClass}
            value={passengers}
            onChange={(e) => setPassengers(e.target.value)}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          {errors.passengers && (
            <span className="mt-1 block text-sm text-red-600">
              {errors.passengers}
            </span>
          )}
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

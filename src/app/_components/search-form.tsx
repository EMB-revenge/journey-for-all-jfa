"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { CustomSelect } from "~/app/_components/custom-select";
import { api } from "~/trpc/react";
import { fieldErrors, searchTripsSchema } from "~/lib/schemas";
import { todayInManila } from "~/lib/dates";

type SearchFormProps = {
  initialFrom?: string;
  initialTo?: string;
  initialDate?: string;
  initialPassengers?: string;
};

/** Every field gets this slot, so an error message never shifts the layout. */
function FieldMessage({ children }: { children?: string }) {
  return (
    <span className="mt-1 block min-h-5 text-sm text-red-600">
      {children ?? ""}
    </span>
  );
}

export function SearchForm({
  initialFrom = "",
  initialTo = "",
  initialDate = "",
  initialPassengers = "1",
}: SearchFormProps) {
  const router = useRouter();
  const { data: cities, isLoading } = api.city.list.useQuery();
  const [isPending, startTransition] = useTransition();

  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [date, setDate] = useState(initialDate);
  const [passengers, setPassengers] = useState(initialPassengers);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // shortcut: state seeds once on mount. Back/forward through old searches can
  // show stale fields; give the form a key if that needs to sync with the URL.

  const today = todayInManila();

  const cityOptions = (cities ?? []).map((city) => ({
    value: city.id,
    label: city.name,
  }));
  const fromOptions = cityOptions.map((o) => ({
    ...o,
    disabled: o.value === to,
  }));
  const toOptions = cityOptions.map((o) => ({
    ...o,
    disabled: o.value === from,
  }));

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
    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  }

  const fieldClass =
    "block w-full min-w-0 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/40 focus:outline-none sm:py-4";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-2xl sm:p-8"
      noValidate
    >
      <div className="grid gap-x-4 gap-y-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_0.7fr_0.5fr_auto]">
        <label className="block min-w-0">
          <span className="mb-2 block text-sm text-stone-600">From</span>
          <CustomSelect
            options={isLoading ? [] : fromOptions}
            value={from}
            onChange={(v) => setFrom(v)}
            placeholder={
              isLoading ? "Loading cities..." : "Select departure city"
            }
            disabled={isLoading}
          />
          <FieldMessage>{errors.originCityId}</FieldMessage>
        </label>

        <label className="block min-w-0">
          <span className="mb-2 block text-sm text-stone-600">To</span>
          <CustomSelect
            options={isLoading ? [] : toOptions}
            value={to}
            onChange={(v) => setTo(v)}
            placeholder={
              isLoading ? "Loading cities..." : "Select destination city"
            }
            disabled={isLoading}
          />
          <FieldMessage>{errors.destCityId}</FieldMessage>
        </label>

        <label className="block min-w-0">
          <span className="mb-2 block text-sm text-stone-600">Travel date</span>
          <input
            type="date"
            className={fieldClass}
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
          />
          <FieldMessage>{errors.date}</FieldMessage>
        </label>

        <label className="block min-w-0">
          <span className="mb-2 block text-sm text-stone-600">Passengers</span>
          <CustomSelect
            options={[1, 2, 3, 4, 5, 6].map((n) => ({
              value: String(n),
              label: String(n),
            }))}
            value={passengers}
            onChange={(v) => setPassengers(v)}
            placeholder="1"
          />
          <FieldMessage>{errors.passengers}</FieldMessage>
        </label>

        {/* mt-7 mirrors the 20px label plus its 8px bottom margin, so the
            button tops out at the same line as the other inputs. */}
        <div className="mt-7 md:col-span-2 lg:col-span-1">
          <button
            type="submit"
            disabled={isPending}
            className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-yellow-400 px-8 py-3 text-base font-semibold text-black transition hover:-translate-y-0.5 hover:bg-yellow-300 hover:shadow-lg lg:w-auto disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-stone-200 disabled:text-stone-500 disabled:opacity-60 disabled:shadow-none sm:py-4"
          >
            {isPending && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
            )}
            {isPending ? "Searching..." : "Search trips"}
            {/* Direction cue: appears only on hover. */}
            <span
              aria-hidden
              className="transition-transform duration-150 [display:none] group-hover:inline group-hover:translate-x-0.5"
            >
              →
            </span>
          </button>
          <div className="h-6" />
        </div>
      </div>
    </form>
  );
}

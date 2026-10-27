import { formatDuration } from "~/app/_lib/format";

/**
 * Static board content for the five seeded Panay cities. Durations and fares
 * mirror the one-way Iloilo figures in prisma/seed.ts ROUTES; the cities'
 * facts are real, so a change here must be checked against both.
 */
const HUB = {
  city: "Iloilo City",
  province: "Iloilo",
  fact: "The hub. Direct routes to Roxas City, Kalibo, San Jose de Buenavista, and Passi City. UNESCO Creative City of Gastronomy.",
};

const DESTINATIONS = [
  {
    city: "Passi City",
    province: "Iloilo",
    minutesFromHub: 90,
    fareFromHub: 120,
    fact: "The Sweet City in the Heart of Panay, known for its pineapple and sugar fields.",
  },
  {
    city: "Roxas City",
    province: "Capiz",
    minutesFromHub: 150,
    fareFromHub: 260,
    fact: "The seafood capital of the Philippines, beside the Panay River.",
  },
  {
    city: "San Jose de Buenavista",
    province: "Antique",
    minutesFromHub: 240,
    fareFromHub: 350,
    fact: "Capital of Antique, on Panay's west coast facing the Sulu Sea.",
  },
  {
    city: "Kalibo",
    province: "Aklan",
    minutesFromHub: 240,
    fareFromHub: 380,
    fact: "Gateway to Boracay through the Caticlan jetty port, and home of the Ati-Atihan festival.",
  },
] as const;

const fare = (peso: number) =>
  peso.toLocaleString("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 0 });

function BoardRow({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid gap-x-6 gap-y-2 border-t border-white/10 py-6 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-x-10 ${className}`}
    >
      {children}
    </div>
  );
}

export function Locations() {
  return (
    <section id="locations" className="bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.25em] text-yellow-400 uppercase sm:text-sm">
          Locations
        </p>
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
          Where JFA Transit runs
        </h2>
        <p className="mt-4 max-w-xl text-base text-white/70 sm:text-lg">
          Five cities across Panay Island. One hub, four destinations. Times and
          fares below are the one-way figures from Iloilo City.
        </p>

        <div className="mt-12 border-b border-white/10">
          {/* Hub row: the yellow name marks where every route starts. */}
          <BoardRow>
            <span className="rounded-md bg-yellow-400 px-2 py-1 text-xs font-bold text-black">
              HUB
            </span>
            <div>
              <h3 className="text-xl font-semibold text-yellow-400 sm:text-2xl">
                {HUB.city}
              </h3>
              <p className="mt-1 max-w-xl text-sm text-white/60">
                {HUB.fact}
              </p>
            </div>
            <p className="text-sm text-white/50">
              <span className="font-semibold text-white">4 routes</span> running
              from the hub
            </p>
          </BoardRow>

          {DESTINATIONS.map(({ city, province, minutesFromHub, fareFromHub, fact }, i) => (
            <BoardRow key={city}>
              <span className="font-mono text-xs text-white/40">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-xl font-semibold sm:text-2xl">
                  {city} <span className="text-white/50">, {province}</span>
                </h3>
                <p className="mt-1 max-w-xl text-sm text-white/60">{fact}</p>
              </div>
              <div className="text-right sm:min-w-24">
                <p className="font-semibold tabular-nums">
                  {formatDuration(minutesFromHub)}
                </p>
                <p className="mt-0.5 text-sm tabular-nums text-white/60">
                  from {fare(fareFromHub)}
                </p>
              </div>
            </BoardRow>
          ))}
        </div>
      </div>
    </section>
  );
}

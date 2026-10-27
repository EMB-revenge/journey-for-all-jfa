import Image, { type StaticImageData } from "next/image";
import { formatDuration } from "~/app/_lib/format";

import bakhawanBoardwalk from "~/assets/locations/bakhawan-boardwalk.jpg";
import moloChurch from "~/assets/locations/molo-church.jpg";
import passiStreet from "~/assets/locations/passi-street.jpg";
import roxasBandstand from "~/assets/locations/roxas-bandstand.jpg";
import sanJoseCoast from "~/assets/locations/san-jose-coast.jpg";

/**
 * Static board content for the five seeded Panay cities. Durations and fares
 * mirror the one-way Iloilo figures in prisma/seed.ts ROUTES; the cities'
 * facts are real, so a change here must be checked against both. Photos are
 * CC BY-SA files from Wikimedia Commons, credited under the grid.
 */
type City = {
  name: string;
  province: string;
  isHub?: boolean;
  /** One-way figures from Iloilo City, per the seed routes. */
  minutesFromHub?: number;
  fareFromHub?: number;
  fact: string;
  photo: StaticImageData;
  alt: string;
};

const CITIES: City[] = [
  {
    name: "Iloilo City",
    province: "Iloilo",
    isHub: true,
    fact: "The hub. Direct routes to Roxas City, Kalibo, San Jose de Buenavista, and Passi City. UNESCO Creative City of Gastronomy.",
    photo: moloChurch,
    alt: "Molo Church in Iloilo City, a white stone church with two red-spired towers under a blue sky",
  },
  {
    name: "Passi City",
    province: "Iloilo",
    minutesFromHub: 90,
    fareFromHub: 120,
    fact: "The Sweet City in the Heart of Panay, known for its pineapple and sugar fields.",
    photo: passiStreet,
    alt: "Passi City street with yellow tricycles and the town's low buildings on a sunny day",
  },
  {
    name: "Roxas City",
    province: "Capiz",
    minutesFromHub: 150,
    fareFromHub: 260,
    fact: "The seafood capital of the Philippines, beside the Panay River.",
    photo: roxasBandstand,
    alt: "The Roxas City plaza bandstand with the painted Roxas city sign behind motorcycles",
  },
  {
    name: "San Jose de Buenavista",
    province: "Antique",
    minutesFromHub: 240,
    fareFromHub: 350,
    fact: "Capital of Antique, on Panay's west coast facing the Sulu Sea.",
    photo: sanJoseCoast,
    alt: "Fishing boats moored on the coast at San Jose de Buenavista with mountains behind",
  },
  {
    name: "Kalibo",
    province: "Aklan",
    minutesFromHub: 240,
    fareFromHub: 380,
    fact: "Gateway to Boracay through the Caticlan jetty port, and home of the Ati-Atihan festival.",
    photo: bakhawanBoardwalk,
    alt: "Bamboo boardwalk through the Bakhawan Eco-park mangroves in Kalibo",
  },
];

const fare = (peso: number) =>
  peso.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
  });

export function Locations() {
  return (
    <section id="locations">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <p className="mb-3 text-xs font-semibold tracking-[0.25em] text-ochre uppercase sm:text-sm">
          Locations
        </p>
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-ink sm:text-5xl">
          Where JFA Transit runs
        </h2>
        <p className="mt-4 max-w-xl text-base text-stone-600 sm:text-lg">
          Five cities across Panay Island. One hub, four destinations. Times
          and fares below are the one-way figures from Iloilo City.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CITIES.map(({ name, province, isHub, minutesFromHub, fareFromHub, fact, photo, alt }) => (
            // Hub City sits on top spanned so the two columns read as one board.
            <article
              key={name}
              className={`overflow-hidden rounded-3xl border border-stone-200 bg-white ${
                isHub ? "sm:col-span-2" : ""
              }`}
            >
              <Image
                src={photo}
                alt={alt}
                className="h-52 w-full object-cover sm:h-56"
              />
              <div className="p-6">
                <h3 className="text-xl font-semibold text-ink sm:text-2xl">
                  {name}{" "}
                  <span className="text-sm font-normal text-stone-400 sm:text-base">
                    , {province}
                  </span>
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600 sm:text-base">
                  {fact}
                </p>
                <p className="mt-5 flex items-baseline justify-between border-t border-stone-100 pt-4 text-sm">
                  <span className="text-stone-500">
                    {isHub ? "All routes start here" : "From Iloilo City"}
                  </span>
                  {isHub ? (
                    <span className="font-semibold text-ink">4 direct routes</span>
                  ) : (
                    <span className="font-semibold tabular-nums text-ink">
                      {formatDuration(minutesFromHub ?? 0)}
                      <span className="font-normal text-stone-500">
                        {" "}
                        · from {fare(fareFromHub ?? 0)}
                      </span>
                    </span>
                  )}
                </p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-4 text-xs text-stone-400">
          Photos: Wikimedia Commons, CC BY-SA 3.0/4.0.
        </p>
      </div>
    </section>
  );
}

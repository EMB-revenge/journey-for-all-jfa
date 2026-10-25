import Image from "next/image";

import { Navbar } from "~/app/_components/navbar";
import { SearchForm } from "~/app/_components/search-form";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero with background image */}
        <section className="relative overflow-hidden bg-neutral-900">
          <Image
            src="/hero.jpg"
            alt=""
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />

          <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-40 sm:px-6 sm:pt-24 sm:pb-44">
            <p className="mb-4 text-xs font-semibold tracking-[0.25em] text-yellow-400 uppercase sm:mb-6 sm:text-sm">
              Book your bus in minutes
            </p>
            <h1 className="max-w-3xl text-4xl leading-[1.1] font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
              Pick a city. Pick a seat. Go.
            </h1>
            <p className="mt-6 max-w-xl text-base text-white/80 sm:mt-8 sm:text-xl">
              Search trips between cities, reserve your exact seat, and get your
              digital ticket right away.
            </p>
          </div>
        </section>

        <div className="relative z-10 mx-auto -mt-28 max-w-7xl px-4 pb-16 sm:px-6">
          <SearchForm />
        </div>
      </main>
    </>
  );
}
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

          <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-44">
            <p className="mb-6 text-sm font-semibold tracking-[0.25em] text-yellow-400 uppercase">
              Book your bus in minutes
            </p>
            <h1 className="max-w-3xl text-6xl leading-[1.05] font-bold tracking-tight text-white md:text-7xl">
              Pick a city. Pick a seat. Go.
            </h1>
            <p className="mt-8 max-w-xl text-xl text-white/80">
              Search trips between cities, reserve your exact seat, and get your
              digital ticket right away.
            </p>
          </div>
        </section>

        <div className="relative z-10 mx-auto -mt-28 max-w-7xl px-6">
          <SearchForm />
        </div>
      </main>
    </>
  );
}

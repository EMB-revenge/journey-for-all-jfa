import Image from "next/image";

import { Navbar } from "~/app/_components/navbar";
import { SearchForm } from "~/app/_components/search-form";
import { Locations } from "~/app/_components/locations";
import { Faq } from "~/app/_components/faq";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero with background image. The gradient scrims the side the text
            sits on and lets the bus read on the right; a flat overlay would
            gray out the whole shot again. */}
        <section className="relative overflow-hidden bg-neutral-950">
          <Image
            src="/hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover max-md:object-[68%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/95 via-neutral-950/60 to-neutral-950/20" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white to-transparent sm:h-48" />

          <div className="relative mx-auto max-w-7xl px-4 pt-14 pb-40 sm:px-6 sm:pt-24 sm:pb-44">
            <p className="mb-4 text-xs font-semibold tracking-[0.25em] text-yellow-400 uppercase sm:mb-6 sm:text-sm">
              Book your bus in minutes
            </p>
            <h1 className="max-w-3xl text-4xl leading-[1.1] font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
              Pick a city. Pick a seat. Go.
            </h1>
            <p className="mt-6 max-w-xl text-base text-white sm:mt-8 sm:text-xl">
              Search trips between cities, reserve your exact seat, and get your
              digital ticket right away.
            </p>
          </div>
        </section>

        <div className="relative z-10 mx-auto -mt-28 max-w-7xl px-4 pb-16 sm:px-6">
          <SearchForm />
        </div>

        <Locations />
        <Faq />
      </main>
    </>
  );
}
import Image from "next/image";

import { Navbar } from "~/app/_components/navbar";
import { SearchForm } from "~/app/_components/search-form";

const steps = [
  {
    number: "01",
    title: "Search",
    text: "Choose your departure city, destination, and travel date.",
  },
  {
    number: "02",
    title: "Pick your seat",
    text: "See which seats are open and select the one you want.",
  },
  {
    number: "03",
    title: "Get your ticket",
    text: "Confirm your booking and receive your digital ticket instantly.",
  },
];

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
              Search trips between cities, reserve your exact seat, and get
              your digital ticket right away.
            </p>
          </div>
        </section>

        
        <div className="relative z-10 mx-auto -mt-28 max-w-7xl px-6">
          <SearchForm />
        </div>

        {/* stepss*/}
        <section className="mx-auto max-w-7xl px-6 py-24">
          <h2 className="text-3xl font-bold text-neutral-900">How it works</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-neutral-200 p-8"
              >
                <span className="inline-block rounded-lg bg-yellow-400 px-3 py-1 text-sm font-bold text-black">
                  {step.number}
                </span>
                <h3 className="mt-4 text-xl font-semibold text-neutral-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-neutral-600">{step.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
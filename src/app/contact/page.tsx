import { type Metadata } from "next";

import { ContactForm } from "~/app/_components/feedback/contact-form";
import { Navbar } from "~/app/_components/navbar";

export const metadata: Metadata = { title: "Contact | JFA Transit" };

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <p className="text-sm font-semibold tracking-[0.25em] text-neutral-500 uppercase">
          Contact
        </p>
        <h1 className="mt-2 text-3xl font-bold text-neutral-900">
          Submit a ticket
        </h1>
        <p className="mt-2 text-neutral-600">
          Booking trouble or a question the FAQ did not answer? Send it here and
          the team replies to your email.
        </p>
        <ContactForm />
      </main>
    </>
  );
}

/**
 * FAQs answered from what the app actually does: booking confirm runs a
 * transaction that writes a CONFIRMED booking (see bookingRouter.confirm),
 * seats are held five minutes (HOLD_TTL_MS in holdRouter), and the ticket
 * page shows the QR and verification code. No cancel flow exists yet, so
 * that question answers honestly and points at the footer contacts.
 */

const POLICIES = [
  {
    question: "Do I need an account to book?",
    answer:
      "Searching trips is open to everyone. To confirm a booking and take the seats, you need to be signed in so your ticket lands in My bookings.",
  },
  {
    question: "How long are my seats held?",
    answer:
      "Five minutes from the moment you pick seats on the map. A countdown runs while you enter passenger names and review the summary. If it runs out, the seats go back on sale and you can pick again.",
  },
  {
    question: "When is my booking confirmed?",
    answer:
      "Right away. When you confirm, your booking reference is written immediately and your ticket opens with a QR code and a verification code you show at the terminal.",
  },
  {
    question: "Can I cancel or rebook?",
    answer:
      "Not in this version yet. If you booked a trip that no longer works for you, contact the team through the links in the footer and we will sort it out.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="grid gap-10 md:grid-cols-[1fr_2fr] md:gap-16">
        <div>
          <p className="mb-3 text-xs font-semibold tracking-[0.25em] text-ochre uppercase sm:text-sm">
            FAQ
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-5xl">
            Answers before you board
          </h2>
        </div>

        <div className="divide-y divide-stone-200 border-y border-stone-200">
          {POLICIES.map(({ question, answer }) => (
            <details key={question} className="group py-5">
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-base font-semibold text-ink marker:content-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ochre">
                {question}
                {/* Cross turns when the row opens. */}
                <span
                  aria-hidden
                  className="shrink-0 text-stone-400 transition-transform duration-150 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 sm:text-base">
                {answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * FAQs answered from what the app actually does: booking confirm runs a
 * transaction that writes a CONFIRMED booking (see bookingRouter.confirm),
 * seats are held five minutes (HOLD_TTL_MS in holdRouter), the ticket page
 * shows the QR and verification code, and a whole booking can be cancelled
 * from My bookings before departure (see cancellationRouter.cancel), which
 * releases its seats.
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
      "You can cancel a whole booking from My bookings any time before the bus departs, as long as the ticket has not been used to board. Your seats go back on sale right away. To travel on a different trip, cancel the booking, then search and book the new trip. A booking cannot be switched to another trip or date in place.",
  },
  {
    question: "How do I cancel a booking?",
    answer:
      "Open My bookings from the menu under your name, find the trip, and press Cancel booking, then confirm when asked. The ticket is marked cancelled and can no longer be used to board. This cannot be undone, and you cancel the whole booking, not a single seat. If the trip has already departed or the ticket was used to board, cancelling is not available, so contact the team through the links in the footer.",
  },
];

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="grid gap-10 md:grid-cols-[1fr_2fr] md:gap-16">
        <div>
          <p className="text-ochre mb-3 text-xs font-semibold tracking-[0.25em] uppercase sm:text-sm">
            FAQ
          </p>
          <h2 className="text-ink text-3xl font-bold tracking-tight sm:text-5xl">
            Answers before you board
          </h2>
        </div>

        <div className="divide-y divide-stone-200 border-y border-stone-200">
          {POLICIES.map(({ question, answer }) => (
            <details key={question} className="group py-5">
              <summary className="text-ink focus-visible:outline-ochre flex cursor-pointer items-center justify-between gap-4 text-base font-semibold marker:content-none focus-visible:outline-2 focus-visible:outline-offset-4">
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

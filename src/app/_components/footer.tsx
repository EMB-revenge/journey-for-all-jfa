import Image from "next/image";
import Link from "next/link";

/** Footer contacts are the people who built and run JFA Transit. */
const CONTACTS = [
  { name: "Fletcher Jan Malala", email: "fletcherjan.malala-24@cpu.edu.ph" },
  {
    name: "Amiel Benedict Mirasol",
    email: "amielbenedict.mirasol-13@cpu.edu.ph",
  },
  { name: "Joe Steven Bandong", email: "joesteven.bandong-24@cpu.edu.ph" },
];

const QUICK_LINKS = [
  { label: "Book a trip", href: "/" },
  { label: "My bookings", href: "/my-bookings" },
];

const RESOURCES = [
  { label: "Locations", href: "/#locations" },
  { label: "FAQ", href: "/#faq" },
];

export function Footer() {
  return (
    <footer className="bg-charcoal text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/Logo.png"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl object-cover"
              />
              <span className="text-lg font-semibold">JFA Transit</span>
            </div>
            <p className="mt-4 max-w-56 text-sm leading-relaxed text-white/60">
              Intercity bus booking for Panay Island routes.
            </p>
          </div>

          <nav aria-label="Quick links">
            <h3 className="text-sm font-semibold text-white">Quick links</h3>
            <ul className="mt-4 space-y-3">
              {QUICK_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/60 transition hover:text-yellow-400"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Resources">
            <h3 className="text-sm font-semibold text-white">Resources</h3>
            <ul className="mt-4 space-y-3">
              {RESOURCES.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/60 transition hover:text-yellow-400"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-sm font-semibold text-white">Contact</h3>
            <p className="mt-4 text-sm text-white/60">
              Locked out, overcharged, or stuck on a booking? Submit a ticket
              and the team replies by email.
            </p>
            <Link
              href="/contact"
              className="mt-3 inline-block rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-300"
            >
              Submit a ticket
            </Link>
            <ul className="mt-5 space-y-2">
              {CONTACTS.map(({ name, email }) => (
                <li key={email} className="text-sm text-white/60">
                  {name}
                  <span className="block text-xs text-white/40">{email}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} JFA Transit</p>
          <p>
            Photo: Ceres Liner bus, Wikimedia Commons, CC0.{" "}
            <a
              href="https://commons.wikimedia.org/wiki/File:Ceres_Liner_5446.jpg"
              className="underline decoration-white/30 underline-offset-2 transition hover:text-yellow-400"
            >
              Source
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

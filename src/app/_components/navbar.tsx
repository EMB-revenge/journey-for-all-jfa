import Link from "next/link";

const links = [
  { label: "Book a trip", href: "/" },
  { label: "My bookings", href: "/my-bookings" },
];

export function Navbar() {
  return (
    <header className="bg-neutral-950">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-400 text-lg font-bold text-black">
            logo
          </span>
          <span className="text-xl font-semibold text-white">Website name</span>
        </Link>

        <ul className="items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-white/70 transition hover:text-yellow-400"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-white/70 transition hover:text-yellow-400"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-yellow-300"
          >
            Create account
          </Link>
        </div>
      </nav>
    </header>
  );
}
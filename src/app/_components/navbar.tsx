"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "~/context/AuthContext";
import { authClient } from "~/server/better-auth/client";

export function Navbar() {
  const router = useRouter();
  const { session, isPending } = useAuth();

  const links = [
    { label: "Book a trip", href: "/" },
    // "My bookings" and "Admin" come back when those pages land.
  ];

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="bg-neutral-950">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/Logo.png"
            alt="Logo"
            width={64}
            height={64}
            className="h-10 w-10 rounded-xl object-cover"
          />
          <span className="text-xl font-semibold text-white">JFA Transit</span>
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
          {isPending ? (
            <span className="h-9 w-24 rounded-xl bg-white/10" />
          ) : session ? (
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:border-yellow-400 hover:text-yellow-400 [&::-webkit-details-marker]:hidden">
                {session.user.name}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 transition group-open:rotate-180"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </summary>

              <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
                <Link
                  href="/change-password"
                  className="block px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100"
                >
                  Change password
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="block w-full px-4 py-2 text-left text-sm text-neutral-700 transition hover:bg-neutral-100"
                >
                  Sign out
                </button>
              </div>
            </details>
          ) : (
            <Link
              href="/login"
              className="rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:border-yellow-400 hover:text-yellow-400"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}

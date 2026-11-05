"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "~/context/AuthContext";
import { authClient } from "~/server/better-auth/client";

export function Navbar() {
  const router = useRouter();
  const { session } = useAuth();
  const [showAdminOnly, setShowAdminOnly] = useState(false);

  const isAdmin = session?.user.role === "ADMIN";

  const links = [
    { label: "Book a trip", href: "/" },
    { label: "My bookings", href: "/my-bookings" },
  ];

  // The admin layout sends signed-in non-admins to /?adminOnly=1. Show the
  // popup once, then clean the URL so a refresh doesn't show it again.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("adminOnly") === "1") {
      setShowAdminOnly(true);
      params.delete("adminOnly");
      const qs = params.toString();
      window.history.replaceState(
        null,
        "",
        window.location.pathname + (qs ? `?${qs}` : ""),
      );
    }
  }, []);

  // Close the popup with the Escape key.
  useEffect(() => {
    if (!showAdminOnly) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAdminOnly(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showAdminOnly]);

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  const adminBtnClass =
    "rounded-xl border border-yellow-400 px-3 py-2 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-400 hover:text-charcoal sm:px-4";

  return (
    <header className="bg-charcoal">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src="/Logo.png"
            alt="Logo"
            width={64}
            height={64}
            className="h-10 w-10 rounded-xl object-cover"
          />
          <span className="text-lg font-semibold text-white sm:text-xl">
            JFA Transit
          </span>
        </Link>

        {/* Hidden on phones: the logo goes home and the account menu has My bookings. */}
        <ul className="hidden items-center gap-8 md:flex">
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
          {/* Signed-in passengers get the popup. Signed-out visitors go to the login page. */}
          {!isAdmin &&
            (session ? (
              <button
                type="button"
                onClick={() => setShowAdminOnly(true)}
                className={adminBtnClass}
              >
                Admin
              </button>
            ) : (
              <Link href="/login?redirectTo=/admin" className={adminBtnClass}>
                Admin
              </Link>
            ))}

          {session ? (
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl border border-white/30 px-3 py-2 text-sm font-semibold text-white transition hover:border-yellow-400 hover:text-yellow-400 sm:px-4 [&::-webkit-details-marker]:hidden">
                <span className="max-w-22 truncate sm:max-w-56">
                  {session.user.name}
                </span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 shrink-0 transition group-open:rotate-180"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                    clipRule="evenodd"
                  />
                </svg>
              </summary>

              <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="block px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
                  >
                    Admin dashboard
                  </Link>
                )}
                <Link
                  href="/account"
                  className="block px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100"
                >
                  Account
                </Link>
                <Link
                  href="/my-bookings"
                  className="block px-4 py-2 text-sm text-neutral-700 transition hover:bg-neutral-100"
                >
                  My bookings
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

      {showAdminOnly && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/70 px-4"
          onClick={() => setShowAdminOnly(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-only-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <rect x="5" y="11" width="14" height="9" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </svg>
            </div>
            <h2
              id="admin-only-title"
              className="text-lg font-bold text-charcoal"
            >
              Admin access only
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              This area is for admins only. Your account doesn&apos;t have
              admin access.
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => setShowAdminOnly(false)}
              className="mt-5 w-full rounded-xl bg-yellow-400 px-4 py-2 text-sm font-semibold text-charcoal transition hover:bg-yellow-300"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
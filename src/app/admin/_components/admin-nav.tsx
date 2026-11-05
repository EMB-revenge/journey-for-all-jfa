"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const icon = (children: ReactNode) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5 shrink-0"
  >
    {children}
  </svg>
);

const items = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: icon(
      <>
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      </>,
    ),
  },
  {
    label: "Buses",
    href: "/admin/buses",
    icon: icon(
      <>
        <rect x="4" y="3.5" width="16" height="14" rx="2.5" />
        <path d="M4 11h16" />
        <circle cx="8" cy="20" r="1.2" />
        <circle cx="16" cy="20" r="1.2" />
      </>,
    ),
  },
  {
    label: "Routes",
    href: "/admin/routes",
    icon: icon(
      <>
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="18" cy="18" r="2.5" />
        <path d="M8.5 6H14a3 3 0 0 1 0 6h-4a3 3 0 0 0 0 6h5.5" />
      </>,
    ),
  },
  {
    label: "Schedules",
    href: "/admin/schedules",
    icon: icon(
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
      </>,
    ),
  },
  {
    label: "Bookings",
    href: "/admin/bookings",
    icon: icon(
      <>
        <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
        <path d="M14 6v12" strokeDasharray="2 2" />
      </>,
    ),
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: icon(
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </>,
    ),
  },
  {
    label: "Feedback",
    href: "/admin/feedback",
    icon: icon(
      <>
        <path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16h-7l-4.5 3.5V16H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 5Z" />
        <path d="M8 9.5h8M8 12.5h5" />
      </>,
    ),
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                active
                  ? "bg-yellow-400 text-charcoal shadow-lg"
                  : "border border-white/25 bg-white/10 text-white backdrop-blur-sm hover:border-yellow-400 hover:text-yellow-400"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
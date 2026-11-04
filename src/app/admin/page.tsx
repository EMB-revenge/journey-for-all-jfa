import Link from "next/link";

import { PageHeader } from "~/app/admin/_components/ui";
import { api } from "~/trpc/server";

export default async function AdminHome() {
  const stats = await api.admin.stats();

  const cards = [
    { label: "Users", value: stats.users.toLocaleString() },
    { label: "Confirmed bookings", value: stats.bookings.toLocaleString() },
    { label: "Upcoming trips", value: stats.upcomingTrips.toLocaleString() },
    { label: "Revenue", value: `₱${Number(stats.revenue).toLocaleString()}` },
  ];

  const shortcuts = [
    { label: "Buses", href: "/admin/buses", text: "Fleet, plates, capacity" },
    { label: "Routes", href: "/admin/routes", text: "Cities, fares, duration" },
    { label: "Schedules", href: "/admin/schedules", text: "Trips and times" },
    { label: "Bookings", href: "/admin/bookings", text: "Passengers and seats" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-neutral-200 border-t-4 border-t-yellow-400 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-neutral-500">{c.label}</p>
            <p className="mt-2 text-3xl font-bold text-charcoal">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-2xl bg-charcoal p-5 transition hover:ring-2 hover:ring-yellow-400"
          >
            <p className="font-semibold text-white">{s.label}</p>
            <p className="mt-1 text-sm text-white/60">{s.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
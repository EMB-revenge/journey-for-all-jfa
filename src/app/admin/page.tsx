import Link from "next/link";

import { api } from "~/trpc/server";

export default async function AdminHome() {
  const stats = await api.admin.stats();

  const cards = [
    { label: "Users", value: stats.users },
    { label: "Confirmed bookings", value: stats.bookings },
    { label: "Upcoming trips", value: stats.upcomingTrips },
    { label: "Revenue", value: stats.revenue },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border p-4">
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="text-2xl font-semibold">{c.value}</p>
          </div>
        ))}
      </div>
      <nav className="flex gap-4 underline">
        <Link href="/admin/bookings">Bookings</Link>
        <Link href="/admin/users">Users</Link>
      </nav>
    </div>
  );
}
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "~/server/better-auth/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) redirect("/login?redirectTo=/admin");
  if (session.user.role !== "ADMIN" || !session.user.isActive) redirect("/");

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-6 flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <nav className="flex flex-wrap gap-4 text-sm underline">
            <Link href="/admin">Dashboard</Link>
            <Link href="/admin/buses">Buses</Link>
            <Link href="/admin/routes">Routes</Link>
            <Link href="/admin/schedules">Schedules</Link>
            <Link href="/admin/bookings">Bookings</Link>
            <Link href="/admin/users">Users</Link>
            </nav>
      </header>
      {children}
    </div>
  );
}
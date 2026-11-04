import Image from "next/image";
import { redirect } from "next/navigation";

import { AdminNav } from "~/app/admin/_components/admin-nav";
import { Navbar } from "~/app/_components/navbar";
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
    <>
      <Navbar />
      <main className="min-h-screen bg-paper">
        <section className="relative overflow-hidden bg-charcoal">
          <Image
            src="/hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover max-md:object-[68%_center]"
          />
          <div className="absolute inset-0 bg-linear-to-r from-charcoal/95 via-charcoal/60 to-charcoal/20" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-paper to-transparent sm:h-40" />

          <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-36 sm:px-6 sm:pt-16 sm:pb-40">
            <p className="mb-4 text-xs font-semibold tracking-[0.25em] text-yellow-400 uppercase sm:text-sm">
              Admin panel
            </p>
            <h1 className="max-w-3xl text-4xl leading-[1.1] font-bold tracking-tight text-white sm:text-6xl">
              Manage buses, trips, and bookings.
            </h1>
            <div className="mt-8">
              <AdminNav />
            </div>
          </div>
        </section>

        <div className="relative z-10 mx-auto -mt-24 max-w-7xl px-4 pb-16 sm:px-6">
          <div className="rounded-2xl bg-white p-5 shadow-xl sm:p-8">
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
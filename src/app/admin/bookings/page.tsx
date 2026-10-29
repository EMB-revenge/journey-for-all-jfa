"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

export default function AdminBookings() {
  const [search, setSearch] = useState("");
  const utils = api.useUtils();

  const bookings = api.admin.listBookings.useInfiniteQuery(
    { search: search || undefined },
    { getNextPageParam: (last) => last.nextCursor },
  );
  const cancel = api.admin.cancelBooking.useMutation({
    onSuccess: () => utils.admin.listBookings.invalidate(),
    onError: (e) => alert(e.message),
  });

  const items = bookings.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Bookings</h2>
      <input
        className="w-full rounded border p-2"
        placeholder="Search by reference, name, or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Reference</th>
              <th className="p-2">Account</th>
              <th className="p-2">Route</th>
              <th className="p-2">Date</th>
              <th className="p-2">Seat</th>
              <th className="p-2">Status</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id} className="border-b">
                <td className="p-2 font-mono">{b.reference}</td>
                <td className="p-2">
                  {b.accountName}
                  <div className="text-xs text-gray-500">{b.accountEmail}</div>
                </td>
                <td className="p-2">{b.route}</td>
                <td className="p-2">{b.date}</td>
                <td className="p-2">{b.seats.length ? b.seats.join(", ") : "—"}</td>
                <td className="p-2">
                  {b.status === "CANCELLED" ? "Cancelled" : "Confirmed"}
                </td>
                <td className="p-2">
                  {b.status === "CONFIRMED" && (
                    <button
                      className="text-red-600 underline disabled:opacity-50"
                      disabled={cancel.isPending}
                      onClick={() => {
                        if (confirm(`Cancel ${b.reference}? This frees its seats.`)) {
                          cancel.mutate({ id: b.id });
                        }
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && !bookings.isLoading && (
        <p className="text-sm text-gray-500">No bookings found.</p>
      )}
      {bookings.hasNextPage && (
        <button
          className="rounded border px-4 py-2"
          onClick={() => bookings.fetchNextPage()}
          disabled={bookings.isFetchingNextPage}
        >
          Load more
        </button>
      )}
    </div>
  );
}
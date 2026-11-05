"use client";

import { useState } from "react";

import {
  Badge,
  btnDanger,
  btnPrimary,
  EmptyRow,
  input,
  PageHeader,
  row,
  td,
  th,
  TableCard,
} from "~/app/admin/_components/ui";
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
    <div>
      <PageHeader title="Bookings" />
      <input
        className={`${input} mb-4`}
        placeholder="Search by reference, name, or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <TableCard>
        <thead>
          <tr>
            <th className={th}>Reference</th>
            <th className={th}>Account</th>
            <th className={th}>Route</th>
            <th className={th}>Date</th>
            <th className={th}>Seat</th>
            <th className={th}>Status</th>
            <th className={th} />
          </tr>
        </thead>
        <tbody>
          {items.map((b) => (
            <tr key={b.id} className={row}>
              <td className={`${td} font-mono`}>{b.reference}</td>
              <td className={td}>
                <span className="text-charcoal font-semibold">
                  {b.accountName}
                </span>
                <div className="text-xs text-neutral-500">{b.accountEmail}</div>
              </td>
              <td className={td}>{b.route}</td>
              <td className={td}>{b.date}</td>
              <td className={td}>
                {b.seats.length ? b.seats.join(", ") : "—"}
              </td>
              <td className={td}>
                <Badge tone={b.status === "CANCELLED" ? "red" : "green"}>
                  {b.status === "CANCELLED" ? "Cancelled" : "Confirmed"}
                </Badge>
              </td>
              <td className={`${td} text-right`}>
                {b.canCancel && (
                  <button
                    className={btnDanger}
                    disabled={cancel.isPending}
                    onClick={() => {
                      if (
                        confirm(`Cancel ${b.reference}? This frees its seats.`)
                      ) {
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
      </TableCard>

      {bookings.isLoading && <EmptyRow text="Loading…" />}
      {items.length === 0 && !bookings.isLoading && (
        <EmptyRow text="No bookings found." />
      )}
      {bookings.hasNextPage && (
        <div className="mt-4 text-center">
          <button
            className={btnPrimary}
            onClick={() => bookings.fetchNextPage()}
            disabled={bookings.isFetchingNextPage}
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

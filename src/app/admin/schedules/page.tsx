"use client";

import { useState } from "react";

import {
  Badge,
  EmptyRow,
  PageHeader,
  row,
  td,
  th,
  TableCard,
} from "~/app/admin/_components/ui";
import { api } from "~/trpc/react";

export default function AdminSchedules() {
  const [includePast, setIncludePast] = useState(false);
  const schedules = api.admin.listSchedules.useQuery({ includePast });

  return (
    <div>
      <PageHeader title="Schedules of trips">
        <label className="flex items-center gap-2 text-sm font-medium text-neutral-700">
          <input
            type="checkbox"
            className="h-4 w-4 accent-yellow-400"
            checked={includePast}
            onChange={(e) => setIncludePast(e.target.checked)}
          />
          Include past trips
        </label>
      </PageHeader>

      <TableCard>
        <thead>
          <tr>
            <th className={th}>Bus</th>
            <th className={th}>Plate number</th>
            <th className={th}>Route</th>
            <th className={th}>Date</th>
            <th className={th}>Departure</th>
            <th className={th}>Arrival</th>
            <th className={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {schedules.data?.map((s) => (
            <tr key={s.id} className={row}>
              <td className={`${td} font-semibold text-charcoal`}>{s.busName}</td>
              <td className={`${td} font-mono`}>{s.plateNumber}</td>
              <td className={td}>{s.route}</td>
              <td className={td}>{s.date}</td>
              <td className={td}>{s.departure}</td>
              <td className={td}>{s.arrival}</td>
              <td className={td}>
                <Badge tone={s.isCancelled ? "red" : "green"}>
                  {s.isCancelled ? "Cancelled" : "Scheduled"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      {schedules.isLoading && <EmptyRow text="Loading…" />}
      {schedules.data?.length === 0 && <EmptyRow text="No trips found." />}
    </div>
  );
}
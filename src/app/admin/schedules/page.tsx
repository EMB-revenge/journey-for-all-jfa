"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

export default function AdminSchedules() {
  const [includePast, setIncludePast] = useState(false);
  const schedules = api.admin.listSchedules.useQuery({ includePast });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Schedules of trips</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includePast}
            onChange={(e) => setIncludePast(e.target.checked)}
          />
          Include past trips
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Bus</th>
              <th className="p-2">Plate number</th>
              <th className="p-2">Route</th>
              <th className="p-2">Date</th>
              <th className="p-2">Departure</th>
              <th className="p-2">Arrival</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {schedules.data?.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="p-2">{s.busName}</td>
                <td className="p-2 font-mono">{s.plateNumber}</td>
                <td className="p-2">{s.route}</td>
                <td className="p-2">{s.date}</td>
                <td className="p-2">{s.departure}</td>
                <td className="p-2">{s.arrival}</td>
                <td className="p-2">{s.isCancelled ? "Cancelled" : "Scheduled"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {schedules.isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {schedules.data?.length === 0 && (
        <p className="text-sm text-gray-500">No trips found.</p>
      )}
    </div>
  );
}
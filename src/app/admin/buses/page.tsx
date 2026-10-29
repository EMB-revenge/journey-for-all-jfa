"use client";

import { useState } from "react";

import { api } from "~/trpc/react";

export default function AdminBuses() {
  const utils = api.useUtils();
  const buses = api.admin.listBuses.useQuery();
  const busTypes = api.admin.listBusTypes.useQuery();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [plate, setPlate] = useState("");
  const [capacity, setCapacity] = useState<40 | 50>(40);
  const [typeId, setTypeId] = useState("");

  const create = api.admin.createBus.useMutation({
    onSuccess: async () => {
      await utils.admin.listBuses.invalidate();
      setName("");
      setPlate("");
      setOpen(false);
    },
    onError: (e) => alert(e.message),
  });

  const selectedType = typeId || busTypes.data?.[0]?.id || "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Buses</h2>
        <button
          className="rounded bg-black px-4 py-2 text-white"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "Close" : "Add bus"}
        </button>
      </div>

      {open && (
        <form
          className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({
              name,
              plateNumber: plate,
              capacity,
              busTypeId: selectedType,
            });
          }}
        >
          <input
            className="rounded border p-2"
            placeholder="Bus name (e.g. JFA-01)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className="rounded border p-2 uppercase"
            placeholder="Plate number"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            required
          />
          <select
            className="rounded border p-2"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value) as 40 | 50)}
          >
            <option value={40}>40 seats</option>
            <option value={50}>50 seats</option>
          </select>
          <select
            className="rounded border p-2"
            value={selectedType}
            onChange={(e) => setTypeId(e.target.value)}
            required
          >
            {busTypes.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {busTypes.data?.length === 0 && (
            <p className="text-sm text-red-600 sm:col-span-2">
              No bus types exist yet. Add rows like &quot;Aircon&quot; and
              &quot;Non-aircon&quot; to the bus_types table first.
            </p>
          )}
          <button
            className="rounded bg-black px-4 py-2 text-white disabled:opacity-50 sm:col-span-2"
            disabled={create.isPending || !selectedType}
          >
            {create.isPending ? "Saving…" : "Save bus"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Bus</th>
              <th className="p-2">Plate number</th>
              <th className="p-2">Capacity</th>
              <th className="p-2">Aircon</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {buses.data?.map((b) => (
              <tr key={b.id} className="border-b">
                <td className="p-2">{b.name}</td>
                <td className="p-2 font-mono">{b.plateNumber}</td>
                <td className="p-2">{b.capacity}</td>
                <td className="p-2">{b.busType}</td>
                <td className="p-2">{b.isActive ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {buses.data?.length === 0 && (
        <p className="text-sm text-gray-500">No buses yet.</p>
      )}
    </div>
  );
}
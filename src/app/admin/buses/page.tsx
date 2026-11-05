"use client";

import { useState } from "react";

import {
  Badge,
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

  const firstType = busTypes.data?.[0]?.id ?? "";
  const selectedType = typeId === "" ? firstType : typeId;

  return (
    <div>
      <PageHeader title="Buses">
        <button className={btnPrimary} onClick={() => setOpen((v) => !v)}>
          {open ? "Close" : "Add bus"}
        </button>
      </PageHeader>

      {open && (
        <form
          className="mb-6 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:grid-cols-2"
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
            className={input}
            placeholder="Bus name (e.g. JFA-01)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className={`${input} uppercase`}
            placeholder="Plate number"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            required
          />
          <select
            className={input}
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value) as 40 | 50)}
          >
            <option value={40}>40 seats</option>
            <option value={50}>50 seats</option>
          </select>
          <select
            className={input}
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
              No bus types yet. Add &quot;Aircon&quot; and
              &quot;Non-aircon&quot; rows to the bus_types table first.
            </p>
          )}
          <button
            className={`${btnPrimary} sm:col-span-2`}
            disabled={create.isPending || !selectedType}
          >
            {create.isPending ? "Saving…" : "Save bus"}
          </button>
        </form>
      )}

      <TableCard>
        <thead>
          <tr>
            <th className={th}>Bus</th>
            <th className={th}>Plate number</th>
            <th className={th}>Capacity</th>
            <th className={th}>Aircon</th>
            <th className={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {buses.data?.map((b) => (
            <tr key={b.id} className={row}>
              <td className={`${td} text-charcoal font-semibold`}>{b.name}</td>
              <td className={`${td} font-mono`}>{b.plateNumber}</td>
              <td className={td}>{b.capacity} seats</td>
              <td className={td}>{b.busType}</td>
              <td className={td}>
                <Badge tone={b.isActive ? "green" : "gray"}>
                  {b.isActive ? "Active" : "Inactive"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      {buses.isLoading && <EmptyRow text="Loading…" />}
      {buses.data?.length === 0 && <EmptyRow text="No buses yet." />}
    </div>
  );
}

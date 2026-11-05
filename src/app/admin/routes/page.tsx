"use client";

import { useState } from "react";
import {
  Badge,
  btnLink,
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

const durationMinutes = (value: string) =>
  Number(/(\d+)h/.exec(value)?.[1] ?? 0) * 60 +
  Number(/(\d+)m/.exec(value)?.[1] ?? 0);

export default function AdminRoutes() {
  const utils = api.useUtils();
  const routes = api.admin.listRoutes.useQuery();
  const cities = api.admin.routeOptions.useQuery();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [originCityId, setOrigin] = useState("");
  const [destCityId, setDest] = useState("");
  const [duration, setDuration] = useState("60");
  const [fare, setFare] = useState("0");
  const [active, setActive] = useState(true);
  const refresh = async () => utils.admin.listRoutes.invalidate();
  const create = api.admin.createRoute.useMutation({
    onSuccess: async () => {
      await refresh();
      setOpen(false);
    },
    onError: (e) => alert(e.message),
  });
  const update = api.admin.updateRoute.useMutation({
    onSuccess: async () => {
      await refresh();
      setOpen(false);
      setEditingId(null);
    },
    onError: (e) => alert(e.message),
  });
  const edit = (
    r: (typeof routes.data extends (infer T)[] | undefined ? T : never) & {
      id: string;
    },
  ) => {
    const a = cities.data?.find((c) => c.name === r.origin);
    const b = cities.data?.find((c) => c.name === r.destination);
    if (!a || !b) return;
    setOrigin(a.id);
    setDest(b.id);
    setDuration(String(durationMinutes(r.duration)));
    setFare(r.fare);
    setActive(r.isActive);
    setEditingId(r.id);
    setOpen(true);
  };
  return (
    <div>
      <PageHeader title="Routes">
        <button
          className={btnPrimary}
          onClick={() => {
            setOpen((v) => !v);
            setEditingId(null);
          }}
        >
          {open ? "Close" : "Add route"}
        </button>
      </PageHeader>
      {open && (
        <form
          className="mb-6 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const data = {
              originCityId,
              destCityId,
              durationMinutes: Number(duration),
              baseFare: Number(fare),
            };
            if (editingId)
              update.mutate({ id: editingId, ...data, isActive: active });
            else create.mutate(data);
          }}
        >
          <select
            className={input}
            value={originCityId}
            onChange={(e) => setOrigin(e.target.value)}
            required
          >
            <option value="">Origin city</option>
            {cities.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className={input}
            value={destCityId}
            onChange={(e) => setDest(e.target.value)}
            required
          >
            <option value="">Destination city</option>
            {cities.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            className={input}
            type="number"
            min="1"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            placeholder="Duration in minutes"
          />
          <input
            className={input}
            type="number"
            min="0.01"
            step="0.01"
            value={fare}
            onChange={(e) => setFare(e.target.value)}
            required
            placeholder="Fare"
          />
          {editingId && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              Active
            </label>
          )}
          <button
            className={btnPrimary}
            disabled={create.isPending || update.isPending}
          >
            {editingId ? "Save route" : "Add route"}
          </button>
        </form>
      )}
      <TableCard>
        <thead>
          <tr>
            <th className={th}>Origin</th>
            <th className={th}>Destination</th>
            <th className={th}>Travel time</th>
            <th className={th}>Fare</th>
            <th className={th}>Status</th>
            <th className={th} />
          </tr>
        </thead>
        <tbody>
          {routes.data?.map((r) => (
            <tr key={r.id} className={row}>
              <td className={`${td} text-charcoal font-semibold`}>
                {r.origin}
              </td>
              <td className={`${td} text-charcoal font-semibold`}>
                {r.destination}
              </td>
              <td className={td}>{r.duration}</td>
              <td className={td}>₱{r.fare}</td>
              <td className={td}>
                <Badge tone={r.isActive ? "green" : "gray"}>
                  {r.isActive ? "Active" : "Inactive"}
                </Badge>
              </td>
              <td className={`${td} text-right`}>
                <button className={btnLink} onClick={() => edit(r)}>
                  Edit
                </button>
                <button
                  className={`${btnLink} ml-3`}
                  onClick={() =>
                    update.mutate({ id: r.id, isActive: !r.isActive })
                  }
                >
                  {r.isActive ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      {routes.isLoading && <EmptyRow text="Loading…" />}
      {routes.data?.length === 0 && <EmptyRow text="No routes yet." />}
    </div>
  );
}

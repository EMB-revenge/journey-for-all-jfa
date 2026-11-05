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

const tabs = ["upcoming", "past", "cancelled", "all"] as const;
type Status = (typeof tabs)[number];

export default function AdminSchedules() {
  const utils = api.useUtils();
  const [status, setStatus] = useState<Status>("upcoming");
  const [routeId, setRoute] = useState("");
  const [busId, setBus] = useState("");
  const [date, setDate] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formBus, setFormBus] = useState("");
  const [formRoute, setFormRoute] = useState("");
  const [formDate, setFormDate] = useState("");
  const [departure, setDeparture] = useState("");
  const [arrival, setArrival] = useState("");
  const options = api.admin.scheduleOptions.useQuery();
  const schedules = api.admin.listSchedules.useInfiniteQuery(
    {
      status,
      routeId: routeId || undefined,
      busId: busId || undefined,
      date: date || undefined,
    },
    { getNextPageParam: (last) => last.nextCursor },
  );
  const refresh = async () => utils.admin.listSchedules.invalidate();
  const create = api.admin.createSchedule.useMutation({
    onSuccess: async () => {
      await refresh();
      setOpen(false);
    },
    onError: (e) => alert(e.message),
  });
  const update = api.admin.updateSchedule.useMutation({
    onSuccess: async () => {
      await refresh();
      setOpen(false);
      setEditId(null);
    },
    onError: (e) => alert(e.message),
  });
  const cancel = api.admin.setScheduleCancelled.useMutation({
    onSuccess: refresh,
    onError: (e) => alert(e.message),
  });
  const items = schedules.data?.pages.flatMap((p) => p.items) ?? [];
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      busId: formBus,
      routeId: formRoute,
      date: formDate,
      departure,
      arrival,
    };
    if (editId) update.mutate({ id: editId, ...data });
    else create.mutate(data);
  };
  return (
    <div>
      <PageHeader title="Schedules of trips">
        <button
          className={btnPrimary}
          onClick={() => {
            setOpen((v) => !v);
            setEditId(null);
          }}
        >
          {open ? "Close" : "Add schedule"}
        </button>
      </PageHeader>
      {open && (
        <form
          className="mb-6 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:grid-cols-2"
          onSubmit={submit}
        >
          <select
            className={input}
            value={formBus}
            onChange={(e) => setFormBus(e.target.value)}
            required
          >
            <option value="">Bus</option>
            {options.data?.buses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} · {b.plateNumber}
              </option>
            ))}
          </select>
          <select
            className={input}
            value={formRoute}
            onChange={(e) => setFormRoute(e.target.value)}
            required
          >
            <option value="">Route</option>
            {options.data?.routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
          <input
            className={input}
            type="date"
            value={formDate}
            onChange={(e) => setFormDate(e.target.value)}
            required
          />
          <input
            className={input}
            type="time"
            value={departure}
            onChange={(e) => setDeparture(e.target.value)}
            required
          />
          <input
            className={input}
            type="time"
            value={arrival}
            onChange={(e) => setArrival(e.target.value)}
            required
          />
          <button
            className={btnPrimary}
            disabled={create.isPending || update.isPending}
          >
            {editId ? "Save schedule" : "Add schedule"}
          </button>
        </form>
      )}
      <div className="mb-4 flex flex-wrap gap-3">
        {tabs.map((t) => (
          <button
            key={t}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${status === t ? "text-charcoal bg-yellow-300" : "bg-white text-neutral-600"}`}
            onClick={() => setStatus(t)}
          >
            {t}
          </button>
        ))}
        <select
          className={`${input} w-auto min-w-44`}
          value={routeId}
          onChange={(e) => setRoute(e.target.value)}
        >
          <option value="">All routes</option>
          {options.data?.routes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
        <select
          className={`${input} w-auto min-w-44`}
          value={busId}
          onChange={(e) => setBus(e.target.value)}
        >
          <option value="">All buses</option>
          {options.data?.buses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          className={`${input} w-auto`}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
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
            <th className={th} />
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id} className={row}>
              <td className={`${td} text-charcoal font-semibold`}>
                {s.busName}
              </td>
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
              <td className={`${td} text-right`}>
                <button
                  className={btnLink}
                  onClick={() => {
                    setEditId(s.id);
                    setFormBus(
                      options.data?.buses.find(
                        (b) =>
                          b.name === s.busName &&
                          b.plateNumber === s.plateNumber,
                      )?.id ?? "",
                    );
                    setFormRoute(
                      options.data?.routes.find((r) => r.label === s.route)
                        ?.id ?? "",
                    );
                    setFormDate(s.date);
                    setDeparture(s.departure);
                    setArrival(s.arrival);
                    setOpen(true);
                  }}
                >
                  Edit
                </button>
                <button
                  className={`${btnLink} ml-3`}
                  disabled={cancel.isPending}
                  onClick={() =>
                    cancel.mutate({ id: s.id, isCancelled: !s.isCancelled })
                  }
                >
                  {s.isCancelled ? "Restore" : "Cancel"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      {schedules.isLoading && <EmptyRow text="Loading…" />}
      {items.length === 0 && !schedules.isLoading && (
        <EmptyRow text="No trips found." />
      )}
      {schedules.hasNextPage && (
        <div className="mt-4 text-center">
          <button
            className={btnPrimary}
            onClick={() => schedules.fetchNextPage()}
            disabled={schedules.isFetchingNextPage}
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}

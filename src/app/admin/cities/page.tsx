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

export default function AdminCities() {
  const utils = api.useUtils();
  const cities = api.admin.listCities.useQuery();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const refresh = async () => utils.admin.listCities.invalidate();
  const create = api.admin.createCity.useMutation({
    onSuccess: async () => {
      await refresh();
      setName("");
      setOpen(false);
    },
    onError: (e) => alert(e.message),
  });
  const update = api.admin.updateCity.useMutation({
    onSuccess: async () => {
      await refresh();
      setEditingId(null);
      setName("");
      setOpen(false);
    },
    onError: (e) => alert(e.message),
  });
  const busy = create.isPending || update.isPending;

  return (
    <div>
      <PageHeader title="Cities">
        <button
          className={btnPrimary}
          onClick={() => {
            setOpen((v) => !v);
            setEditingId(null);
            setName("");
          }}
        >
          {open ? "Close" : "Add city"}
        </button>
      </PageHeader>
      {open && (
        <form
          className="mb-6 grid gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
          onSubmit={(e) => {
            e.preventDefault();
            if (editingId) update.mutate({ id: editingId, name });
            else create.mutate({ name });
          }}
        >
          <input
            className={input}
            placeholder="City name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={60}
            autoFocus
          />
          <div className="flex gap-2">
            <button className={btnPrimary} type="submit" disabled={busy}>
              {editingId ? "Save" : "Add city"}
            </button>
            {editingId && (
              <button
                type="button"
                className={btnLink}
                onClick={() => {
                  setEditingId(null);
                  setName("");
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
      <TableCard>
        <thead>
          <tr>
            <th className={th}>Name</th>
            <th className={th}>Status</th>
            <th className={th} />
          </tr>
        </thead>
        <tbody>
          {cities.data?.map((c) => (
            <tr key={c.id} className={row}>
              <td className={`${td} text-charcoal font-semibold`}>{c.name}</td>
              <td className={td}>
                <Badge tone={c.isActive ? "green" : "gray"}>
                  {c.isActive ? "Active" : "Inactive"}
                </Badge>
              </td>
              <td className={`${td} text-right`}>
                <div className="flex justify-end gap-3">
                  <button
                    className={btnLink}
                    disabled={busy}
                    onClick={() => {
                      setOpen(true);
                      setEditingId(c.id);
                      setName(c.name);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className={btnLink}
                    disabled={busy}
                    onClick={() =>
                      update.mutate({ id: c.id, isActive: !c.isActive })
                    }
                  >
                    {c.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      {cities.isLoading && <EmptyRow text="Loading…" />}
      {cities.data?.length === 0 && <EmptyRow text="No cities yet." />}
    </div>
  );
}

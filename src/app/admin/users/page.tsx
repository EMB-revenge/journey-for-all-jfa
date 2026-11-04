"use client";

import { useState } from "react";

import {
  Badge,
  btnLink,
  EmptyRow,
  input,
  PageHeader,
  row,
  td,
  th,
  TableCard,
} from "~/app/admin/_components/ui";
import { api } from "~/trpc/react";

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const utils = api.useUtils();

  const users = api.admin.listUsers.useQuery({ search: search || undefined });
  const setActive = api.admin.setUserActive.useMutation({
    onSuccess: () => utils.admin.listUsers.invalidate(),
    onError: (e) => alert(e.message),
  });

  return (
    <div>
      <PageHeader title="Users" />
      <input
        className={`${input} mb-4`}
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <TableCard>
        <thead>
          <tr>
            <th className={th}>Name</th>
            <th className={th}>Email</th>
            <th className={th}>Role</th>
            <th className={th}>Bookings</th>
            <th className={th}>Joined</th>
            <th className={th}>Status</th>
            <th className={th} />
          </tr>
        </thead>
        <tbody>
          {users.data?.map((u) => (
            <tr key={u.id} className={row}>
              <td className={`${td} font-semibold text-charcoal`}>{u.name}</td>
              <td className={td}>{u.email}</td>
              <td className={td}>
                <Badge tone={u.role === "ADMIN" ? "yellow" : "gray"}>
                  {u.role}
                </Badge>
              </td>
              <td className={td}>{u._count.bookings}</td>
              <td className={td}>{u.createdAt.toISOString().slice(0, 10)}</td>
              <td className={td}>
                <Badge tone={u.isActive ? "green" : "red"}>
                  {u.isActive ? "Active" : "Deactivated"}
                </Badge>
              </td>
              <td className={`${td} text-right`}>
                <button
                  className={btnLink}
                  disabled={setActive.isPending}
                  onClick={() => {
                    const next = !u.isActive;
                    if (
                      !next &&
                      !confirm(`Deactivate ${u.email}? They will be signed out.`)
                    ) {
                      return;
                    }
                    setActive.mutate({ id: u.id, isActive: next });
                  }}
                >
                  {u.isActive ? "Deactivate" : "Reactivate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>

      {users.isLoading && <EmptyRow text="Loading…" />}
      {users.data?.length === 0 && <EmptyRow text="No users found." />}
    </div>
  );
}
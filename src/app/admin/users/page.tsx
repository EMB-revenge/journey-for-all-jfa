"use client";

import { useState } from "react";

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
    <div className="space-y-4">
      <input
        className="w-full rounded border p-2"
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Bookings</th>
              <th className="p-2">Joined</th>
              <th className="p-2">Status</th>
              <th className="p-2" />
            </tr>
          </thead>
          <tbody>
            {users.data?.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.role}</td>
                <td className="p-2">{u._count.bookings}</td>
                <td className="p-2">{u.createdAt.toISOString().slice(0, 10)}</td>
                <td className="p-2">{u.isActive ? "Active" : "Deactivated"}</td>
                <td className="p-2">
                  <button
                    className="underline disabled:opacity-50"
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
        </table>
      </div>

      {users.isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {users.data?.length === 0 && (
        <p className="text-sm text-gray-500">No users found.</p>
      )}
    </div>
  );
}
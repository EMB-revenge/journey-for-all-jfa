"use client";

import { useState } from "react";

import { formatBookedAt } from "~/app/_lib/format";
import {
  Badge,
  btnLink,
  EmptyRow,
  PageHeader,
  row,
  td,
  th,
  TableCard,
} from "~/app/admin/_components/ui";
import { api } from "~/trpc/react";

const filters = [
  { label: "Open", value: "open" },
  { label: "Resolved", value: "resolved" },
  { label: "All", value: "all" },
] as const;

export default function AdminFeedback() {
  const [filter, setFilter] = useState<"open" | "resolved" | "all">("open");
  const utils = api.useUtils();

  const feedback = api.admin.listFeedback.useQuery({ filter });
  const setResolved = api.admin.setFeedbackResolved.useMutation({
    onSuccess: async () => {
      await utils.admin.listFeedback.invalidate();
      await utils.admin.stats.invalidate();
    },
    onError: (e) => alert(e.message),
  });

  return (
    <div>
      <PageHeader title="Feedback">
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filter === f.value
                  ? "text-charcoal bg-yellow-400"
                  : "border border-neutral-300 text-neutral-700 hover:border-yellow-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </PageHeader>

      <TableCard>
        <thead>
          <tr>
            <th className={th}>From</th>
            <th className={th}>Message</th>
            <th className={th}>Received</th>
            <th className={th}>Status</th>
            <th className={th} />
          </tr>
        </thead>
        <tbody>
          {feedback.data?.map((f) => (
            <tr key={f.id} className={`${row} align-top`}>
              <td className={td}>
                <span className="text-charcoal font-semibold">{f.name}</span>
                <div className="text-xs">
                  <a
                    href={`mailto:${f.email}`}
                    className="text-neutral-500 underline hover:text-yellow-600"
                  >
                    {f.email}
                  </a>
                </div>
              </td>
              <td className={`${td} max-w-md whitespace-pre-wrap`}>
                {f.message}
              </td>
              <td className={`${td} whitespace-nowrap`}>
                {formatBookedAt(f.createdAt)}
              </td>
              <td className={td}>
                <Badge tone={f.isResolved ? "green" : "yellow"}>
                  {f.isResolved ? "Resolved" : "Open"}
                </Badge>
              </td>
              <td className={`${td} text-right`}>
                <button
                  className={btnLink}
                  disabled={setResolved.isPending}
                  onClick={() =>
                    setResolved.mutate({ id: f.id, resolved: !f.isResolved })
                  }
                >
                  {f.isResolved ? "Reopen" : "Mark resolved"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>

      {feedback.isLoading && <EmptyRow text="Loading…" />}
      {feedback.data?.length === 0 && (
        <EmptyRow text="No feedback in this view." />
      )}
    </div>
  );
}

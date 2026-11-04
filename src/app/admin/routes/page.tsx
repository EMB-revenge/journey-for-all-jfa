import {
  Badge,
  EmptyRow,
  PageHeader,
  row,
  td,
  th,
  TableCard,
} from "~/app/admin/_components/ui";
import { api } from "~/trpc/server";

export default async function AdminRoutes() {
  const routes = await api.admin.listRoutes();

  return (
    <div>
      <PageHeader title="Routes" />
      <TableCard>
        <thead>
          <tr>
            <th className={th}>Origin</th>
            <th className={th}>Destination</th>
            <th className={th}>Travel time</th>
            <th className={th}>Fare</th>
            <th className={th}>Status</th>
          </tr>
        </thead>
        <tbody>
          {routes.map((r) => (
            <tr key={r.id} className={row}>
              <td className={`${td} font-semibold text-charcoal`}>{r.origin}</td>
              <td className={`${td} font-semibold text-charcoal`}>
                {r.destination}
              </td>
              <td className={td}>{r.duration}</td>
              <td className={td}>₱{r.fare}</td>
              <td className={td}>
                <Badge tone={r.isActive ? "green" : "gray"}>
                  {r.isActive ? "Active" : "Inactive"}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      {routes.length === 0 && <EmptyRow text="No routes yet." />}
    </div>
  );
}
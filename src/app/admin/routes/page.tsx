import { api } from "~/trpc/server";

export default async function AdminRoutes() {
  const routes = await api.admin.listRoutes();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Routes</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2">Origin</th>
              <th className="p-2">Destination</th>
              <th className="p-2">Travel time</th>
              <th className="p-2">Fare</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2">{r.origin}</td>
                <td className="p-2">{r.destination}</td>
                <td className="p-2">{r.duration}</td>
                <td className="p-2">{r.fare}</td>
                <td className="p-2">{r.isActive ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {routes.length === 0 && (
        <p className="text-sm text-gray-500">No routes yet.</p>
      )}
    </div>
  );
}
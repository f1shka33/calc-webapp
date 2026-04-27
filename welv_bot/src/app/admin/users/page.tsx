import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true, customOrders: true, downloads: true } } }
  });
  return (
    <div>
      <h2 className="heading-display text-2xl text-silver-100">Users ({users.length})</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/5">
        <table className="min-w-full text-sm">
          <thead className="bg-ink-900/60 text-left text-[10px] uppercase tracking-widest text-silver-400">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Custom</th>
              <th className="px-4 py-3">Downloads</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.map((u) => (
              <tr key={u.id} className="text-silver-200">
                <td className="px-4 py-3 text-silver-100">{u.email}</td>
                <td className="px-4 py-3">{u.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`pill ${u.role === "ADMIN" ? "border-blood-500 text-white" : ""}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono">{u._count.orders}</td>
                <td className="px-4 py-3 font-mono">{u._count.customOrders}</td>
                <td className="px-4 py-3 font-mono">{u._count.downloads}</td>
                <td className="px-4 py-3 font-mono text-xs">{u.createdAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminOverview() {
  const [productsCount, ordersCount, paidCount, usersCount, customCount, recentOrders, revenue] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: "PAID" } }),
      prisma.user.count(),
      prisma.customOrder.count(),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { user: true, items: true }
      }),
      prisma.order.aggregate({ _sum: { totalUsdCents: true }, where: { status: "PAID" } })
    ]);

  return (
    <div className="space-y-10">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Products" value={productsCount} />
        <Stat label="Orders" value={ordersCount} />
        <Stat label="Paid" value={paidCount} />
        <Stat label="Users" value={usersCount} />
        <Stat label="Custom" value={customCount} />
      </section>

      <section className="glass-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="heading-display text-2xl text-silver-100">Recent orders</h2>
          <div className="font-mono text-sm text-silver-300">
            Total revenue: <span className="text-blood-500">{formatUsd(revenue._sum.totalUsdCents ?? 0)}</span>
          </div>
        </div>
        {recentOrders.length === 0 ? (
          <div className="mt-3 text-sm text-silver-300">No orders yet.</div>
        ) : (
          <ul className="mt-4 divide-y divide-white/5">
            {recentOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-mono text-xs text-silver-400">#{o.id.slice(0, 8)}</div>
                  <div className="text-silver-100">{o.user.email}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-silver-100">{formatUsd(o.totalUsdCents)}</span>
                  <span className="pill">{o.status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-card p-4">
      <div className="text-[10px] uppercase tracking-widest text-silver-400">{label}</div>
      <div className="mt-1 font-display text-3xl text-silver-100">{value}</div>
    </div>
  );
}

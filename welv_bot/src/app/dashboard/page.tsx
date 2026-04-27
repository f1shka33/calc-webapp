import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DashboardOverview() {
  const user = await requireUser();
  const [downloads, orders, customOrders] = await Promise.all([
    prisma.download.findMany({
      where: { userId: user.id },
      include: { product: { include: { category: true } } },
      orderBy: { createdAt: "desc" }
    }),
    prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.customOrder.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 3
    })
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h2 className="heading-display text-2xl text-silver-100">Your downloads</h2>
        {downloads.length === 0 ? (
          <div className="mt-4 glass-card p-6 text-sm text-silver-300">
            No downloads yet. Open the{" "}
            <Link href="/catalog" className="text-blood-500 hover:underline">
              catalog
            </Link>{" "}
            and pick a weapon.
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            {downloads.map((d) => (
              <div key={d.id} className="glass-card flex items-center justify-between p-5">
                <div>
                  <div className="text-xs uppercase tracking-wider text-silver-400">
                    {d.product.category.name}
                  </div>
                  <div className="heading-display text-lg text-silver-100">{d.product.title}</div>
                  <div className="mt-1 font-mono text-xs text-silver-400">
                    Downloaded {d.count}× · last {d.lastUsedAt?.toISOString().slice(0, 10) ?? "—"}
                  </div>
                </div>
                <a href={`/api/downloads/${d.token}`} className="btn-primary">
                  Download
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="heading-display text-2xl text-silver-100">Recent orders</h2>
          <Link href="/dashboard/orders" className="text-xs uppercase tracking-wider text-silver-400 hover:text-white">
            All orders →
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="mt-4 glass-card p-6 text-sm text-silver-300">No orders yet.</div>
        ) : (
          <ul className="mt-4 space-y-2">
            {orders.map((o) => (
              <li key={o.id} className="glass-card flex items-center justify-between p-4 text-sm">
                <div>
                  <div className="font-mono text-xs text-silver-400">#{o.id.slice(0, 8)}</div>
                  <div className="text-silver-100">{formatUsd(o.totalUsdCents)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="pill">{o.provider}</span>
                  <StatusPill status={o.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="heading-display text-2xl text-silver-100">Custom orders</h2>
          <Link href="/custom-order" className="btn-outline">Create one</Link>
        </div>
        {customOrders.length === 0 ? (
          <div className="mt-4 glass-card p-6 text-sm text-silver-300">
            No custom orders yet. Need a fully tailored vocal chain, cover, banner, or rollout?{" "}
            <Link href="/custom-order" className="text-blood-500 hover:underline">
              Open a custom order
            </Link>
            .
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {customOrders.map((c) => (
              <li key={c.id} className="glass-card flex items-center justify-between p-4 text-sm">
                <div>
                  <div className="text-silver-100">{c.artistName}</div>
                  <div className="font-mono text-xs text-silver-400">{c.type} · {c.createdAt.toISOString().slice(0, 10)}</div>
                </div>
                <span className="pill">{c.status.replaceAll("_", " ")}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    PAID: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
    PENDING: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
    FAILED: "border-blood-500/50 bg-blood-900/40 text-blood-500",
    REFUNDED: "border-white/20 text-silver-300"
  };
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs uppercase tracking-wider ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}

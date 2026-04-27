import { prisma } from "@/lib/prisma";
import { formatUsd } from "@/lib/format";
import { OrderStatusSelect } from "@/components/OrderStatusSelect";

export const dynamic = "force-dynamic";

export default async function AdminOrders() {
  const orders = await prisma.order.findMany({
    include: { user: true, items: { include: { product: true } } },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return (
    <div>
      <h2 className="heading-display text-2xl text-silver-100">Orders ({orders.length})</h2>
      <div className="mt-4 space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="glass-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-mono text-xs text-silver-400">
                  #{o.id.slice(0, 8)} · {o.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </div>
                <div className="text-silver-100">{o.user.email}</div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-silver-100">{formatUsd(o.totalUsdCents)}</span>
                <span className="pill">{o.provider}</span>
                <OrderStatusSelect orderId={o.id} status={o.status} />
              </div>
            </div>
            <ul className="mt-3 divide-y divide-white/5 text-sm">
              {o.items.map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2">
                  <span className="text-silver-200">{i.product.title}</span>
                  <span className="font-mono text-xs text-silver-400">{i.quantity}× · {formatUsd(i.priceUsdCents)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

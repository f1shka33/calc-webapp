import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatRub, formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: { include: { product: true } }, downloads: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <h2 className="heading-display text-2xl text-silver-100">All orders</h2>
      {orders.length === 0 ? (
        <div className="mt-4 glass-card p-6 text-sm text-silver-300">No orders yet.</div>
      ) : (
        <div className="mt-4 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="glass-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-mono text-xs text-silver-400">
                    #{o.id.slice(0, 8)} · {o.createdAt.toISOString().slice(0, 10)}
                  </div>
                  <div className="heading-display text-lg text-silver-100">
                    {formatUsd(o.totalUsdCents)}{" "}
                    <span className="text-silver-400">/ {formatRub(o.totalRubKop)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="pill">{o.provider}</span>
                  <span className="pill">{o.status}</span>
                </div>
              </div>
              <ul className="mt-4 divide-y divide-white/5 text-sm">
                {o.items.map((it) => {
                  const dl = o.downloads.find((d) => d.productId === it.productId);
                  return (
                    <li key={it.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="text-silver-100">{it.product.title}</div>
                        <div className="font-mono text-xs text-silver-400">
                          {it.quantity}× · {formatUsd(it.priceUsdCents)}
                        </div>
                      </div>
                      {o.status === "PAID" && dl ? (
                        <a href={`/api/downloads/${dl.token}`} className="btn-primary">
                          Download
                        </a>
                      ) : o.status === "PENDING" ? (
                        <span className="pill">Awaiting payment</span>
                      ) : (
                        <span className="pill">Unavailable</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

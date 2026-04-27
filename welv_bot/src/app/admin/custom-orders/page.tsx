import { prisma } from "@/lib/prisma";
import { CustomOrderStatusSelect } from "@/components/CustomOrderStatusSelect";

export const dynamic = "force-dynamic";

export default async function AdminCustomOrders() {
  const orders = await prisma.customOrder.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <h2 className="heading-display text-2xl text-silver-100">Custom orders ({orders.length})</h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {orders.map((c) => (
          <article key={c.id} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-xs text-silver-400">
                  #{c.id.slice(0, 8)} · {c.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </div>
                <div className="heading-display text-lg text-silver-100">
                  {c.artistName}
                  {c.trackName && <span className="text-silver-400"> — {c.trackName}</span>}
                </div>
                <div className="text-xs text-silver-400">{c.email}</div>
              </div>
              <CustomOrderStatusSelect id={c.id} status={c.status} />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-silver-300">
              <Row label="Type" value={c.type} />
              <Row label="Genre" value={c.genre} />
              <Row label="Mood" value={c.mood} />
              <Row label="Budget" value={c.budget} />
              <Row label="Deadline" value={c.deadline} />
              <Row label="Plugins" value={c.plugins} />
            </dl>
            {c.references && (
              <div className="mt-3 rounded-xl border border-white/5 bg-ink-900/60 p-3 text-xs text-silver-200">
                <div className="font-mono uppercase tracking-widest text-blood-500">References</div>
                <div className="mt-1 whitespace-pre-line">{c.references}</div>
              </div>
            )}
            {c.comments && (
              <div className="mt-2 rounded-xl border border-white/5 bg-ink-900/60 p-3 text-xs text-silver-200">
                <div className="font-mono uppercase tracking-widest text-blood-500">Notes</div>
                <div className="mt-1 whitespace-pre-line">{c.comments}</div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-silver-400">{label}</div>
      <div>{value}</div>
    </div>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function MyCustomOrders() {
  const user = await requireUser();
  const orders = await prisma.customOrder.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="heading-display text-2xl text-silver-100">Your custom orders</h2>
        <Link href="/custom-order" className="btn-outline">Create new</Link>
      </div>
      {orders.length === 0 ? (
        <div className="mt-4 glass-card p-6 text-sm text-silver-300">
          You haven&apos;t opened a custom request yet.{" "}
          <Link href="/custom-order" className="text-blood-500 hover:underline">
            Start one
          </Link>
          .
        </div>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {orders.map((o) => (
            <article key={o.id} className="glass-card p-5">
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs text-silver-400">
                  #{o.id.slice(0, 8)} · {o.createdAt.toISOString().slice(0, 10)}
                </div>
                <span className="pill">{o.status.replaceAll("_", " ")}</span>
              </div>
              <h3 className="mt-2 heading-display text-lg text-silver-100">
                {o.artistName}
                {o.trackName && <span className="text-silver-400"> — {o.trackName}</span>}
              </h3>
              <p className="mt-1 text-sm text-silver-300">
                <span className="text-blood-500">{o.type}</span>
                {o.genre && <> · {o.genre}</>}
                {o.mood && <> · {o.mood}</>}
              </p>
              {o.comments && <p className="mt-2 text-xs text-silver-400">{o.comments}</p>}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

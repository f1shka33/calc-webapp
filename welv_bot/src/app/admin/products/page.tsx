import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatUsd } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" }
  });
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="heading-display text-2xl text-silver-100">Products ({products.length})</h2>
        <Link href="/admin/products/new" className="btn-primary">New product</Link>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/5">
        <table className="min-w-full text-sm">
          <thead className="bg-ink-900/60 text-left text-[10px] uppercase tracking-widest text-silver-400">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Format</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Pop.</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.map((p) => (
              <tr key={p.id} className="text-silver-200">
                <td className="px-4 py-3">
                  <div className="text-silver-100">{p.title}</div>
                  <div className="font-mono text-xs text-silver-400">{p.slug}</div>
                </td>
                <td className="px-4 py-3">{p.category.name}</td>
                <td className="px-4 py-3 font-mono">{formatUsd(p.priceUsdCents)}</td>
                <td className="px-4 py-3">{p.format}</td>
                <td className="px-4 py-3">{p.featured ? "✓" : ""}</td>
                <td className="px-4 py-3 font-mono">{p.popularity}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/products/${p.id}`} className="text-blood-500 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

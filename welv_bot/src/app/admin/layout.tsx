import Link from "next/link";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/custom-orders", label: "Custom orders" },
  { href: "/admin/users", label: "Users" }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="container-x py-12">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-blood-500">▸ Admin</div>
          <h1 className="heading-display text-4xl text-silver-100">Control room</h1>
        </div>
      </div>
      <nav className="mt-6 flex flex-wrap gap-2 border-b border-white/5 pb-3">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-full px-4 py-1.5 text-xs uppercase tracking-wider text-silver-300 hover:bg-white/5 hover:text-white"
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="mt-8">{children}</div>
    </div>
  );
}

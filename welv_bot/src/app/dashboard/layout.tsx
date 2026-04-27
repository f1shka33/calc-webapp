import Link from "next/link";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

const TABS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/orders", label: "Orders" },
  { href: "/dashboard/custom-orders", label: "Custom orders" },
  { href: "/dashboard/settings", label: "Settings" }
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <div className="container-x py-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-blood-500">▸ Dashboard</div>
          <h1 className="heading-display text-4xl text-silver-100">
            {user.name ?? "Artist"}<span className="text-blood-500">.</span>
          </h1>
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

"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/cn";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/catalog", label: "Store" },
  { href: "/custom-order", label: "Custom Order" },
  { href: "/ai-brief", label: "AI Brief" }
];

export function Header() {
  const { data } = useSession();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-blood-600/60 bg-blood-900/40 text-blood-500 shadow-glow">
            <span className="font-display text-lg leading-none">W</span>
            <span className="absolute -inset-px rounded-md ring-1 ring-blood-500/30" />
          </span>
          <span className="heading-display text-xl text-silver-100">
            welv<span className="text-blood-500">_</span>bot
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium uppercase tracking-wider transition",
                  active
                    ? "bg-white/5 text-white"
                    : "text-silver-300 hover:bg-white/5 hover:text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {data?.user ? (
            <>
              {data.user.role === "ADMIN" && (
                <Link href="/admin" className="btn-ghost hidden sm:inline-flex">
                  Admin
                </Link>
              )}
              <Link href="/dashboard" className="btn-ghost hidden sm:inline-flex">
                Dashboard
              </Link>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="btn-primary">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost hidden sm:inline-flex">
                Login
              </Link>
              <Link href="/signup" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

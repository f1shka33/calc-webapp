"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wallet,
  LayoutDashboard,
  Receipt,
  Gamepad2,
  Bomb,
  CircleDot,
  Rocket,
  User2,
  Settings as SettingsIcon,
  Shield,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wallet", label: "Wallet", icon: Wallet },
  { href: "/transactions", label: "Transactions", icon: Receipt },
  { href: "/games", label: "Games", icon: Gamepad2 },
];

const GAMES = [
  { href: "/games/roulette", label: "Roulette", icon: CircleDot },
  { href: "/games/crash", label: "Crash", icon: Rocket },
  { href: "/games/mines", label: "Mines", icon: Bomb },
];

const FOOTER_NAV = [
  { href: "/profile", label: "Profile", icon: User2 },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
  { href: "/admin", label: "Admin", icon: Shield },
];

function NavItem({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 h-10 px-3 rounded-xl text-sm transition-all relative",
        active
          ? "text-white bg-white/[0.06] border border-border-soft shadow-glowSoft"
          : "text-white/55 hover:text-white hover:bg-white/[0.04]",
      )}
    >
      {active && (
        <motion.span
          layoutId="navActive"
          className="absolute inset-0 rounded-xl ring-1 ring-accent/40 pointer-events-none"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function SidebarContent() {
  const pathname = usePathname();
  const username = useStore((s) => s.user?.username);
  const isAdmin = useStore((s) => s.user?.isAdmin);
  return (
    <div className="flex flex-col gap-4 h-full">
      <Link href="/" className="flex items-center gap-2.5 px-1.5 pt-1">
        <div className="w-9 h-9 rounded-xl bg-gradient-accent shadow-glow grid place-items-center">
          <span className="text-[11px] font-black tracking-widest text-white">WLV</span>
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-[15px] font-semibold">Welv Sandbox</span>
          <span className="text-[10.5px] text-white/40 tracking-wider uppercase">
            created by welv_bot
          </span>
        </div>
      </Link>

      <div className="glass px-3 py-2.5 mt-1 flex items-center gap-2 text-[11px]">
        <span className="badge-demo">Demo</span>
        <span className="text-white/55">All data is sandbox-only.</span>
      </div>

      <nav className="flex flex-col gap-1 mt-1">
        {NAV.map((it) => (
          <NavItem
            key={it.href}
            href={it.href}
            label={it.label}
            Icon={it.icon}
            active={pathname === it.href}
          />
        ))}
        <div className="px-3 mt-3 mb-1 label">Games</div>
        {GAMES.map((it) => (
          <NavItem
            key={it.href}
            href={it.href}
            label={it.label}
            Icon={it.icon}
            active={pathname === it.href}
          />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1">
        <div className="px-3 mb-1 label">Account</div>
        {FOOTER_NAV.map((it) => (
          <NavItem
            key={it.href}
            href={it.href}
            label={it.label}
            Icon={it.icon}
            active={pathname === it.href || (it.href === "/admin" && pathname.startsWith("/admin"))}
          />
        ))}

        <div className="glass-strong p-3 mt-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-accent grid place-items-center text-xs font-bold">
            {(username ?? "G").slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{username ?? "Guest"}</div>
            <div className="text-[11px] text-white/45 truncate">
              {isAdmin ? "sandbox admin" : "sandbox player"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen: boolean;
  onClose: () => void;
}) {
  return (
    <>
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[248px] p-4 border-r border-border-soft bg-black/30 backdrop-blur-xl z-40">
        <div className="w-full">
          <SidebarContent />
        </div>
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="relative w-[280px] h-full bg-bg-soft border-r border-border-soft p-4"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 grid place-items-center rounded-lg hover:bg-white/[0.05]"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </motion.aside>
        </div>
      )}
    </>
  );
}

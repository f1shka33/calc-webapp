"use client";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrated = useStore((s) => s.hydrated);
  const animationsEnabled = useStore((s) => s.settings.animationsEnabled);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!hydrated) {
    return (
      <div className="min-h-screen w-full grid place-items-center">
        <div className="glass px-6 py-4 text-sm text-white/70">Loading sandbox…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="lg:pl-[248px] flex flex-col min-h-screen">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 pb-16 pt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={animationsEnabled ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              exit={animationsEnabled ? { opacity: 0, y: -8 } : undefined}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <footer className="px-4 sm:px-6 lg:px-8 py-6 text-[11px] text-white/35 border-t border-border-soft">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>
              Casino Wallet Sandbox · created by{" "}
              <span className="accent-text font-semibold">welv_bot</span>
            </span>
            <span>
              All balances, coins, addresses and transaction hashes are{" "}
              <span className="text-amber-300">demo / sandbox</span>. Not a real wallet, not a real casino, no real
              money.
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

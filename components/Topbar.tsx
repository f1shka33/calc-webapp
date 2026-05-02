"use client";

import { useStore, selectTotalUsd } from "@/lib/store";
import { formatUsd } from "@/lib/utils";
import { Eye, EyeOff, Menu, Search, Sparkles } from "lucide-react";
import { useMemo } from "react";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const total = useStore(selectTotalUsd);
  const hide = useStore((s) => s.settings.hideBalances);
  const updateSettings = useStore((s) => s.updateSettings);
  const username = useStore((s) => s.user?.username);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 6) return "Good night";
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/30 border-b border-border-soft">
      <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-16">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 grid place-items-center rounded-lg hover:bg-white/[0.05]"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden md:flex items-center gap-2 text-sm text-white/55">
          <span>{greeting},</span>
          <span className="text-white font-medium">{username ?? "Guest"}</span>
          <span className="hidden lg:inline-flex chip ml-2 bg-white/[0.04] border border-border-soft text-white/55">
            <Sparkles className="w-3 h-3 text-amber-300" />
            sandbox session
          </span>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-auto">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
            <input
              placeholder="Search demo coins, tx hashes…"
              className="field !pl-9"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (v) window.location.href = `/transactions?q=${encodeURIComponent(v)}`;
                }
              }}
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="badge-demo hidden sm:inline-flex">Sandbox · welv_bot</span>
          <div className="glass px-3 py-1.5 flex items-center gap-2.5">
            <div className="text-[10px] uppercase tracking-widest text-white/45">Demo Balance</div>
            <div className="tabular text-sm font-semibold">
              {hide ? "•••••••" : formatUsd(total)}
            </div>
            <button
              onClick={() => updateSettings({ hideBalances: !hide })}
              className="text-white/45 hover:text-white"
              aria-label={hide ? "Show balances" : "Hide balances"}
            >
              {hide ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

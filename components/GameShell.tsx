"use client";

import { ReactNode } from "react";
import { GlassCard, SandboxNote } from "./GlassCard";
import { useStore } from "@/lib/store";
import { CoinIcon } from "./CoinIcon";
import { formatCoin } from "@/lib/utils";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function GameShell({
  title,
  description,
  children,
  selectedCoinId,
  setSelectedCoinId,
}: {
  title: string;
  description: string;
  children: ReactNode;
  selectedCoinId: string;
  setSelectedCoinId: (id: string) => void;
}) {
  const coins = useStore((s) => s.coins);
  return (
    <div className="max-w-6xl mx-auto w-full space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/games" className="text-white/55 hover:text-white inline-flex items-center gap-1 text-sm">
          <ChevronLeft className="w-4 h-4" /> Games
        </Link>
        <span className="badge-demo">Sandbox · welv_bot</span>
      </div>

      <GlassCard className="!p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{title}</h1>
            <p className="text-[13px] text-white/55 mt-1 max-w-md">{description}</p>
            <div className="mt-2"><SandboxNote>All bets use demo balance only.</SandboxNote></div>
          </div>
          <div className="glass !p-2 flex items-center gap-1.5 flex-wrap max-w-full">
            {coins.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCoinId(c.id)}
                className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg text-[12px] transition-all ${selectedCoinId === c.id ? "bg-accent/15 ring-1 ring-accent/40" : "hover:bg-white/[0.04]"}`}
              >
                <CoinIcon coin={c} size={22} />
                <div className="text-left">
                  <div className="font-semibold leading-none">{c.symbol}</div>
                  <div className="tabular text-[10.5px] text-white/55 leading-tight">
                    {formatCoin(c.balance, c.symbol)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </GlassCard>

      {children}
    </div>
  );
}

export function BetInput({
  value,
  onChange,
  max,
  symbol,
}: {
  value: number;
  onChange: (v: number) => void;
  max: number;
  symbol: string;
}) {
  return (
    <div>
      <div className="label mb-1.5">Bet ({symbol})</div>
      <div className="flex items-center gap-2">
        <input
          inputMode="decimal"
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="field tabular flex-1"
          placeholder="0.00"
        />
        <button
          className="btn-outline !px-3 !h-11"
          onClick={() => onChange(Math.max(0.0001, +(value / 2).toFixed(4)))}
          type="button"
        >
          ½
        </button>
        <button
          className="btn-outline !px-3 !h-11"
          onClick={() => onChange(Math.min(max, +(value * 2).toFixed(4)))}
          type="button"
        >
          2×
        </button>
        <button
          className="btn-outline !px-3 !h-11"
          onClick={() => onChange(+max.toFixed(4))}
          type="button"
        >
          Max
        </button>
      </div>
      <div className="text-[11px] text-white/45 mt-1.5 tabular">
        Available: {formatCoin(max, symbol)} (sandbox)
      </div>
    </div>
  );
}

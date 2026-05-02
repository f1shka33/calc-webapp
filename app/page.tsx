"use client";

import { GlassCard, SandboxNote, SectionTitle } from "@/components/GlassCard";
import { useStore, selectTotalUsd } from "@/lib/store";
import { formatCoin, formatUsd } from "@/lib/utils";
import { CoinIcon } from "@/components/CoinIcon";
import Link from "next/link";
import { TxRow } from "@/components/TxRow";
import { QuickActions } from "@/components/QuickActions";
import { BalanceChart } from "@/components/BalanceChart";
import { ArrowUpRight, Trophy, TrendingDown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/Empty";
import { Receipt } from "lucide-react";

export default function DashboardPage() {
  const coins = useStore((s) => s.coins);
  const total = useStore(selectTotalUsd);
  const txs = useStore((s) => s.transactions);
  const stats = useStore((s) => s.user?.stats);
  const hide = useStore((s) => s.settings.hideBalances);

  const recent = txs.slice(0, 6);
  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const winrate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      {/* Hero balance */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong relative overflow-hidden p-6 sm:p-8"
      >
        <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
        <div className="relative grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-demo">Demo · sandbox</span>
              <span className="chip bg-white/[0.04] border border-border-soft text-white/60">
                <Sparkles className="w-3 h-3 text-amber-300" /> created by welv_bot
              </span>
            </div>
            <div className="text-[12px] uppercase tracking-[0.18em] text-white/45">
              Total demo balance
            </div>
            <div className="mt-1 flex items-baseline gap-3">
              <div className="tabular text-4xl sm:text-5xl font-semibold tracking-tight">
                {hide ? "•••••••" : formatUsd(total)}
              </div>
              <div className="hidden sm:block text-sm text-white/45">USD-equivalent (sandbox rates)</div>
            </div>
            <div className="mt-5">
              <QuickActions />
            </div>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/40 mb-1">
              30-day demo activity
            </div>
            <BalanceChart />
          </div>
        </div>
      </motion.div>

      {/* Coin cards */}
      <div>
        <SectionTitle
          title="Your coins"
          subtitle="Fictional sandbox tickers — not real cryptocurrencies."
          right={
            <Link href="/wallet" className="text-[12px] text-white/55 hover:text-white inline-flex items-center gap-1">
              Open wallet <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {coins.slice(0, 6).map((c) => (
            <GlassCard key={c.id} className="relative overflow-hidden">
              <div
                className="absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-25 blur-2xl"
                style={{ background: `linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})` }}
              />
              <div className="relative flex items-center gap-3">
                <CoinIcon coin={c} size={42} />
                <div className="min-w-0">
                  <div className="font-semibold leading-tight">{c.name}</div>
                  <div className="text-[12px] text-white/50">
                    {c.symbol} · ${c.unitPrice.toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="relative mt-4 flex items-end justify-between">
                <div>
                  <div className="label">Balance</div>
                  <div className="tabular text-xl font-semibold mt-0.5">
                    {hide ? "•••••" : formatCoin(c.balance, c.symbol)}
                  </div>
                </div>
                <div className="tabular text-sm text-white/55">
                  ≈ {hide ? "•••" : formatUsd(c.balance * c.unitPrice)}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Stats & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-4">
        <GlassCard>
          <SectionTitle title="Game stats" subtitle="All games are sandbox-only." />
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Played" value={stats?.gamesPlayed ?? 0} />
            <Stat label="Wins" value={wins} accent="emerald" icon={<Trophy className="w-3.5 h-3.5" />} />
            <Stat label="Losses" value={losses} accent="rose" icon={<TrendingDown className="w-3.5 h-3.5" />} />
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-[12px] mb-1.5">
              <span className="text-white/55">Win rate</span>
              <span className="tabular font-medium">{winrate.toFixed(1)}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden">
              <motion.div
                className="h-full bg-gradient-accent"
                initial={{ width: 0 }}
                animate={{ width: `${winrate}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
            <KV label="Total wagered (demo)" value={formatCoin(stats?.totalWagered ?? 0, "WLV")} />
            <KV label="Total won (demo)" value={formatCoin(stats?.totalWon ?? 0, "WLV")} />
          </div>
          <div className="mt-4">
            <SandboxNote />
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle
            title="Recent transactions"
            subtitle="All entries are sandbox-only with fake hashes."
            right={
              <Link
                href="/transactions"
                className="text-[12px] text-white/55 hover:text-white inline-flex items-center gap-1"
              >
                View all <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          {recent.length === 0 ? (
            <EmptyState
              icon={<Receipt className="w-5 h-5" />}
              title="No transactions yet"
              description="Try a demo deposit, send, or play a game on your sandbox balance."
            />
          ) : (
            <div className="-mx-2">
              {recent.map((tx) => (
                <TxRow key={tx.id} tx={tx} dense />
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
  icon,
}: {
  label: string;
  value: number;
  accent?: "emerald" | "rose";
  icon?: React.ReactNode;
}) {
  const color =
    accent === "emerald"
      ? "text-emerald-300"
      : accent === "rose"
        ? "text-rose-300"
        : "text-white";
  return (
    <div className="glass !p-3 text-center">
      <div className={`tabular text-2xl font-semibold ${color} flex items-center justify-center gap-1.5`}>
        {icon}
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-white/45 mt-1">{label}</div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass !p-3 flex items-center justify-between">
      <div className="text-white/55">{label}</div>
      <div className="tabular font-medium">{value}</div>
    </div>
  );
}

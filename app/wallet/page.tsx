"use client";

import { GlassCard, SandboxNote, SectionTitle } from "@/components/GlassCard";
import { CoinIcon } from "@/components/CoinIcon";
import { ConvertModal, DepositModal, SendModal } from "@/components/DepositSendModals";
import { selectTotalUsd, useStore } from "@/lib/store";
import { formatCoin, formatUsd } from "@/lib/utils";
import { ArrowDownToLine, ArrowUpRight, Repeat } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function WalletPage() {
  const coins = useStore((s) => s.coins);
  const total = useStore(selectTotalUsd);
  const hide = useStore((s) => s.settings.hideBalances);

  const [active, setActive] = useState<{
    type: "deposit" | "send" | "convert" | null;
    coinId?: string;
  }>({ type: null });

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6">
      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <GlassCard className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-demo">Sandbox · Not real</span>
              <span className="chip bg-white/[0.04] border border-border-soft text-white/55">
                created by welv_bot
              </span>
            </div>
            <div className="label">Total demo balance</div>
            <div className="tabular text-4xl sm:text-5xl font-semibold mt-1">
              {hide ? "•••••••" : formatUsd(total)}
            </div>
            <div className="text-[12px] text-white/45 mt-1">
              Sum of all fictional coins, valued at sandbox rates.
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn-primary" onClick={() => setActive({ type: "deposit" })}>
                <ArrowDownToLine className="w-4 h-4" /> Demo Deposit
              </button>
              <button className="btn-ghost" onClick={() => setActive({ type: "send" })}>
                <ArrowUpRight className="w-4 h-4" /> Demo Send
              </button>
              <button className="btn-ghost" onClick={() => setActive({ type: "convert" })}>
                <Repeat className="w-4 h-4" /> Convert
              </button>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Sandbox safety" subtitle="What this app is — and isn't." />
          <ul className="space-y-2 text-[13px] text-white/65">
            <li>· No real cryptocurrency, blockchain, or exchange.</li>
            <li>· No real money is ever accepted, sent, or stored.</li>
            <li>· Coin tickers are fictional. Logos are abstract gradients.</li>
            <li>· Addresses & tx hashes are randomly generated and labeled <span className="text-amber-300">fake</span>.</li>
          </ul>
          <div className="mt-3"><SandboxNote /></div>
        </GlassCard>
      </div>

      <div>
        <SectionTitle title="Your coins" subtitle="All balances are sandbox demo values." />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {coins.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <GlassCard className="relative overflow-hidden">
                <div
                  className="absolute -right-8 -top-12 w-44 h-44 rounded-full opacity-25 blur-2xl"
                  style={{ background: `linear-gradient(135deg, ${c.gradient[0]}, ${c.gradient[1]})` }}
                />
                <div className="relative flex items-center gap-3">
                  <CoinIcon coin={c} size={46} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold leading-tight truncate">{c.name}</div>
                      {c.isCustom && <span className="badge-demo">custom · fake</span>}
                    </div>
                    <div className="text-[12px] text-white/50">
                      {c.symbol} · ${c.unitPrice.toLocaleString()} (sandbox)
                    </div>
                  </div>
                </div>
                <div className="relative mt-4 flex items-end justify-between">
                  <div>
                    <div className="label">Balance</div>
                    <div className="tabular text-xl font-semibold mt-0.5">
                      {hide ? "•••••" : formatCoin(c.balance, c.symbol)}
                    </div>
                    <div className="tabular text-[12px] text-white/45 mt-0.5">
                      ≈ {hide ? "•••" : formatUsd(c.balance * c.unitPrice)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <button
                      className="btn-outline !h-8 !px-2.5 text-[12px]"
                      onClick={() => setActive({ type: "deposit", coinId: c.id })}
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" /> Deposit
                    </button>
                    <button
                      className="btn-outline !h-8 !px-2.5 text-[12px]"
                      onClick={() => setActive({ type: "send", coinId: c.id })}
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Send
                    </button>
                    <button
                      className="btn-outline !h-8 !px-2.5 text-[12px]"
                      onClick={() => setActive({ type: "convert", coinId: c.id })}
                    >
                      <Repeat className="w-3.5 h-3.5" /> Convert
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>

      <DepositModal
        open={active.type === "deposit"}
        onClose={() => setActive({ type: null })}
        initialCoinId={active.coinId}
      />
      <SendModal
        open={active.type === "send"}
        onClose={() => setActive({ type: null })}
        initialCoinId={active.coinId}
      />
      <ConvertModal
        open={active.type === "convert"}
        onClose={() => setActive({ type: null })}
        initialFromId={active.coinId}
      />
    </div>
  );
}

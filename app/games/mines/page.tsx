"use client";

import { GlassCard, SectionTitle } from "@/components/GlassCard";
import { BetInput, GameShell } from "@/components/GameShell";
import { minesMultiplier } from "@/lib/games";
import { useStore } from "@/lib/store";
import { Bomb, Gem } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const GRID = 25;

export default function MinesPage() {
  const coins = useStore((s) => s.coins);
  const settings = useStore((s) => s.gameSettings.mines);
  const apply = useStore((s) => s.applyGameOutcome);

  const [coinId, setCoinId] = useState(coins[0]?.id ?? "");
  const coin = coins.find((c) => c.id === coinId);
  const [bet, setBet] = useState(1);
  const [mineCount, setMineCount] = useState(3);

  const [active, setActive] = useState(false);
  const [bomb, setBomb] = useState<Set<number>>(new Set());
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [exploded, setExploded] = useState<number | null>(null);
  const [resolved, setResolved] = useState<"win" | "loss" | null>(null);

  // Lock the wager when a round starts so changing coin/bet mid-round can't
  // route the outcome to the wrong coin or amount.
  const roundCoinIdRef = useRef<string>("");
  const roundBetRef = useRef<number>(0);

  const safePicks = revealed.size;
  const currentMultiplier = active
    ? minesMultiplier(safePicks, mineCount, settings.houseEdge)
    : 1;
  const nextMultiplier = active
    ? minesMultiplier(safePicks + 1, mineCount, settings.houseEdge)
    : minesMultiplier(1, mineCount, settings.houseEdge);

  function start() {
    if (!coin) return;
    if (bet <= 0) return toast.error("Bet must be positive");
    if (bet > coin.balance) return toast.error("Not enough demo balance");
    if (mineCount < 1 || mineCount > 24) return toast.error("Mines must be 1–24");

    const indices = Array.from({ length: GRID }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    const bombs = new Set(indices.slice(0, mineCount));

    setBomb(bombs);
    setRevealed(new Set());
    setExploded(null);
    setResolved(null);
    roundCoinIdRef.current = coinId;
    roundBetRef.current = bet;
    setActive(true);
  }

  function reveal(idx: number) {
    if (!active || revealed.has(idx)) return;
    if (bomb.has(idx)) {
      setExploded(idx);
      setRevealed(new Set([...revealed, idx]));
      setActive(false);
      setResolved("loss");
      const lockedCoinId = roundCoinIdRef.current;
      const lockedBet = roundBetRef.current;
      const lockedCoin = coins.find((c) => c.id === lockedCoinId);
      apply({
        coinId: lockedCoinId,
        bet: lockedBet,
        payout: 0,
        game: "mines",
        note: `Mines · hit a bomb after ${revealed.size} safe picks (sandbox).`,
      });
      toast.error("Mines · BOOM", {
        description: `Lost ${lockedBet} ${lockedCoin?.symbol ?? ""} (sandbox).`,
      });
      return;
    }
    setRevealed(new Set([...revealed, idx]));
  }

  function cashOut() {
    if (!active || revealed.size === 0) return;
    setActive(false);
    setResolved("win");
    const lockedCoinId = roundCoinIdRef.current;
    const lockedBet = roundBetRef.current;
    const lockedCoin = coins.find((c) => c.id === lockedCoinId);
    if (!lockedCoin) return;
    const payout = +(lockedBet * currentMultiplier).toFixed(6);
    apply({
      coinId: lockedCoinId,
      bet: lockedBet,
      payout,
      game: "mines",
      note: `Mines · cashed out at ${currentMultiplier.toFixed(2)}× (${revealed.size} picks, sandbox).`,
    });
    toast.success(`Mines · cashed out at ${currentMultiplier.toFixed(2)}×`, {
      description: `+${(payout - lockedBet).toFixed(4)} ${lockedCoin.symbol} (sandbox).`,
    });
  }

  function forfeit() {
    if (!active) return;
    setActive(false);
    setResolved("loss");
    const lockedCoinId = roundCoinIdRef.current;
    const lockedBet = roundBetRef.current;
    const lockedCoin = coins.find((c) => c.id === lockedCoinId);
    if (!lockedCoin) return;
    apply({
      coinId: lockedCoinId,
      bet: lockedBet,
      payout: 0,
      game: "mines",
      note: `Mines · forfeited after ${revealed.size} safe picks (sandbox).`,
    });
    toast("Mines · forfeited", {
      description: `Lost ${lockedBet} ${lockedCoin.symbol} (sandbox).`,
    });
  }

  return (
    <GameShell
      title="Mines"
      description="Reveal safe cells to grow your multiplier. Hit a bomb and lose your bet. Sandbox only."
      selectedCoinId={coinId}
      setSelectedCoinId={setCoinId}
      locked={active}
    >
      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4">
        <GlassCard className="!p-6">
          <div className="grid grid-cols-5 gap-2 max-w-[440px] mx-auto">
            {Array.from({ length: GRID }, (_, i) => {
              const isRevealed = revealed.has(i);
              const isBomb = bomb.has(i);
              const showBomb = !active && isBomb && resolved !== null;
              return (
                <motion.button
                  key={i}
                  whileHover={{ scale: active && !isRevealed ? 1.04 : 1 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => reveal(i)}
                  disabled={!active || isRevealed}
                  className={`aspect-square rounded-xl border transition-all flex items-center justify-center relative overflow-hidden ${
                    isRevealed && !isBomb
                      ? "bg-emerald-500/10 border-emerald-400/30"
                      : showBomb && exploded === i
                        ? "bg-rose-500/20 border-rose-400/50"
                        : showBomb
                          ? "bg-rose-500/10 border-rose-400/20 opacity-70"
                          : isRevealed && isBomb
                            ? "bg-rose-500/20 border-rose-400/50"
                            : "bg-white/[0.03] border-border-soft hover:bg-white/[0.06]"
                  }`}
                >
                  {isRevealed && !isBomb && (
                    <Gem className="w-5 h-5 text-emerald-300" />
                  )}
                  {(showBomb || (isRevealed && isBomb)) && (
                    <Bomb className="w-5 h-5 text-rose-300" />
                  )}
                </motion.button>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
            <Stat label="Picks" value={`${safePicks}`} />
            <Stat label="Mines" value={`${mineCount}`} />
            <Stat
              label="Current ×"
              value={`${currentMultiplier.toFixed(2)}×`}
              accent="emerald"
            />
            <Stat
              label="Next ×"
              value={`${nextMultiplier.toFixed(2)}×`}
              accent="amber"
            />
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Round" subtitle="Sandbox-only." />
          <div className="space-y-4">
            {coin && (
              <BetInput value={bet} onChange={setBet} max={coin.balance} symbol={coin.symbol} />
            )}
            <div>
              <div className="label mb-1.5">Mines</div>
              <input
                type="number"
                min={1}
                max={24}
                value={mineCount}
                onChange={(e) => setMineCount(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
                className="field tabular"
                disabled={active}
              />
              <div className="text-[11px] text-white/45 mt-1">More mines → higher multipliers, higher risk.</div>
            </div>

            {!active ? (
              <button onClick={start} className="btn-primary w-full !h-12">
                Start round (sandbox)
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={cashOut}
                  disabled={revealed.size === 0}
                  className="btn-primary !h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cash out {currentMultiplier.toFixed(2)}×
                </button>
                <button onClick={forfeit} className="btn-outline !h-12">
                  Forfeit (lose bet)
                </button>
              </div>
            )}

            {resolved && (
              <div className="text-[12px] text-white/55">
                Round ended:{" "}
                <span className={resolved === "win" ? "text-emerald-300" : "text-rose-300"}>
                  {resolved === "win" ? "cashed out" : "busted"}
                </span>
                . Start a new round to play again.
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </GameShell>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "emerald" | "amber";
}) {
  const color =
    accent === "emerald"
      ? "text-emerald-300"
      : accent === "amber"
        ? "text-amber-300"
        : "text-white";
  return (
    <div className="glass !p-2.5 text-center min-w-[80px]">
      <div className={`tabular text-base font-semibold ${color}`}>{value}</div>
      <div className="text-[10.5px] uppercase tracking-wider text-white/45">{label}</div>
    </div>
  );
}

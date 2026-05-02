"use client";

import { GlassCard, SectionTitle } from "@/components/GlassCard";
import { BetInput, GameShell } from "@/components/GameShell";
import { sampleCrashMultiplier } from "@/lib/games";
import { useStore } from "@/lib/store";
import { uid } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type Phase = "idle" | "running" | "crashed" | "cashed";

export default function CrashPage() {
  const coins = useStore((s) => s.coins);
  const settings = useStore((s) => s.gameSettings.crash);
  const apply = useStore((s) => s.applyGameOutcome);
  const pushRound = useStore((s) => s.pushCrashRound);
  const history = useStore((s) => s.crashHistory);

  const [coinId, setCoinId] = useState(coins[0]?.id ?? "");
  const coin = coins.find((c) => c.id === coinId);
  const [bet, setBet] = useState(1);
  const [autoCashout, setAutoCashout] = useState<number | "">(2);
  const [phase, setPhase] = useState<Phase>("idle");
  const [multiplier, setMultiplier] = useState(1);
  const crashAtRef = useRef<number>(1);
  const animRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const cashedRef = useRef<boolean>(false);
  const phaseRef = useRef<Phase>("idle");
  const autoCashoutRef = useRef<number | "">(2);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    autoCashoutRef.current = autoCashout;
  }, [autoCashout]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  function start() {
    if (!coin) return;
    if (bet <= 0) return toast.error("Bet must be positive");
    if (bet > coin.balance) return toast.error("Not enough demo balance");
    if (phase === "running") return;

    const target = sampleCrashMultiplier(settings);
    crashAtRef.current = target;
    cashedRef.current = false;
    startedAtRef.current = performance.now();
    setMultiplier(1);
    setPhase("running");

    const tick = (now: number) => {
      const t = (now - startedAtRef.current) / 1000;
      // Smooth growth: m = e^(0.18 t) — readable + punchy.
      const m = Math.max(1, +Math.exp(0.18 * t).toFixed(2));
      setMultiplier(m);

      // Crash wins ties: evaluate the crash point first so an auto-cashout
      // equal to the crash multiplier loses, matching standard crash-game fairness.
      if (m >= crashAtRef.current) {
        finish("crashed", crashAtRef.current);
        return;
      }

      const auto = autoCashoutRef.current;
      if (
        typeof auto === "number" &&
        auto > 1 &&
        !cashedRef.current &&
        m >= auto
      ) {
        cashedRef.current = true;
        finish("cashed", auto);
        return;
      }

      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }

  function cashOut() {
    if (phaseRef.current !== "running" || cashedRef.current) return;
    cashedRef.current = true;
    finish("cashed", multiplier);
  }

  function finish(p: "cashed" | "crashed", at: number) {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null;
    setMultiplier(at);
    setPhase(p);
    if (!coin) return;
    const won = p === "cashed";
    const payout = won ? bet * at : 0;
    apply({
      coinId,
      bet,
      payout,
      game: "crash",
      note: won
        ? `Crash · cashed out at ${at.toFixed(2)}× (sandbox).`
        : `Crash · busted at ${at.toFixed(2)}× (sandbox).`,
    });
    pushRound({
      id: uid("cr"),
      crashAt: crashAtRef.current,
      cashedOutAt: won ? at : undefined,
      bet,
      payout,
      createdAt: Date.now(),
    });
    if (won)
      toast.success(`Crash · cashed out at ${at.toFixed(2)}×`, {
        description: `+${(payout - bet).toFixed(4)} ${coin.symbol} (sandbox).`,
      });
    else
      toast.error(`Crash · busted at ${at.toFixed(2)}×`, {
        description: `-${bet} ${coin.symbol} (sandbox).`,
      });
  }

  function reset() {
    setPhase("idle");
    setMultiplier(1);
  }

  const display = multiplier.toFixed(2) + "×";

  return (
    <GameShell
      title="Crash"
      description="The multiplier rises. Cash out before it crashes — or set an auto cash-out. Sandbox only."
      selectedCoinId={coinId}
      setSelectedCoinId={setCoinId}
    >
      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <GlassCard className="!p-0 overflow-hidden relative h-[360px] sm:h-[440px]">
          <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
          <div className="absolute inset-0 grid place-items-center">
            <motion.div
              key={phase + display}
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              className="text-center"
            >
              <div className="text-[10px] uppercase tracking-[0.22em] text-white/45">
                Multiplier
              </div>
              <div
                className={`tabular text-7xl sm:text-8xl font-semibold mt-2 ${
                  phase === "crashed"
                    ? "text-rose-400"
                    : phase === "cashed"
                      ? "text-emerald-300"
                      : "text-white"
                }`}
                style={{
                  textShadow:
                    phase === "running"
                      ? "0 0 40px rgba(255,106,0,0.45)"
                      : phase === "crashed"
                        ? "0 0 40px rgba(244,63,94,0.45)"
                        : "0 0 40px rgba(16,185,129,0.35)",
                }}
              >
                {display}
              </div>
              <div className="text-[12px] text-white/55 mt-2">
                {phase === "idle" && "Place a bet and launch."}
                {phase === "running" && "Cash out before the crash."}
                {phase === "crashed" && (
                  <span className="text-rose-300">
                    Busted at {crashAtRef.current.toFixed(2)}× (sandbox).
                  </span>
                )}
                {phase === "cashed" && (
                  <span className="text-emerald-300">
                    Cashed out at {multiplier.toFixed(2)}× (sandbox).
                  </span>
                )}
              </div>
            </motion.div>
          </div>

          <svg className="absolute bottom-0 left-0 right-0 h-32 w-full text-accent/30">
            <motion.path
              key={phase + multiplier}
              d={`M0 128 Q ${30 + multiplier * 4} ${128 - multiplier * 8} ${Math.min(800, 60 + multiplier * 30)} ${Math.max(0, 128 - multiplier * 28)}`}
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Round" subtitle="All bets are sandbox-only." />
          <div className="space-y-4">
            {coin && (
              <BetInput value={bet} onChange={setBet} max={coin.balance} symbol={coin.symbol} />
            )}
            <div>
              <div className="label mb-1.5">Auto cash out (×)</div>
              <input
                inputMode="decimal"
                value={autoCashout}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") setAutoCashout("");
                  else setAutoCashout(Number(v) || "");
                }}
                placeholder="e.g. 2.5"
                className="field tabular"
              />
              <div className="text-[11px] text-white/45 mt-1">
                Empty disables auto cash-out.
              </div>
            </div>

            {phase === "running" ? (
              <button onClick={cashOut} className="btn-primary w-full !h-12">
                Cash out at {display}
              </button>
            ) : phase === "idle" ? (
              <button onClick={start} className="btn-primary w-full !h-12">
                Launch round (sandbox)
              </button>
            ) : (
              <button onClick={reset} className="btn-ghost w-full !h-12">
                New round
              </button>
            )}
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <SectionTitle title="Recent rounds" />
        {history.length === 0 ? (
          <div className="text-[13px] text-white/55">No rounds yet.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 24).map((r) => {
              const won = r.payout > 0;
              const at = r.cashedOutAt ?? r.crashAt;
              return (
                <div
                  key={r.id}
                  className={`px-2.5 h-8 rounded-lg grid place-items-center text-[12px] font-semibold tabular border ${
                    won
                      ? "bg-emerald-500/10 border-emerald-400/30 text-emerald-300"
                      : "bg-rose-500/10 border-rose-400/30 text-rose-300"
                  }`}
                  title={`bet ${r.bet} · payout ${r.payout.toFixed(2)}`}
                >
                  {at.toFixed(2)}×
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </GameShell>
  );
}

"use client";

import { GlassCard, SectionTitle } from "@/components/GlassCard";
import { BetInput, GameShell } from "@/components/GameShell";
import { useStore } from "@/lib/store";
import { ROULETTE_NUMBERS, ROULETTE_WHEEL, rouletteColor, spinRoulette } from "@/lib/games";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { uid } from "@/lib/utils";

const COLORS: ("red" | "black" | "green")[] = ["red", "black", "green"];
const COLOR_BG: Record<"red" | "black" | "green", string> = {
  red: "linear-gradient(135deg,#FF2D55,#B00021)",
  black: "linear-gradient(135deg,#1c1c1f,#0b0b0d)",
  green: "linear-gradient(135deg,#10B981,#047857)",
};

export default function RoulettePage() {
  const coins = useStore((s) => s.coins);
  const settings = useStore((s) => s.gameSettings.roulette);
  const apply = useStore((s) => s.applyGameOutcome);
  const pushSpin = useStore((s) => s.pushRouletteSpin);
  const history = useStore((s) => s.rouletteHistory);

  const [coinId, setCoinId] = useState(coins[0]?.id ?? "");
  const coin = coins.find((c) => c.id === coinId);
  const [bet, setBet] = useState(1);
  const [betType, setBetType] = useState<"color" | "number">("color");
  const [betColor, setBetColor] = useState<"red" | "black" | "green">("red");
  const [betNumber, setBetNumber] = useState<number>(7);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [resultLog, setResultLog] = useState<string | null>(null);

  /** Cumulative wheel rotation so each spin is additive — produces continuous animation. */
  const [rotation, setRotation] = useState(0);

  const stops = ROULETTE_WHEEL.length;
  const stopAngle = 360 / stops;

  const numberToWheelIdx = useMemo(() => {
    const m = new Map<number, number>();
    ROULETTE_WHEEL.forEach((n, i) => m.set(n, i));
    return m;
  }, []);

  function spin() {
    if (!coin) return;
    if (bet <= 0) return toast.error("Bet must be positive");
    if (bet > coin.balance) return toast.error("Not enough demo balance");

    setSpinning(true);
    setResult(null);
    setResultLog(null);

    const r = spinRoulette(settings);
    const idx = numberToWheelIdx.get(r) ?? 0;
    const targetAngle = -idx * stopAngle;
    const fullSpins = 6 * 360;
    const next = rotation + fullSpins + (targetAngle - (rotation % 360));
    setRotation(next);

    setTimeout(() => {
      setResult(r);
      const c = rouletteColor(r);
      let payout = 0;
      if (betType === "color" && betColor === c) payout = bet * settings.payoutColor;
      if (betType === "number" && betNumber === r) payout = bet * settings.payoutNumber;
      apply({ coinId, bet, payout, game: "roulette" });
      pushSpin({
        id: uid("rl"),
        bet,
        betType,
        betValue: betType === "color" ? betColor : betNumber,
        result: r,
        payout,
        createdAt: Date.now(),
      });
      const won = payout > 0;
      setResultLog(
        won
          ? `Landed on ${r} (${c}). You won ${(payout - bet).toFixed(4)} ${coin.symbol} (sandbox).`
          : `Landed on ${r} (${c}). Lost ${bet.toFixed(4)} ${coin.symbol} (sandbox).`,
      );
      if (won)
        toast.success(`Roulette · WIN`, {
          description: `+${(payout - bet).toFixed(4)} ${coin.symbol} (sandbox).`,
        });
      else toast.error(`Roulette · LOSS`, { description: `-${bet} ${coin.symbol} (sandbox).` });
      setSpinning(false);
    }, 3200);
  }

  return (
    <GameShell
      title="Roulette"
      description="European wheel with 37 pockets (0–36). Bet on a color or a single number. Sandbox-only — no real money."
      selectedCoinId={coinId}
      setSelectedCoinId={setCoinId}
    >
      <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4">
        <GlassCard className="!p-6 grid place-items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
          <div className="relative">
            <div className="relative w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] rounded-full mx-auto">
              <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 rounded-full border border-border-strong"
                style={{
                  background:
                    "conic-gradient(from 0deg," +
                    ROULETTE_WHEEL.map((n, i) => {
                      const c = rouletteColor(n);
                      const start = (i / stops) * 360;
                      const end = ((i + 1) / stops) * 360;
                      const color =
                        c === "red" ? "#FF2D55" : c === "black" ? "#0e0e10" : "#10B981";
                      return `${color} ${start}deg ${end}deg`;
                    }).join(",") +
                    ")",
                  boxShadow: "inset 0 0 60px rgba(0,0,0,0.6),0 0 50px -10px rgba(255,106,0,0.4)",
                }}
              >
                {ROULETTE_WHEEL.map((n, i) => {
                  const angle = i * stopAngle + stopAngle / 2;
                  return (
                    <div
                      key={i}
                      className="absolute top-1/2 left-1/2 origin-[0_0]"
                      style={{
                        transform: `rotate(${angle}deg) translateY(-44%)`,
                      }}
                    >
                      <span
                        className="block text-[10px] font-bold tabular text-white/95"
                        style={{ transform: "translateX(-50%) rotate(0deg)" }}
                      >
                        {n}
                      </span>
                    </div>
                  );
                })}
              </motion.div>
              <div className="absolute inset-[18%] rounded-full bg-bg-soft border border-border-strong grid place-items-center">
                <div className="text-center">
                  <div className="text-[10px] uppercase tracking-widest text-white/45">Result</div>
                  <div className="tabular text-3xl font-semibold mt-1">
                    {result === null ? "—" : result}
                  </div>
                  {result !== null && (
                    <div className={`text-xs capitalize mt-0.5 text-white/65`}>
                      {rouletteColor(result)}
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-[14px] border-l-transparent border-r-transparent border-t-accent drop-shadow-[0_2px_4px_rgba(255,106,0,0.6)]" />
            </div>

            {resultLog && (
              <div className="mt-4 text-center text-[12px] text-white/65">{resultLog}</div>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Place your bet" subtitle="Sandbox only — uses your demo balance." />
          <div className="space-y-4">
            {coin && (
              <BetInput value={bet} onChange={setBet} max={coin.balance} symbol={coin.symbol} />
            )}

            <div>
              <div className="label mb-1.5">Bet type</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`btn ${betType === "color" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setBetType("color")}
                >
                  Color (×{settings.payoutColor})
                </button>
                <button
                  className={`btn ${betType === "number" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setBetType("number")}
                >
                  Number (×{settings.payoutNumber})
                </button>
              </div>
            </div>

            {betType === "color" ? (
              <div>
                <div className="label mb-1.5">Color</div>
                <div className="grid grid-cols-3 gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setBetColor(c)}
                      className={`h-12 rounded-xl border text-sm font-semibold uppercase tracking-wider transition-all ${betColor === c ? "border-accent shadow-glowSoft scale-[1.02]" : "border-border-soft"}`}
                      style={{ background: COLOR_BG[c] }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="label mb-1.5">Number (0–36)</div>
                <div className="grid grid-cols-10 gap-1">
                  {ROULETTE_NUMBERS.map((n) => (
                    <button
                      key={n}
                      onClick={() => setBetNumber(n)}
                      className={`h-8 rounded-md text-[11px] font-semibold tabular border transition-all ${betNumber === n ? "border-accent shadow-glowSoft" : "border-border-soft"}`}
                      style={{ background: COLOR_BG[rouletteColor(n)] }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              disabled={spinning}
              onClick={spin}
              className="btn-primary w-full !h-12 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {spinning ? "Spinning…" : "Spin (sandbox)"}
            </button>
          </div>
        </GlassCard>
      </div>

      <GlassCard>
        <SectionTitle title="Recent spins" />
        {history.length === 0 ? (
          <div className="text-[13px] text-white/55">No spins yet. The wheel awaits.</div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {history.slice(0, 24).map((s) => {
              const c = rouletteColor(s.result);
              return (
                <div
                  key={s.id}
                  className="w-9 h-9 rounded-lg grid place-items-center text-[12px] font-bold tabular border border-border-soft"
                  style={{ background: COLOR_BG[c] }}
                  title={`${s.payout > 0 ? "win" : "loss"} · bet ${s.bet} on ${s.betValue}`}
                >
                  {s.result}
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </GameShell>
  );
}

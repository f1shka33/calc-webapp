import type { GameSettings } from "@/types";

export const ROULETTE_NUMBERS = Array.from({ length: 37 }, (_, i) => i); // 0..36

const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export function rouletteColor(n: number): "red" | "black" | "green" {
  if (n === 0) return "green";
  return REDS.has(n) ? "red" : "black";
}

/** European wheel order (visual only). */
export const ROULETTE_WHEEL = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7,
  28, 12, 35, 3, 26,
];

export function spinRoulette(settings: GameSettings["roulette"]): number {
  // greenChance overrides position 0 occurrence rate so admins can tweak edge.
  if (Math.random() < settings.greenChance) return 0;
  // pick uniformly from non-zero numbers
  const nonZero = Math.floor(Math.random() * 36) + 1;
  return nonZero;
}

/**
 * Sample a crash multiplier from a 1/(1-r) distribution with house edge.
 * P(X >= m) = (1 - houseEdge) / m, capped at maxMultiplier.
 */
export function sampleCrashMultiplier(settings: GameSettings["crash"]): number {
  const r = Math.random();
  const e = Math.max(0, Math.min(0.5, settings.houseEdge));
  if (r < e) return 1; // instant bust
  const m = (1 - e) / (1 - r);
  return Math.max(1, Math.min(settings.maxMultiplier, +m.toFixed(2)));
}

/** Fair (no-edge) Mines multiplier when picking k safe cells from a 25-cell grid with `mines` mines. */
export function fairMinesMultiplier(safePicks: number, mines: number): number {
  const total = 25;
  let m = 1;
  for (let i = 0; i < safePicks; i++) {
    const remaining = total - i;
    const safe = total - mines - i;
    if (safe <= 0) return Number.POSITIVE_INFINITY;
    m *= remaining / safe;
  }
  return m;
}

export function minesMultiplier(safePicks: number, mines: number, houseEdge: number) {
  const fair = fairMinesMultiplier(safePicks, mines);
  return +(fair * (1 - houseEdge)).toFixed(4);
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  roulette: { payoutColor: 2, payoutNumber: 35, greenChance: 1 / 37 },
  crash: { houseEdge: 0.04, maxMultiplier: 1000 },
  mines: { houseEdge: 0.04 },
};

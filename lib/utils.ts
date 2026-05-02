import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number, digits = 2) {
  if (!Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  return value.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatUsd(value: number) {
  return `$${formatNumber(value, 2)}`;
}

export function formatCoin(value: number, symbol: string) {
  return `${formatNumber(value, value < 1 ? 6 : 4)} ${symbol}`;
}

export function shortHash(hash: string, head = 6, tail = 4) {
  if (hash.length <= head + tail + 1) return hash;
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

export function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const s = Math.max(1, Math.floor(diff / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  const y = Math.floor(d / 365);
  return `${y}y ago`;
}

export function uid(prefix = "id") {
  const r = Math.random().toString(36).slice(2, 10);
  const t = Date.now().toString(36).slice(-6);
  return `${prefix}_${t}${r}`;
}

/** Random hex string of length n. */
export function randomHex(n: number) {
  const chars = "0123456789abcdef";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function fakeAddress() {
  // Clearly-fake prefix `sbx1` makes it impossible to confuse with a real address.
  return `sbx1${randomHex(38)}`;
}

export function fakeTxHash() {
  return `0xDEMO${randomHex(56)}`;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

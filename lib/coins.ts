import type { Coin } from "@/types";

/**
 * Deliberately fictional sandbox coins. Names, tickers, and "prices" are made up
 * and do not correspond to any real cryptocurrency or token.
 */
export const DEFAULT_COINS: Coin[] = [
  {
    id: "wlv",
    symbol: "WLV",
    name: "Welv Coin",
    color: "#FF6A00",
    unitPrice: 42.5,
    balance: 250,
    gradient: ["#FF8A3D", "#FF2D55"],
  },
  {
    id: "orx",
    symbol: "ORX",
    name: "Orix",
    color: "#7B61FF",
    unitPrice: 1.85,
    balance: 1820,
    gradient: ["#9C7BFF", "#5236C8"],
  },
  {
    id: "neb",
    symbol: "NEB",
    name: "Nebulon",
    color: "#22D3EE",
    unitPrice: 0.42,
    balance: 9450,
    gradient: ["#22D3EE", "#0EA5E9"],
  },
  {
    id: "zio",
    symbol: "ZIO",
    name: "Zion Note",
    color: "#10B981",
    unitPrice: 12.4,
    balance: 64,
    gradient: ["#34D399", "#059669"],
  },
  {
    id: "lux",
    symbol: "LUX",
    name: "Luxor",
    color: "#F59E0B",
    unitPrice: 188.2,
    balance: 3.2,
    gradient: ["#FBBF24", "#D97706"],
  },
  {
    id: "kry",
    symbol: "KRY",
    name: "Krypton-X",
    color: "#EC4899",
    unitPrice: 0.018,
    balance: 184_500,
    gradient: ["#F472B6", "#BE185D"],
  },
];

export function totalUsd(coins: Coin[]) {
  return coins.reduce((acc, c) => acc + c.balance * c.unitPrice, 0);
}

export function getCoin(coins: Coin[], id: string) {
  return coins.find((c) => c.id === id);
}

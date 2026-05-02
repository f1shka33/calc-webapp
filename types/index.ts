export type CoinId = string;

export interface Coin {
  id: CoinId;
  symbol: string;
  name: string;
  color: string;
  /** USD-equivalent unit price (sandbox-only). */
  unitPrice: number;
  /** Per-user demo balance. */
  balance: number;
  /** Pretty gradient for the coin card. */
  gradient: [string, string];
  /** Marker so the UI can show "fake coin" badges. */
  isCustom?: boolean;
}

export type TransactionType =
  | "deposit"
  | "send"
  | "receive"
  | "convert"
  | "game_win"
  | "game_loss"
  | "admin_adjustment";

export type TransactionStatus = "completed" | "pending" | "failed";

export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  /** Coin id involved (for converts: the source coin). */
  coinId: CoinId;
  /** Optional destination coin for converts. */
  destCoinId?: CoinId;
  /** Amount in coin units (positive for inflow to user, negative for outflow). */
  amount: number;
  /** Optional resulting amount when converting. */
  destAmount?: number;
  /** USD-equivalent at time of tx (sandbox). */
  usdValue: number;
  /** Fake tx hash, clearly labeled in UI. */
  hash: string;
  /** Fake counterparty address. */
  address?: string;
  /** Game name if game tx. */
  game?: "roulette" | "crash" | "mines";
  note?: string;
  createdAt: number;
}

export interface User {
  id: string;
  username: string;
  avatarSeed: string;
  createdAt: number;
  level: number;
  isAdmin: boolean;
  stats: {
    gamesPlayed: number;
    wins: number;
    losses: number;
    totalWagered: number;
    totalWon: number;
  };
}

export interface GameSettings {
  /** Roulette: house edge is fixed by the wheel; we expose payoutMultiplier for color/odd/even (default 2). */
  roulette: {
    payoutColor: number;
    payoutNumber: number;
    /** 0..1 — chance the spin lands on green 0 (default 1/37 ≈ 0.027). Admin tunable. */
    greenChance: number;
  };
  crash: {
    /** House edge (0..1). Higher = lower expected multiplier. */
    houseEdge: number;
    /** Hard cap for safety. */
    maxMultiplier: number;
  };
  mines: {
    /** House edge applied to fair multiplier. */
    houseEdge: number;
  };
}

export interface Settings {
  theme: "dark" | "midnight" | "ember";
  displayCurrency: "USD" | "EUR" | "WLV";
  animationsEnabled: boolean;
  twoFactorMock: boolean;
  hideBalances: boolean;
}

export interface CrashRound {
  id: string;
  crashAt: number;
  cashedOutAt?: number;
  bet: number;
  payout: number;
  createdAt: number;
}

export interface RouletteSpin {
  id: string;
  bet: number;
  betType: "color" | "number";
  betValue: string | number;
  result: number;
  payout: number;
  createdAt: number;
}

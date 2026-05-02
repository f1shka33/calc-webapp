"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Coin,
  CrashRound,
  GameSettings,
  RouletteSpin,
  Settings,
  Transaction,
  User,
} from "@/types";
import { DEFAULT_COINS } from "./coins";
import { fakeAddress, fakeTxHash, uid } from "./utils";
import { DEFAULT_GAME_SETTINGS } from "./games";
import { generateMockTransactions } from "./mock";

const DEFAULT_SETTINGS: Settings = {
  theme: "dark",
  displayCurrency: "USD",
  animationsEnabled: true,
  twoFactorMock: false,
  hideBalances: false,
};

function defaultUser(username = "demo_user"): User {
  return {
    id: uid("usr"),
    username,
    avatarSeed: username,
    createdAt: Date.now(),
    level: 1,
    isAdmin: false,
    stats: { gamesPlayed: 0, wins: 0, losses: 0, totalWagered: 0, totalWon: 0 },
  };
}

export interface SandboxState {
  hydrated: boolean;
  user: User | null;
  adminUnlocked: boolean;
  coins: Coin[];
  transactions: Transaction[];
  crashHistory: CrashRound[];
  rouletteHistory: RouletteSpin[];
  settings: Settings;
  gameSettings: GameSettings;

  setHydrated: (v: boolean) => void;
  // auth
  login: (username: string) => void;
  logout: () => void;
  unlockAdmin: (password: string) => boolean;
  lockAdmin: () => void;

  // wallet
  deposit: (coinId: string, amount: number) => Transaction | null;
  send: (coinId: string, amount: number, address: string) => Transaction | null;
  convert: (fromId: string, toId: string, amount: number) => Transaction | null;

  // games
  applyGameOutcome: (params: {
    coinId: string;
    bet: number;
    payout: number;
    game: "roulette" | "crash" | "mines";
    note?: string;
  }) => { winTx?: Transaction; lossTx?: Transaction };

  pushRouletteSpin: (s: RouletteSpin) => void;
  pushCrashRound: (r: CrashRound) => void;

  // admin
  adminAdjustBalance: (coinId: string, delta: number, note?: string) => Transaction | null;
  adminAddCoin: (input: Omit<Coin, "id">) => Coin;
  adminRemoveCoin: (id: string) => void;
  adminSetGameSettings: (g: GameSettings) => void;
  adminGenerateTransactions: (n: number) => void;
  adminResetSandbox: () => void;

  // settings
  updateSettings: (patch: Partial<Settings>) => void;
}

const SEED_VERSION = 1;

export const useStore = create<SandboxState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      user: defaultUser(),
      adminUnlocked: false,
      coins: DEFAULT_COINS.map((c) => ({ ...c })),
      transactions: generateMockTransactions(DEFAULT_COINS, 18).sort(
        (a, b) => b.createdAt - a.createdAt,
      ),
      crashHistory: [],
      rouletteHistory: [],
      settings: { ...DEFAULT_SETTINGS },
      gameSettings: { ...DEFAULT_GAME_SETTINGS },

      setHydrated: (v) => set({ hydrated: v }),

      login: (username) =>
        set((s) => ({
          user: s.user ? { ...s.user, username, avatarSeed: username } : defaultUser(username),
        })),
      logout: () => set({ user: null, adminUnlocked: false }),
      unlockAdmin: (password) => {
        if (password !== "admin") return false;
        set((s) => ({
          adminUnlocked: true,
          user: s.user ? { ...s.user, isAdmin: true } : { ...defaultUser("admin"), isAdmin: true },
        }));
        return true;
      },
      lockAdmin: () =>
        set((s) => ({
          adminUnlocked: false,
          user: s.user ? { ...s.user, isAdmin: false } : null,
        })),

      deposit: (coinId, amount) => {
        if (amount <= 0) return null;
        const coin = get().coins.find((c) => c.id === coinId);
        if (!coin) return null;
        const tx: Transaction = {
          id: uid("tx"),
          type: "deposit",
          status: "completed",
          coinId,
          amount,
          usdValue: +(amount * coin.unitPrice).toFixed(2),
          hash: fakeTxHash(),
          address: fakeAddress(),
          createdAt: Date.now(),
          note: "Demo deposit (sandbox).",
        };
        set((s) => ({
          coins: s.coins.map((c) => (c.id === coinId ? { ...c, balance: c.balance + amount } : c)),
          transactions: [tx, ...s.transactions].slice(0, 1500),
        }));
        return tx;
      },

      send: (coinId, amount, address) => {
        if (amount <= 0) return null;
        const coin = get().coins.find((c) => c.id === coinId);
        if (!coin || coin.balance < amount) return null;
        const tx: Transaction = {
          id: uid("tx"),
          type: "send",
          status: "completed",
          coinId,
          amount: -amount,
          usdValue: +(amount * coin.unitPrice).toFixed(2),
          hash: fakeTxHash(),
          address: address || fakeAddress(),
          createdAt: Date.now(),
          note: "Demo send (sandbox).",
        };
        set((s) => ({
          coins: s.coins.map((c) => (c.id === coinId ? { ...c, balance: c.balance - amount } : c)),
          transactions: [tx, ...s.transactions].slice(0, 1500),
        }));
        return tx;
      },

      convert: (fromId, toId, amount) => {
        if (amount <= 0 || fromId === toId) return null;
        const from = get().coins.find((c) => c.id === fromId);
        const to = get().coins.find((c) => c.id === toId);
        if (!from || !to || from.balance < amount) return null;
        const usd = amount * from.unitPrice;
        const destAmount = +(usd / to.unitPrice).toFixed(6);
        const tx: Transaction = {
          id: uid("tx"),
          type: "convert",
          status: "completed",
          coinId: fromId,
          destCoinId: toId,
          amount: -amount,
          destAmount,
          usdValue: +usd.toFixed(2),
          hash: fakeTxHash(),
          createdAt: Date.now(),
          note: `Demo convert (sandbox).`,
        };
        set((s) => ({
          coins: s.coins.map((c) => {
            if (c.id === fromId) return { ...c, balance: c.balance - amount };
            if (c.id === toId) return { ...c, balance: c.balance + destAmount };
            return c;
          }),
          transactions: [tx, ...s.transactions].slice(0, 1500),
        }));
        return tx;
      },

      applyGameOutcome: ({ coinId, bet, payout, game, note }) => {
        const state = get();
        const coin = state.coins.find((c) => c.id === coinId);
        if (!coin) return {};
        const won = payout > 0;
        const net = payout - bet;
        const winTx: Transaction = {
          id: uid("tx"),
          type: won ? "game_win" : "game_loss",
          status: "completed",
          coinId,
          amount: net,
          usdValue: +(Math.abs(net) * coin.unitPrice).toFixed(2),
          hash: fakeTxHash(),
          game,
          createdAt: Date.now(),
          note: note ?? (won ? "Demo game win (sandbox)." : "Demo game loss (sandbox)."),
        };
        set((s) => ({
          coins: s.coins.map((c) => (c.id === coinId ? { ...c, balance: Math.max(0, c.balance + net) } : c)),
          transactions: [winTx, ...s.transactions].slice(0, 1500),
          user: s.user
            ? {
                ...s.user,
                stats: {
                  ...s.user.stats,
                  gamesPlayed: s.user.stats.gamesPlayed + 1,
                  wins: s.user.stats.wins + (won ? 1 : 0),
                  losses: s.user.stats.losses + (won ? 0 : 1),
                  totalWagered: +(s.user.stats.totalWagered + bet).toFixed(4),
                  totalWon: +(s.user.stats.totalWon + Math.max(0, payout)).toFixed(4),
                },
                level: 1 + Math.floor((s.user.stats.gamesPlayed + 1) / 10),
              }
            : s.user,
        }));
        return won ? { winTx } : { lossTx: winTx };
      },

      pushRouletteSpin: (s) => set((st) => ({ rouletteHistory: [s, ...st.rouletteHistory].slice(0, 100) })),
      pushCrashRound: (r) => set((st) => ({ crashHistory: [r, ...st.crashHistory].slice(0, 100) })),

      adminAdjustBalance: (coinId, delta, note) => {
        const coin = get().coins.find((c) => c.id === coinId);
        if (!coin) return null;
        const tx: Transaction = {
          id: uid("tx"),
          type: "admin_adjustment",
          status: "completed",
          coinId,
          amount: delta,
          usdValue: +(Math.abs(delta) * coin.unitPrice).toFixed(2),
          hash: fakeTxHash(),
          createdAt: Date.now(),
          note: note ?? "Demo admin adjustment (sandbox).",
        };
        set((s) => ({
          coins: s.coins.map((c) =>
            c.id === coinId ? { ...c, balance: Math.max(0, c.balance + delta) } : c,
          ),
          transactions: [tx, ...s.transactions].slice(0, 1500),
        }));
        return tx;
      },

      adminAddCoin: (input) => {
        const id = uid("coin");
        const coin: Coin = { ...input, id, isCustom: true };
        set((s) => ({ coins: [...s.coins, coin] }));
        return coin;
      },

      adminRemoveCoin: (id) =>
        set((s) => ({
          coins: s.coins.filter((c) => c.id !== id),
          transactions: s.transactions.filter((t) => t.coinId !== id && t.destCoinId !== id),
        })),

      adminSetGameSettings: (g) => set({ gameSettings: g }),

      adminGenerateTransactions: (n) =>
        set((s) => ({
          transactions: [...generateMockTransactions(s.coins, n), ...s.transactions]
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 1500),
        })),

      adminResetSandbox: () =>
        set({
          coins: DEFAULT_COINS.map((c) => ({ ...c })),
          transactions: generateMockTransactions(DEFAULT_COINS, 18).sort(
            (a, b) => b.createdAt - a.createdAt,
          ),
          crashHistory: [],
          rouletteHistory: [],
          settings: { ...DEFAULT_SETTINGS },
          gameSettings: { ...DEFAULT_GAME_SETTINGS },
          user: defaultUser(),
          adminUnlocked: false,
        }),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    {
      name: "casino-wallet-sandbox",
      version: SEED_VERSION,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        user: state.user,
        adminUnlocked: state.adminUnlocked,
        coins: state.coins,
        transactions: state.transactions,
        crashHistory: state.crashHistory,
        rouletteHistory: state.rouletteHistory,
        settings: state.settings,
        gameSettings: state.gameSettings,
      }),
    },
  ),
);

/** Computed: total USD-equivalent across all coins. */
export function selectTotalUsd(state: SandboxState) {
  return state.coins.reduce((acc, c) => acc + c.balance * c.unitPrice, 0);
}

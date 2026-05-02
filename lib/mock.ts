import type { Transaction, TransactionStatus, TransactionType } from "@/types";
import { fakeAddress, fakeTxHash, pick, uid } from "./utils";
import type { Coin } from "@/types";

const TX_TYPES: TransactionType[] = [
  "deposit",
  "send",
  "receive",
  "convert",
  "game_win",
  "game_loss",
  "admin_adjustment",
];

const STATUSES: TransactionStatus[] = ["completed", "completed", "completed", "completed", "pending", "failed"];

export function generateMockTransaction(coins: Coin[], opts: Partial<Transaction> = {}): Transaction {
  const type: TransactionType = opts.type ?? pick(TX_TYPES);
  const coin = coins.find((c) => c.id === opts.coinId) ?? pick(coins);
  const amountBase = (Math.random() * 0.9 + 0.1) * (coin.balance > 0 ? coin.balance * 0.05 : 10);
  const sign =
    type === "send" || type === "game_loss"
      ? -1
      : type === "receive" || type === "deposit" || type === "game_win"
        ? 1
        : Math.random() > 0.5
          ? 1
          : -1;
  const amount = +(amountBase * sign).toFixed(coin.unitPrice < 1 ? 4 : 6);
  const status: TransactionStatus = opts.status ?? pick(STATUSES);
  const createdAt = opts.createdAt ?? Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);
  return {
    id: uid("tx"),
    type,
    status,
    coinId: coin.id,
    amount,
    usdValue: +(amount * coin.unitPrice).toFixed(2),
    hash: fakeTxHash(),
    address: type === "send" || type === "receive" ? fakeAddress() : undefined,
    game: type === "game_win" || type === "game_loss" ? pick(["roulette", "crash", "mines"]) : undefined,
    createdAt,
    ...opts,
  };
}

export function generateMockTransactions(coins: Coin[], n: number): Transaction[] {
  return Array.from({ length: n }, () => generateMockTransaction(coins));
}

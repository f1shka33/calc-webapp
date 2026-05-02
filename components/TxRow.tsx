"use client";

import type { Transaction } from "@/types";
import { useStore } from "@/lib/store";
import { CoinIcon } from "./CoinIcon";
import { StatusBadge } from "./StatusBadge";
import { formatCoin, formatUsd, shortHash, timeAgo } from "@/lib/utils";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Repeat,
  ShieldAlert,
  Trophy,
  TrendingDown,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

const TYPE_LABEL: Record<Transaction["type"], string> = {
  deposit: "Demo deposit",
  receive: "Demo receive",
  send: "Demo send",
  convert: "Demo convert",
  game_win: "Game win",
  game_loss: "Game loss",
  admin_adjustment: "Admin adjust",
};

const TYPE_ICON: Record<Transaction["type"], React.ComponentType<{ className?: string }>> = {
  deposit: ArrowDownToLine,
  receive: ArrowDownToLine,
  send: ArrowUpRight,
  convert: Repeat,
  game_win: Trophy,
  game_loss: TrendingDown,
  admin_adjustment: ShieldAlert,
};

export function TxRow({ tx, dense = false }: { tx: Transaction; dense?: boolean }) {
  const coin = useStore((s) => s.coins.find((c) => c.id === tx.coinId));
  const destCoin = useStore((s) => (tx.destCoinId ? s.coins.find((c) => c.id === tx.destCoinId) : undefined));
  const Icon = TYPE_ICON[tx.type];
  const positive = tx.amount >= 0;

  if (!coin) return null;

  const copyHash = async () => {
    try {
      await navigator.clipboard.writeText(tx.hash);
      toast.success("Demo tx hash copied", { description: "This hash is fake / sandbox-only." });
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-3 ${dense ? "py-2" : "py-3"} px-3 rounded-xl hover:bg-white/[0.04] transition-colors`}
    >
      <div className="relative">
        <CoinIcon coin={coin} size={dense ? 32 : 38} />
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-bg-soft border border-border-strong grid place-items-center">
          <Icon className="w-3 h-3 text-white/75" />
        </div>
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{TYPE_LABEL[tx.type]}</span>
          <StatusBadge status={tx.status} />
          {tx.game && (
            <span className="chip bg-accent/10 text-accent border border-accent/20 capitalize">
              {tx.game}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[12px] text-white/45 mt-0.5 truncate">
          <button
            type="button"
            onClick={copyHash}
            className="inline-flex items-center gap-1 hover:text-white/80 transition-colors"
            title="Copy fake tx hash"
          >
            <Copy className="w-3 h-3" />
            <span className="font-mono">{shortHash(tx.hash, 8, 6)}</span>
            <span className="text-amber-300/80">· fake</span>
          </button>
          <span>·</span>
          <span>{timeAgo(tx.createdAt)}</span>
          {tx.address && (
            <>
              <span>·</span>
              <span className="font-mono truncate">{shortHash(tx.address, 6, 4)}</span>
            </>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className={`tabular text-sm font-semibold ${positive ? "text-emerald-300" : "text-rose-300"}`}>
          {positive ? "+" : ""}
          {formatCoin(tx.amount, coin.symbol)}
          {tx.destCoinId && tx.destAmount && destCoin && (
            <span className="text-white/45 font-medium">
              {" → "}
              {formatCoin(tx.destAmount, destCoin.symbol)}
            </span>
          )}
        </div>
        <div className="text-[12px] text-white/45 tabular">≈ {formatUsd(tx.usdValue)}</div>
      </div>
    </div>
  );
}

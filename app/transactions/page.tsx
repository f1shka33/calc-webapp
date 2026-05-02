"use client";

import { GlassCard, SandboxNote, SectionTitle } from "@/components/GlassCard";
import { TxRow } from "@/components/TxRow";
import { useStore } from "@/lib/store";
import { Search, Filter, RotateCcw, Receipt } from "lucide-react";
import type { TransactionType } from "@/types";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/Empty";

const TYPE_OPTIONS: { value: TransactionType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "deposit", label: "Deposit" },
  { value: "send", label: "Send" },
  { value: "receive", label: "Receive" },
  { value: "convert", label: "Convert" },
  { value: "game_win", label: "Game win" },
  { value: "game_loss", label: "Game loss" },
  { value: "admin_adjustment", label: "Admin" },
];

export default function TransactionsPage() {
  const txs = useStore((s) => s.transactions);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TransactionType | "all">("all");
  const [status, setStatus] = useState<"all" | "completed" | "pending" | "failed">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return txs.filter((tx) => {
      if (type !== "all" && tx.type !== type) return false;
      if (status !== "all" && tx.status !== status) return false;
      if (!q) return true;
      return (
        tx.id.toLowerCase().includes(q) ||
        tx.hash.toLowerCase().includes(q) ||
        (tx.address ?? "").toLowerCase().includes(q) ||
        (tx.note ?? "").toLowerCase().includes(q)
      );
    });
  }, [txs, query, type, status]);

  return (
    <div className="max-w-6xl mx-auto w-full space-y-5">
      <GlassCard>
        <SectionTitle
          title="Transactions"
          subtitle="Sandbox-only history. Tx hashes are randomly generated and clearly labeled fake."
          right={<SandboxNote />}
        />

        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by id, fake hash or address…"
              className="field !pl-9"
            />
          </div>
          <div className="flex items-center gap-2 glass !p-1.5">
            <Filter className="w-3.5 h-3.5 text-white/45 ml-1" />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType | "all")}
              className="bg-transparent text-sm focus:outline-none pr-2"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-bg-soft">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 glass !p-1.5">
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "all" | "completed" | "pending" | "failed")
              }
              className="bg-transparent text-sm focus:outline-none px-2"
            >
              <option value="all" className="bg-bg-soft">All status</option>
              <option value="completed" className="bg-bg-soft">Completed</option>
              <option value="pending" className="bg-bg-soft">Pending</option>
              <option value="failed" className="bg-bg-soft">Failed</option>
            </select>
          </div>
          <button
            className="btn-outline"
            onClick={() => {
              setQuery("");
              setType("all");
              setStatus("all");
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </GlassCard>

      <GlassCard>
        {filtered.length === 0 ? (
          <EmptyState
            icon={<Receipt className="w-5 h-5" />}
            title="No transactions match"
            description="Try a different filter or generate demo transactions from the admin panel."
          />
        ) : (
          <div className="-mx-2">
            <div className="px-3 py-1.5 text-[11px] text-white/40 uppercase tracking-wider grid grid-cols-[auto_1fr_auto] gap-3">
              <div>Tx</div>
              <div>Details</div>
              <div className="text-right">Amount</div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {filtered.map((tx) => (
                <TxRow key={tx.id} tx={tx} />
              ))}
            </div>
            <div className="px-3 py-2.5 text-[11px] text-white/40 mt-1">
              {filtered.length} of {txs.length} sandbox transaction{txs.length === 1 ? "" : "s"}.
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { useStore } from "@/lib/store";
import { CoinIcon } from "./CoinIcon";
import { fakeAddress, formatCoin, formatUsd } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

function CoinSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const coins = useStore((s) => s.coins);
  return (
    <div className="grid grid-cols-3 gap-2">
      {coins.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={`p-2.5 rounded-xl border text-left transition-all ${value === c.id ? "border-accent/60 bg-accent/10" : "border-border-soft hover:bg-white/[0.04]"}`}
        >
          <div className="flex items-center gap-2">
            <CoinIcon coin={c} size={28} />
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{c.symbol}</div>
              <div className="text-[11px] text-white/45 truncate">{formatCoin(c.balance, c.symbol)}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export function DepositModal({
  open,
  onClose,
  initialCoinId,
}: {
  open: boolean;
  onClose: () => void;
  initialCoinId?: string;
}) {
  const coins = useStore((s) => s.coins);
  const deposit = useStore((s) => s.deposit);
  const [coinId, setCoinId] = useState(initialCoinId ?? coins[0]?.id ?? "");
  const [amount, setAmount] = useState("100");

  useEffect(() => {
    if (open && initialCoinId) setCoinId(initialCoinId);
  }, [open, initialCoinId]);

  const coin = coins.find((c) => c.id === coinId);

  function submit() {
    const v = Number(amount);
    if (!Number.isFinite(v) || v <= 0) {
      toast.error("Enter a positive demo amount");
      return;
    }
    const tx = deposit(coinId, v);
    if (tx) {
      toast.success("Demo deposit credited", {
        description: `+${formatCoin(v, coin?.symbol ?? "")} (sandbox · not real money)`,
      });
      onClose();
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Demo Deposit"
      description="Sandbox-only. No real funds change hands. We just credit your demo balance."
      size="md"
    >
      <div className="space-y-4">
        <CoinSelect value={coinId} onChange={setCoinId} />

        <div>
          <div className="label mb-1.5">Amount</div>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="field tabular text-base"
            placeholder="0.00"
          />
          {coin && (
            <div className="text-[12px] text-white/45 mt-1.5 tabular">
              ≈ {formatUsd(Number(amount || 0) * coin.unitPrice)} (sandbox rate)
            </div>
          )}
        </div>

        <div className="glass !p-3 text-[12px] text-white/55 flex items-center justify-between gap-3">
          <div>
            Demo deposit address:{" "}
            <span className="font-mono text-white/85">{fakeAddress().slice(0, 22)}…</span>
          </div>
          <span className="badge-demo">fake</span>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit}>
            Credit demo balance <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function SendModal({
  open,
  onClose,
  initialCoinId,
}: {
  open: boolean;
  onClose: () => void;
  initialCoinId?: string;
}) {
  const coins = useStore((s) => s.coins);
  const send = useStore((s) => s.send);
  const [coinId, setCoinId] = useState(initialCoinId ?? coins[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (open && initialCoinId) setCoinId(initialCoinId);
  }, [open, initialCoinId]);

  const coin = coins.find((c) => c.id === coinId);

  function submit() {
    const v = Number(amount);
    if (!Number.isFinite(v) || v <= 0) return toast.error("Enter a positive demo amount");
    if (!coin) return;
    if (v > coin.balance) return toast.error("Not enough demo balance");
    const tx = send(coinId, v, address || fakeAddress());
    if (tx) {
      toast.success("Demo send broadcasted", {
        description: `Sent ${formatCoin(v, coin.symbol)} to a fake sandbox address.`,
      });
      onClose();
      setAmount("");
      setAddress("");
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Demo Send"
      description="No on-chain transaction is performed. This only updates your sandbox balance and history."
      size="md"
    >
      <div className="space-y-4">
        <CoinSelect value={coinId} onChange={setCoinId} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="label mb-1.5">Amount</div>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="field tabular"
              placeholder="0.00"
            />
            {coin && (
              <div className="text-[11px] text-white/45 mt-1 tabular">
                Available: {formatCoin(coin.balance, coin.symbol)}
              </div>
            )}
          </div>
          <div>
            <div className="label mb-1.5">Address</div>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="field font-mono text-[12px]"
              placeholder="sbx1… (fake)"
            />
            <div className="text-[11px] text-amber-300/80 mt-1">
              Any string works — it&apos;s a demo address.
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit}>
            Send (sandbox) <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function ConvertModal({
  open,
  onClose,
  initialFromId,
}: {
  open: boolean;
  onClose: () => void;
  initialFromId?: string;
}) {
  const coins = useStore((s) => s.coins);
  const convert = useStore((s) => s.convert);
  const [fromId, setFromId] = useState(initialFromId ?? coins[0]?.id ?? "");
  const [toId, setToId] = useState(coins[1]?.id ?? coins[0]?.id ?? "");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (open && initialFromId) setFromId(initialFromId);
  }, [open, initialFromId]);

  const from = coins.find((c) => c.id === fromId);
  const to = coins.find((c) => c.id === toId);
  const v = Number(amount || 0);
  const usd = from ? v * from.unitPrice : 0;
  const dest = to && usd ? usd / to.unitPrice : 0;

  function submit() {
    if (!from || !to) return;
    if (!Number.isFinite(v) || v <= 0) return toast.error("Enter a positive amount");
    if (v > from.balance) return toast.error("Not enough demo balance");
    const tx = convert(from.id, to.id, v);
    if (tx) {
      toast.success("Demo convert completed", {
        description: `${formatCoin(v, from.symbol)} → ${formatCoin(tx.destAmount ?? 0, to.symbol)} (sandbox)`,
      });
      onClose();
      setAmount("");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Demo Convert" description="Convert between fictional sandbox coins.">
      <div className="space-y-4">
        <div>
          <div className="label mb-1.5">From</div>
          <CoinSelect value={fromId} onChange={setFromId} />
        </div>
        <div>
          <div className="label mb-1.5">To</div>
          <CoinSelect value={toId} onChange={setToId} />
        </div>
        <div>
          <div className="label mb-1.5">Amount</div>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="field tabular"
            placeholder="0.00"
          />
          <div className="text-[12px] text-white/55 mt-1.5 tabular">
            ≈ {formatCoin(dest, to?.symbol ?? "")} ({formatUsd(usd)})
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button className="btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary" onClick={submit}>
            Convert (sandbox) <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Modal>
  );
}

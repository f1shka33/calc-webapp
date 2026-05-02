"use client";

import { GlassCard, SandboxNote, SectionTitle } from "@/components/GlassCard";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { toast } from "sonner";
import { CoinIcon } from "@/components/CoinIcon";
import { formatCoin } from "@/lib/utils";
import { Modal } from "@/components/Modal";
import { Lock, Unlock, Plus, Trash2, RefreshCcw, Sparkles, ShieldAlert } from "lucide-react";

const COIN_GRADIENTS: [string, string][] = [
  ["#FF8A3D", "#FF2D55"],
  ["#9C7BFF", "#5236C8"],
  ["#22D3EE", "#0EA5E9"],
  ["#34D399", "#059669"],
  ["#FBBF24", "#D97706"],
  ["#F472B6", "#BE185D"],
];

export default function AdminPage() {
  const unlocked = useStore((s) => s.adminUnlocked);
  if (!unlocked) return <AdminLogin />;
  return <AdminPanel />;
}

function AdminLogin() {
  const unlock = useStore((s) => s.unlockAdmin);
  const [password, setPassword] = useState("");

  return (
    <div className="max-w-md mx-auto w-full">
      <GlassCard className="!p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-demo">Sandbox admin</span>
            <span className="chip bg-white/[0.04] border border-border-soft text-white/55">
              created by welv_bot
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin access</h1>
          <p className="text-[13px] text-white/55 mt-1">
            This is a mock admin panel. The hard-coded password is <code className="text-white">admin</code>. There is no real authorization.
          </p>

          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (unlock(password)) toast.success("Admin unlocked (sandbox)");
              else toast.error("Wrong sandbox password (try `admin`)");
            }}
          >
            <div>
              <div className="label mb-1.5">Sandbox password</div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field"
                placeholder="admin"
                type="password"
                autoFocus
              />
            </div>
            <button className="btn-primary w-full !h-11" type="submit">
              <Unlock className="w-4 h-4" /> Unlock admin (sandbox)
            </button>
          </form>
          <div className="mt-4"><SandboxNote>Admin actions affect demo data only.</SandboxNote></div>
        </div>
      </GlassCard>
    </div>
  );
}

function AdminPanel() {
  const coins = useStore((s) => s.coins);
  const lock = useStore((s) => s.lockAdmin);
  const adjust = useStore((s) => s.adminAdjustBalance);
  const addCoin = useStore((s) => s.adminAddCoin);
  const removeCoin = useStore((s) => s.adminRemoveCoin);
  const generate = useStore((s) => s.adminGenerateTransactions);
  const resetSandbox = useStore((s) => s.adminResetSandbox);
  const gameSettings = useStore((s) => s.gameSettings);
  const setGameSettings = useStore((s) => s.adminSetGameSettings);
  const user = useStore((s) => s.user);

  const [adjCoin, setAdjCoin] = useState(coins[0]?.id ?? "");
  const [adjAmount, setAdjAmount] = useState("100");
  const [adjNote, setAdjNote] = useState("");

  const [coinForm, setCoinForm] = useState({
    symbol: "DEMO",
    name: "Demo Token",
    unitPrice: 1.5,
    balance: 100,
  });

  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="max-w-6xl mx-auto w-full space-y-5">
      <GlassCard className="!p-5 flex items-center justify-between flex-wrap gap-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <span className="badge-demo">Sandbox admin</span>
            <span className="chip bg-white/[0.04] border border-border-soft text-white/55">
              <Sparkles className="w-3 h-3 text-amber-300" /> created by welv_bot
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin panel</h1>
          <p className="text-[13px] text-white/55 mt-1">
            All actions here only modify your local sandbox data. Logged in as{" "}
            <span className="text-white font-medium">{user?.username}</span>.
          </p>
        </div>
        <button onClick={lock} className="btn-outline relative">
          <Lock className="w-4 h-4" /> Lock admin
        </button>
      </GlassCard>

      {/* Users (mock) */}
      <GlassCard>
        <SectionTitle title="Users (mock)" subtitle="There's only one local sandbox user — you." />
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-accent grid place-items-center font-bold">
            {(user?.username ?? "G").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="font-medium">{user?.username}</div>
            <div className="text-[12px] text-white/55">
              Level {user?.level} · games {user?.stats.gamesPlayed} · admin: {user?.isAdmin ? "yes" : "no"}
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Adjust balance */}
        <GlassCard>
          <SectionTitle title="Adjust demo balance" subtitle="Creates an admin_adjustment transaction." />
          <div className="space-y-3">
            <div>
              <div className="label mb-1.5">Coin</div>
              <select
                value={adjCoin}
                onChange={(e) => setAdjCoin(e.target.value)}
                className="field"
              >
                {coins.map((c) => (
                  <option key={c.id} value={c.id} className="bg-bg-soft">
                    {c.symbol} · {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="label mb-1.5">Amount (signed)</div>
              <input
                value={adjAmount}
                onChange={(e) => setAdjAmount(e.target.value)}
                className="field tabular"
                placeholder="100 or -50"
              />
            </div>
            <div>
              <div className="label mb-1.5">Note (optional)</div>
              <input
                value={adjNote}
                onChange={(e) => setAdjNote(e.target.value)}
                className="field"
                placeholder="Demo top-up for sandbox testing"
              />
            </div>
            <button
              className="btn-primary"
              onClick={() => {
                const v = Number(adjAmount);
                if (!Number.isFinite(v) || v === 0) return toast.error("Enter a non-zero amount");
                const tx = adjust(adjCoin, v, adjNote || undefined);
                if (tx)
                  toast.success("Demo adjustment posted", {
                    description: `${v >= 0 ? "+" : ""}${v} on ${tx.coinId} (sandbox).`,
                  });
              }}
            >
              <ShieldAlert className="w-4 h-4" /> Post adjustment
            </button>
          </div>
        </GlassCard>

        {/* Bulk generate */}
        <GlassCard>
          <SectionTitle title="Generate demo transactions" subtitle="Creates moments of fake activity." />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[10, 100, 250, 500].map((n) => (
              <button
                key={n}
                className="btn-outline"
                onClick={() => {
                  generate(n);
                  toast.success(`Generated ${n} demo transactions (sandbox)`);
                }}
              >
                +{n}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <button
              className="btn-primary"
              onClick={() => {
                generate(100);
                toast.success("Generated 100 demo transactions");
              }}
            >
              <RefreshCcw className="w-4 h-4" /> Generate 100 demo transactions
            </button>
          </div>
        </GlassCard>

        {/* Game settings */}
        <GlassCard>
          <SectionTitle title="Game odds & payouts" subtitle="Tune the sandbox house edge." />
          <div className="space-y-3">
            <Row
              label="Roulette · color payout"
              right={
                <input
                  className="field tabular !w-28 !h-9"
                  value={gameSettings.roulette.payoutColor}
                  onChange={(e) =>
                    setGameSettings({
                      ...gameSettings,
                      roulette: {
                        ...gameSettings.roulette,
                        payoutColor: Math.max(1, Number(e.target.value) || 1),
                      },
                    })
                  }
                />
              }
            />
            <Row
              label="Roulette · number payout"
              right={
                <input
                  className="field tabular !w-28 !h-9"
                  value={gameSettings.roulette.payoutNumber}
                  onChange={(e) =>
                    setGameSettings({
                      ...gameSettings,
                      roulette: {
                        ...gameSettings.roulette,
                        payoutNumber: Math.max(1, Number(e.target.value) || 1),
                      },
                    })
                  }
                />
              }
            />
            <Row
              label="Roulette · green chance"
              right={
                <input
                  className="field tabular !w-28 !h-9"
                  value={gameSettings.roulette.greenChance.toFixed(3)}
                  onChange={(e) =>
                    setGameSettings({
                      ...gameSettings,
                      roulette: {
                        ...gameSettings.roulette,
                        greenChance: Math.max(0, Math.min(1, Number(e.target.value) || 0)),
                      },
                    })
                  }
                />
              }
            />
            <Row
              label="Crash · house edge"
              right={
                <input
                  className="field tabular !w-28 !h-9"
                  value={gameSettings.crash.houseEdge.toFixed(3)}
                  onChange={(e) =>
                    setGameSettings({
                      ...gameSettings,
                      crash: {
                        ...gameSettings.crash,
                        houseEdge: Math.max(0, Math.min(0.5, Number(e.target.value) || 0)),
                      },
                    })
                  }
                />
              }
            />
            <Row
              label="Mines · house edge"
              right={
                <input
                  className="field tabular !w-28 !h-9"
                  value={gameSettings.mines.houseEdge.toFixed(3)}
                  onChange={(e) =>
                    setGameSettings({
                      ...gameSettings,
                      mines: {
                        ...gameSettings.mines,
                        houseEdge: Math.max(0, Math.min(0.5, Number(e.target.value) || 0)),
                      },
                    })
                  }
                />
              }
            />
          </div>
        </GlassCard>

        {/* Add fake coin */}
        <GlassCard>
          <SectionTitle title="Create a fake coin" subtitle="Adds a custom sandbox-only token." />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Symbol"
              value={coinForm.symbol}
              onChange={(v) => setCoinForm({ ...coinForm, symbol: v.toUpperCase().slice(0, 6) })}
            />
            <Field
              label="Name"
              value={coinForm.name}
              onChange={(v) => setCoinForm({ ...coinForm, name: v })}
            />
            <Field
              label="Unit price (sandbox USD)"
              value={String(coinForm.unitPrice)}
              onChange={(v) => setCoinForm({ ...coinForm, unitPrice: Math.max(0.0001, Number(v) || 0) })}
            />
            <Field
              label="Initial balance"
              value={String(coinForm.balance)}
              onChange={(v) => setCoinForm({ ...coinForm, balance: Math.max(0, Number(v) || 0) })}
            />
          </div>
          <button
            className="btn-primary mt-3"
            onClick={() => {
              if (!coinForm.symbol.trim() || !coinForm.name.trim())
                return toast.error("Symbol and name required");
              const grad = COIN_GRADIENTS[Math.floor(Math.random() * COIN_GRADIENTS.length)];
              addCoin({
                symbol: coinForm.symbol,
                name: coinForm.name,
                color: grad[0],
                gradient: grad,
                unitPrice: coinForm.unitPrice,
                balance: coinForm.balance,
              });
              toast.success(`Added fake coin ${coinForm.symbol} (sandbox)`);
            }}
          >
            <Plus className="w-4 h-4" /> Add fake coin
          </button>
        </GlassCard>
      </div>

      {/* Coin manager */}
      <GlassCard>
        <SectionTitle title="Coins" subtitle="All sandbox-only. Custom coins can be removed." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {coins.map((c) => (
            <div key={c.id} className="glass !p-3 flex items-center gap-3">
              <CoinIcon coin={c} size={36} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold truncate">{c.name}</div>
                  {c.isCustom && <span className="badge-demo">custom</span>}
                </div>
                <div className="text-[12px] text-white/55 truncate">
                  {c.symbol} · {formatCoin(c.balance, c.symbol)}
                </div>
              </div>
              {c.isCustom && (
                <button
                  className="btn-outline !h-8 !px-2"
                  onClick={() => {
                    removeCoin(c.id);
                    toast.success(`Removed ${c.symbol}`);
                  }}
                  aria-label={`Remove ${c.symbol}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Reset */}
      <GlassCard>
        <SectionTitle
          title="Reset sandbox"
          subtitle="Wipes coins, transactions, history and stats and reseeds the sandbox."
        />
        <button
          className="btn-outline !text-rose-300 !border-rose-400/30 hover:!bg-rose-500/10"
          onClick={() => setConfirmReset(true)}
        >
          <Trash2 className="w-4 h-4" /> Reset sandbox data
        </button>
      </GlassCard>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset sandbox?"
        description="This wipes all local demo data and reseeds. Sandbox-only — cannot affect real accounts."
      >
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setConfirmReset(false)}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              resetSandbox();
              setConfirmReset(false);
              toast.success("Sandbox reset");
            }}
          >
            Reset everything
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, right }: { label: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-white/75">{label}</div>
      {right}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="label mb-1.5">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="field tabular" />
    </div>
  );
}

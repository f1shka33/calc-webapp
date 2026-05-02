"use client";

import { GlassCard, SandboxNote, SectionTitle } from "@/components/GlassCard";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { toast } from "sonner";
import { Calendar, Trophy, TrendingDown, Gamepad2, Crown } from "lucide-react";
import { formatCoin } from "@/lib/utils";

export default function ProfilePage() {
  const user = useStore((s) => s.user);
  const login = useStore((s) => s.login);
  const stats = user?.stats;
  const [name, setName] = useState(user?.username ?? "demo_user");

  const wins = stats?.wins ?? 0;
  const losses = stats?.losses ?? 0;
  const winrate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : 0;

  const initials = (user?.username ?? "G").slice(0, 2).toUpperCase();
  const created = user ? new Date(user.createdAt) : new Date();

  return (
    <div className="max-w-5xl mx-auto w-full space-y-5">
      <GlassCard className="relative overflow-hidden !p-6">
        <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
        <div className="relative flex items-center gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-3xl bg-gradient-accent grid place-items-center text-3xl font-black shadow-glow">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-demo">Demo profile</span>
              <span className="chip bg-white/[0.04] border border-border-soft text-white/55">
                created by welv_bot
              </span>
              {user?.isAdmin && (
                <span className="chip bg-amber-500/10 text-amber-300 border border-amber-400/30">
                  <Crown className="w-3 h-3" /> sandbox admin
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {user?.username ?? "Guest"}
            </h1>
            <div className="text-[12px] text-white/55 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Joined {created.toLocaleDateString()}
              <span>·</span>
              <span>Demo level {user?.level ?? 1}</span>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid lg:grid-cols-[1fr_1.2fr] gap-4">
        <GlassCard>
          <SectionTitle title="Edit profile" subtitle="Local sandbox only — nothing is sent anywhere." />
          <div className="space-y-3">
            <div>
              <div className="label mb-1.5">Username</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field"
                placeholder="username"
              />
            </div>
            <button
              className="btn-primary"
              onClick={() => {
                if (!name.trim()) return toast.error("Username required");
                login(name.trim());
                toast.success("Profile updated (sandbox)");
              }}
            >
              Save changes
            </button>
            <SandboxNote />
          </div>
        </GlassCard>

        <GlassCard>
          <SectionTitle title="Game statistics" subtitle="All games are sandbox-only with demo balance." />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat
              icon={<Gamepad2 className="w-4 h-4" />}
              label="Played"
              value={stats?.gamesPlayed ?? 0}
            />
            <Stat
              icon={<Trophy className="w-4 h-4 text-emerald-300" />}
              label="Wins"
              value={wins}
              accent="emerald"
            />
            <Stat
              icon={<TrendingDown className="w-4 h-4 text-rose-300" />}
              label="Losses"
              value={losses}
              accent="rose"
            />
            <Stat label="Win rate" value={`${winrate.toFixed(1)}%`} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
            <KV label="Total wagered (demo)" value={formatCoin(stats?.totalWagered ?? 0, "WLV")} />
            <KV label="Total won (demo)" value={formatCoin(stats?.totalWon ?? 0, "WLV")} />
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  accent?: "emerald" | "rose";
}) {
  const color =
    accent === "emerald" ? "text-emerald-300" : accent === "rose" ? "text-rose-300" : "text-white";
  return (
    <div className="glass !p-3 text-center">
      <div className={`tabular text-2xl font-semibold ${color} flex items-center justify-center gap-1.5`}>
        {icon}
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wider text-white/45 mt-1">{label}</div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass !p-3 flex items-center justify-between">
      <div className="text-white/55">{label}</div>
      <div className="tabular font-medium">{value}</div>
    </div>
  );
}

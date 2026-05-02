"use client";

import Link from "next/link";
import { GlassCard, SandboxNote, SectionTitle } from "@/components/GlassCard";
import { Bomb, CircleDot, Rocket, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const GAMES = [
  {
    href: "/games/roulette",
    title: "Roulette",
    desc: "European wheel · 37 pockets · color & number bets.",
    Icon: CircleDot,
    gradient: "from-rose-500/30 to-amber-500/20",
    color: "#FF2D55",
  },
  {
    href: "/games/crash",
    title: "Crash",
    desc: "Watch the multiplier rise. Cash out before it crashes.",
    Icon: Rocket,
    gradient: "from-orange-500/30 to-fuchsia-500/20",
    color: "#FF6A00",
  },
  {
    href: "/games/mines",
    title: "Mines",
    desc: "Reveal safe cells. The more risk, the bigger the multiplier.",
    Icon: Bomb,
    gradient: "from-amber-500/25 to-emerald-500/15",
    color: "#FFB85A",
  },
];

export default function GamesPage() {
  return (
    <div className="max-w-6xl mx-auto w-full space-y-5">
      <GlassCard className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
        <div className="relative flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-demo">Demo only</span>
              <span className="chip bg-white/[0.04] border border-border-soft text-white/55">
                <Sparkles className="w-3 h-3 text-amber-300" /> created by welv_bot
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Games</h1>
            <p className="text-[13px] text-white/55 mt-1 max-w-md">
              Three classic mini-games, each played strictly on your sandbox demo balance. House edge is configurable
              from the admin panel.
            </p>
          </div>
          <SandboxNote>Bets use demo coins only — never real money.</SandboxNote>
        </div>
      </GlassCard>

      <div>
        <SectionTitle title="Pick a game" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {GAMES.map((g, i) => (
            <motion.div
              key={g.href}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                href={g.href}
                className={`block glass p-6 hover:!border-border-strong transition-all relative overflow-hidden group h-full`}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${g.gradient} opacity-50 group-hover:opacity-90 transition-opacity`}
                />
                <div className="relative">
                  <div
                    className="w-12 h-12 rounded-2xl grid place-items-center mb-4"
                    style={{
                      background: `linear-gradient(135deg, ${g.color}, #FF2D55)`,
                      boxShadow: `0 0 28px -8px ${g.color}`,
                    }}
                  >
                    <g.Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">{g.title}</h3>
                  <p className="text-[13px] text-white/65 mt-1">{g.desc}</p>
                  <div className="mt-5 flex items-center gap-2">
                    <span className="text-[12px] text-white/55">Demo balance only</span>
                    <span className="badge-demo">sandbox</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

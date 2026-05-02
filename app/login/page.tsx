"use client";

import { GlassCard, SandboxNote } from "@/components/GlassCard";
import { useStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const login = useStore((s) => s.login);
  const [name, setName] = useState("demo_user");
  const [password, setPassword] = useState("anything");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Enter any sandbox name");
    login(name.trim());
    toast.success(`Welcome, ${name.trim()}`, { description: "This is a sandbox session — no real auth." });
    router.push("/");
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <GlassCard className="!p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="badge-demo">Mock login</span>
            <span className="chip bg-white/[0.04] border border-border-soft text-white/55">
              created by welv_bot
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to the sandbox</h1>
          <p className="text-[13px] text-white/55 mt-1">
            Any username works. Passwords are not checked. Nothing is sent anywhere.
          </p>

          <form onSubmit={submit} className="mt-5 space-y-3">
            <div>
              <div className="label mb-1.5">Username</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="field"
                placeholder="any name"
                autoFocus
              />
            </div>
            <div>
              <div className="label mb-1.5">Password (ignored)</div>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                className="field"
                placeholder="anything"
              />
            </div>
            <button className="btn-primary w-full !h-11" type="submit">
              Enter sandbox
            </button>
          </form>
          <div className="mt-4"><SandboxNote /></div>
        </div>
      </GlassCard>
    </div>
  );
}

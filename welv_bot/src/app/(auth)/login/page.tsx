"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const sp = useSearchParams();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    const callbackUrl = sp.get("callbackUrl") ?? "/dashboard";
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input"
          placeholder="you@artist.com"
          autoComplete="email"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>
      {error && <p className="text-sm text-blood-500">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="glass-card p-8">
      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-blood-500">▸ Re-enter</div>
      <h1 className="mt-2 heading-display text-4xl text-silver-100">Login</h1>
      <p className="mt-2 text-sm text-silver-300">
        Welcome back. Sign in to access your downloads, orders and custom requests.
      </p>

      <div className="mt-6">
        <Suspense fallback={<div className="text-sm text-silver-300">Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>

      <p className="mt-6 text-center text-sm text-silver-300">
        New here?{" "}
        <Link href="/signup" className="text-blood-500 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function BuyButton({ productId }: { productId: string }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buy() {
    if (status === "loading") return;
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(location.pathname + "#buy")}`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Checkout failed");
        return;
      }
      router.push(data.redirectUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button onClick={buy} disabled={loading} className="btn-primary px-8 py-3 text-base disabled:opacity-50">
        {loading ? "Opening checkout…" : "Buy now"}
      </button>
      {error && <p className="text-sm text-blood-500">{error}</p>}
    </div>
  );
}

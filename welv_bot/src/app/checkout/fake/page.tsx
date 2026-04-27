"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function FakeCheckout() {
  const sp = useSearchParams();
  const router = useRouter();
  const orderId = sp.get("orderId");
  const next = sp.get("next") ?? "/dashboard";
  const [status, setStatus] = useState<"idle" | "paying" | "done" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) setStatus("error");
  }, [orderId]);

  async function pay(simulate: "success" | "fail") {
    if (!orderId) return;
    setStatus("paying");
    setErr(null);
    if (simulate === "fail") {
      setStatus("error");
      setErr("Payment was declined by the (fake) bank. Try again, demon.");
      return;
    }
    const res = await fetch("/api/checkout/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data?.error ?? "Confirm failed");
      setStatus("error");
      return;
    }
    setStatus("done");
    router.push(next);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl glass-card p-8">
      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-blood-500">▸ Fake checkout</div>
      <h1 className="mt-2 heading-display text-3xl text-silver-100">Pretend Pay</h1>
      <p className="mt-2 text-sm text-silver-300">
        Development checkout. No card. No charge. Click <b>Pay</b> and we&apos;ll mark the order as
        paid and unlock your downloads instantly. Wire up Stripe or YooKassa later.
      </p>

      <div className="mt-6 rounded-xl border border-white/5 bg-ink-900/60 p-4 font-mono text-xs">
        order_id: <span className="text-blood-500">{orderId ?? "missing"}</span>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={() => pay("success")} disabled={status === "paying"} className="btn-primary disabled:opacity-50">
          {status === "paying" ? "Paying…" : "Pay (success)"}
        </button>
        <button onClick={() => pay("fail")} className="btn-ghost">
          Simulate failure
        </button>
      </div>

      {err && <p className="mt-4 text-sm text-blood-500">{err}</p>}
      {status === "done" && <p className="mt-4 text-sm text-silver-200">Paid. Redirecting…</p>}
    </div>
  );
}

export default function FakeCheckoutPage() {
  return (
    <div className="container-x py-20">
      <Suspense fallback={<div className="container-x text-silver-300">Loading checkout…</div>}>
        <FakeCheckout />
      </Suspense>
    </div>
  );
}

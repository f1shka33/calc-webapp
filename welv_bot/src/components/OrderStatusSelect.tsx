"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function change(next: string) {
    start(async () => {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next })
      });
      if (res.ok) router.refresh();
    });
  }

  return (
    <select
      value={status}
      onChange={(e) => change(e.target.value)}
      disabled={pending}
      className="input w-auto text-xs"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} className="bg-ink-900">{s}</option>
      ))}
    </select>
  );
}

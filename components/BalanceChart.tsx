"use client";

import { useStore } from "@/lib/store";
import { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Point {
  t: number;
  label: string;
  value: number;
}

/**
 * Walks transactions backwards from the current total to construct a 30-day
 * synthetic balance curve. Sandbox-only — visual indicator, not analytics.
 */
function buildSeries(totalNow: number, txs: { createdAt: number; usdValue: number; amount: number }[]) {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const start = now - 30 * day;
  const buckets: number[] = new Array(30).fill(0);

  for (const tx of txs) {
    if (tx.createdAt < start) continue;
    const idx = Math.min(29, Math.floor((tx.createdAt - start) / day));
    const sign = tx.amount >= 0 ? 1 : -1;
    buckets[idx] += sign * tx.usdValue;
  }

  // Walk backwards from current total.
  const values: number[] = new Array(30).fill(0);
  let runningEnd = totalNow;
  for (let i = 29; i >= 0; i--) {
    values[i] = Math.max(0, runningEnd);
    runningEnd -= buckets[i];
  }

  const points: Point[] = values.map((v, i) => ({
    t: start + i * day,
    label: new Date(start + i * day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    value: +v.toFixed(2),
  }));
  return points;
}

export function BalanceChart() {
  const txs = useStore((s) => s.transactions);
  const total = useStore((s) =>
    s.coins.reduce((acc, c) => acc + c.balance * c.unitPrice, 0),
  );

  const data = useMemo(() => buildSeries(total, txs), [total, txs]);

  return (
    <div className="h-44 w-full -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF6A00" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#FF2D55" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="label"
            stroke="rgba(255,255,255,0.25)"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis hide domain={["auto", "auto"]} />
          <Tooltip
            cursor={{ stroke: "rgba(255,255,255,0.2)" }}
            contentStyle={{
              background: "rgba(10,10,15,0.92)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              color: "white",
              fontSize: 12,
            }}
            formatter={(v: number) => [`$${v.toLocaleString()}`, "Demo balance"]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#FF8A3D"
            strokeWidth={2}
            fill="url(#balGrad)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

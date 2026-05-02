import type { Coin } from "@/types";
import { cn } from "@/lib/utils";

export function CoinIcon({ coin, size = 36, className }: { coin: Coin; size?: number; className?: string }) {
  const fontSize = Math.max(10, Math.round(size * 0.32));
  return (
    <div
      className={cn("rounded-full grid place-items-center text-white shrink-0 shadow-md", className)}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${coin.gradient[0]} 0%, ${coin.gradient[1]} 100%)`,
        boxShadow: `0 0 22px -8px ${coin.gradient[1]}`,
      }}
    >
      <span className="font-black tracking-wide" style={{ fontSize }}>
        {coin.symbol.slice(0, 3)}
      </span>
    </div>
  );
}

export function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const rounded = Math.round(rating * 2) / 2;
  const px = size === "lg" ? "text-base" : size === "md" ? "text-sm" : "text-xs";
  return (
    <span className={`inline-flex items-center gap-0.5 ${px} text-blood-500`} aria-label={`${rating} stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        const v = i + 1;
        const fill = rounded >= v ? 1 : rounded >= v - 0.5 ? 0.5 : 0;
        return (
          <span key={i} className="relative inline-block">
            <span className="text-white/15">★</span>
            <span
              className="absolute inset-0 overflow-hidden text-blood-500"
              style={{ width: `${fill * 100}%` }}
            >
              ★
            </span>
          </span>
        );
      })}
      <span className="ml-1 font-mono text-silver-300">{rating.toFixed(1)}</span>
    </span>
  );
}

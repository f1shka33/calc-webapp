export function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function formatRub(kopecks: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(kopecks / 100);
}

export function priceLine(usdCents: number, rubKop: number) {
  return `${formatUsd(usdCents)} · ${formatRub(rubKop)}`;
}

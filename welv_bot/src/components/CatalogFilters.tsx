"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

type Props = {
  categories: { slug: string; name: string }[];
  initial: {
    q?: string;
    category?: string;
    format?: string;
    min?: string;
    max?: string;
    sort?: string;
  };
};

const FORMATS = ["FXP", "FST", "PSD", "Figma", "PDF", "WAV", "ZIP", "Service", "Bundle"];
const SORTS = [
  { value: "popular", label: "Popular" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" }
];

export function CatalogFilters({ categories, initial }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  function set(key: string, value: string | undefined) {
    const next = new URLSearchParams(sp.toString());
    if (value && value.length > 0) next.set(key, value);
    else next.delete(key);
    startTransition(() => router.push(`/catalog?${next.toString()}`));
  }

  function reset() {
    startTransition(() => router.push("/catalog"));
  }

  return (
    <aside className="glass-card sticky top-20 h-fit p-5">
      <div className="flex items-center justify-between">
        <div className="heading-display text-lg text-silver-100">Filters</div>
        <button onClick={reset} className="text-xs uppercase tracking-wider text-silver-400 hover:text-blood-500">
          Reset
        </button>
      </div>

      <div className="mt-4 space-y-5">
        <div>
          <label className="label" htmlFor="q">Search</label>
          <input
            id="q"
            type="search"
            defaultValue={initial.q}
            onKeyDown={(e) => {
              if (e.key === "Enter") set("q", (e.target as HTMLInputElement).value);
            }}
            className="input"
            placeholder="vocals, banner, drill…"
          />
        </div>

        <div>
          <div className="label">Sort</div>
          <div className="grid grid-cols-2 gap-2">
            {SORTS.map((s) => (
              <button
                key={s.value}
                onClick={() => set("sort", s.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs uppercase tracking-wider transition ${
                  (initial.sort ?? "popular") === s.value
                    ? "border-blood-500 bg-blood-900/30 text-white"
                    : "border-white/10 text-silver-300 hover:border-white/20"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="label">Category</div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => set("category", undefined)}
              className={`pill ${!initial.category ? "border-blood-500 text-white" : ""}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                onClick={() => set("category", c.slug)}
                className={`pill ${initial.category === c.slug ? "border-blood-500 text-white" : ""}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="label">Format</div>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => set("format", undefined)}
              className={`pill ${!initial.format ? "border-blood-500 text-white" : ""}`}
            >
              Any
            </button>
            {FORMATS.map((f) => (
              <button
                key={f}
                onClick={() => set("format", f)}
                className={`pill ${initial.format === f ? "border-blood-500 text-white" : ""}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="label">Price (USD)</div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              defaultValue={initial.min}
              onBlur={(e) => set("min", e.target.value)}
              className="input"
              placeholder="0"
              min={0}
            />
            <span className="text-silver-400">—</span>
            <input
              type="number"
              defaultValue={initial.max}
              onBlur={(e) => set("max", e.target.value)}
              className="input"
              placeholder="500"
              min={0}
            />
          </div>
        </div>

        {pending && <div className="font-mono text-xs text-blood-500">Updating…</div>}
      </div>
    </aside>
  );
}

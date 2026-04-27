"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Cat = {
  id: string;
  slug: string;
  name: string;
  blurb: string | null;
  emoji: string | null;
  count: number;
};

export function CategoryManager({ initial }: { initial: Cat[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState({ slug: "", name: "", emoji: "", blurb: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creating)
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data?.error ?? "Failed.");
      return;
    }
    setCreating({ slug: "", name: "", emoji: "", blurb: "" });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this category?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr,320px]">
      <div className="overflow-hidden rounded-2xl border border-white/5">
        <table className="min-w-full text-sm">
          <thead className="bg-ink-900/60 text-left text-[10px] uppercase tracking-widest text-silver-400">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Emoji</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {initial.map((c) => (
              <tr key={c.id} className="text-silver-200">
                <td className="px-4 py-3 text-silver-100">{c.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{c.slug}</td>
                <td className="px-4 py-3">{c.emoji}</td>
                <td className="px-4 py-3 font-mono">{c.count}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => remove(c.id)} className="text-blood-500 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={create} className="glass-card space-y-3 p-5">
        <div className="heading-display text-lg text-silver-100">New category</div>
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            value={creating.name}
            onChange={(e) => setCreating({ ...creating, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="label">Slug</label>
          <input
            className="input"
            value={creating.slug}
            onChange={(e) => setCreating({ ...creating, slug: e.target.value })}
            required
            placeholder="lowercase-dashes"
          />
        </div>
        <div>
          <label className="label">Emoji</label>
          <input
            className="input"
            value={creating.emoji}
            onChange={(e) => setCreating({ ...creating, emoji: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Blurb</label>
          <input
            className="input"
            value={creating.blurb}
            onChange={(e) => setCreating({ ...creating, blurb: e.target.value })}
          />
        </div>
        {err && <p className="text-sm text-blood-500">{err}</p>}
        <button disabled={busy} className="btn-primary w-full disabled:opacity-50">
          {busy ? "Creating…" : "Create"}
        </button>
      </form>
    </div>
  );
}

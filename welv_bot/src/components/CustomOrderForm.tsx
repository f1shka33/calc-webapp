"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPES = [
  "Vocal preset",
  "Mix",
  "Cover",
  "Banner",
  "Beat",
  "Branding",
  "TikTok ideas",
  "Everything"
];

export function CustomOrderForm() {
  const router = useRouter();
  const [type, setType] = useState(TYPES[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const fd = new FormData(e.currentTarget);
    const payload = Object.fromEntries(fd.entries());
    const res = await fetch("/api/custom-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, type })
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data?.error ?? "Could not submit.");
      return;
    }
    const data = await res.json();
    setDone(data.id);
    setTimeout(() => router.push("/dashboard/custom-orders"), 1200);
  }

  if (done) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-blood-500">▸ Submitted</div>
        <h2 className="mt-2 heading-display text-3xl text-silver-100">Brief received.</h2>
        <p className="mt-2 text-sm text-silver-300">
          Reference: <span className="font-mono text-blood-500">#{done.slice(0, 8)}</span>. We&apos;ll
          reply within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass-card grid gap-5 p-6 md:grid-cols-2">
      <div className="md:col-span-2">
        <div className="label">What do you need?</div>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`pill ${type === t ? "border-blood-500 text-white" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <Field name="email" label="Email" type="email" required />
      <Field name="artistName" label="Artist name" required />
      <Field name="trackName" label="Track name" />
      <Field name="genre" label="Genre" placeholder="drill, dark trap, plug…" />
      <Field name="mood" label="Mood" placeholder="cold, demonic, sad-luxury…" />
      <Field name="budget" label="Budget" placeholder="$200 / 20 000 ₽ / open" />
      <Field name="deadline" label="Deadline" placeholder="3 days, by friday…" />
      <Field name="plugins" label="Plugins available" placeholder="Antares, FabFilter, Waves…" />
      <div className="md:col-span-2">
        <label className="label" htmlFor="references">References</label>
        <textarea
          id="references"
          name="references"
          rows={3}
          className="input min-h-[88px]"
          placeholder="Links / artist names / tracks / vibes."
        />
      </div>

      <Field
        name="uploadUrl"
        label="Upload link (Drive / WeTransfer)"
        placeholder="https://…"
      />
      <Field name="extra" label="Extra comments" placeholder="(optional)" />

      <div className="md:col-span-2">
        <label className="label" htmlFor="comments">Anything else?</label>
        <textarea id="comments" name="comments" rows={3} className="input min-h-[88px]" />
      </div>

      {err && <p className="md:col-span-2 text-sm text-blood-500">{err}</p>}
      <div className="md:col-span-2">
        <button disabled={busy} className="btn-primary px-8 py-3 disabled:opacity-50">
          {busy ? "Submitting…" : "Submit brief"}
        </button>
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
        {required && <span className="text-blood-500"> *</span>}
      </label>
      <input id={name} name={name} type={type} required={required} placeholder={placeholder} className="input" />
    </div>
  );
}

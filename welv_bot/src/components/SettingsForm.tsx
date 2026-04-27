"use client";

import { useState } from "react";

export function SettingsForm({
  user
}: {
  user: { email: string; name: string | null; role: string };
}) {
  const [name, setName] = useState(user.name ?? "");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setErr(null);
    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password: password || undefined })
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErr(data?.error ?? "Could not update.");
      return;
    }
    setMsg("Saved.");
    setPassword("");
  }

  return (
    <form onSubmit={save} className="glass-card space-y-4 p-6">
      <div>
        <label className="label">Email</label>
        <input className="input" disabled value={user.email} />
      </div>
      <div>
        <label className="label">Role</label>
        <input className="input" disabled value={user.role} />
      </div>
      <div>
        <label className="label" htmlFor="name">Artist name</label>
        <input
          id="name"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="@yourname"
        />
      </div>
      <div>
        <label className="label" htmlFor="pw">New password (optional)</label>
        <input
          id="pw"
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          placeholder="Leave blank to keep current"
        />
      </div>
      {err && <p className="text-sm text-blood-500">{err}</p>}
      {msg && <p className="text-sm text-emerald-400">{msg}</p>}
      <button disabled={busy} className="btn-primary disabled:opacity-50">
        {busy ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { generateBrief, type BriefKind } from "@/lib/briefs";

const KINDS: { value: BriefKind; label: string }[] = [
  { value: "cover", label: "Cover art brief" },
  { value: "vocal-mix", label: "Vocal mixing brief" },
  { value: "banner", label: "SoundCloud banner brief" },
  { value: "tiktok", label: "TikTok promo plan" },
  { value: "branding", label: "Artist branding plan" }
];

export function BriefGenerator() {
  const [kind, setKind] = useState<BriefKind>("cover");
  const [artistName, setArtistName] = useState("");
  const [trackName, setTrackName] = useState("");
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [references, setReferences] = useState("");
  const [desiredStyle, setDesiredStyle] = useState("");

  const output = generateBrief(kind, {
    artistName,
    trackName,
    genre,
    mood,
    references,
    desiredStyle
  });

  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
    } catch {
      /* noop */
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
      <div className="glass-card p-6">
        <div className="label">Type of brief</div>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button
              key={k.value}
              onClick={() => setKind(k.value)}
              className={`pill ${kind === k.value ? "border-blood-500 text-white" : ""}`}
            >
              {k.label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Artist name" value={artistName} onChange={setArtistName} placeholder="@yourname" />
          <Field label="Track name" value={trackName} onChange={setTrackName} placeholder="(optional)" />
          <Field label="Genre" value={genre} onChange={setGenre} placeholder="drill, dark trap…" />
          <Field label="Mood" value={mood} onChange={setMood} placeholder="cold, demonic, sad-lux…" />
          <div className="sm:col-span-2">
            <label className="label">References</label>
            <textarea
              className="input min-h-[88px]"
              value={references}
              onChange={(e) => setReferences(e.target.value)}
              placeholder="links, artists, tracks, vibes"
              rows={3}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Desired style</label>
            <textarea
              className="input min-h-[88px]"
              value={desiredStyle}
              onChange={(e) => setDesiredStyle(e.target.value)}
              placeholder="describe what you want"
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="glass-card flex flex-col p-6">
        <div className="flex items-center justify-between">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-blood-500">▸ Output</div>
          <button onClick={copy} className="btn-ghost">Copy</button>
        </div>
        <pre className="mt-3 flex-1 whitespace-pre-wrap rounded-xl border border-white/5 bg-ink-900/60 p-4 font-mono text-xs leading-relaxed text-silver-200">
          {output}
        </pre>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

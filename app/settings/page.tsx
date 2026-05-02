"use client";

import { GlassCard, SandboxNote, SectionTitle } from "@/components/GlassCard";
import { useStore } from "@/lib/store";
import { useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/Modal";
import { ShieldCheck, Trash2 } from "lucide-react";

const THEMES: { id: "dark" | "midnight" | "ember"; name: string; preview: string }[] = [
  { id: "dark", name: "Dark luxury", preview: "linear-gradient(135deg,#0e0e10,#070708)" },
  {
    id: "midnight",
    name: "Midnight",
    preview: "linear-gradient(135deg,#0a0e26,#04060f)",
  },
  {
    id: "ember",
    name: "Ember",
    preview: "linear-gradient(135deg,#2a0d0d,#0a0405)",
  },
];

export default function SettingsPage() {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const reset = useStore((s) => s.adminResetSandbox);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="max-w-4xl mx-auto w-full space-y-5">
      <GlassCard>
        <SectionTitle title="Theme" subtitle="Visual flavor for the sandbox." />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                updateSettings({ theme: t.id });
                toast.success(`Theme set to ${t.name}`);
              }}
              className={`glass !p-3 text-left flex items-center gap-3 hover:bg-white/[0.05] transition-all ${settings.theme === t.id ? "ring-2 ring-accent/40 border-accent/40" : ""}`}
            >
              <div
                className="w-12 h-12 rounded-xl border border-border-soft"
                style={{ background: t.preview }}
              />
              <div>
                <div className="font-medium">{t.name}</div>
                <div className="text-[12px] text-white/55">
                  {settings.theme === t.id ? "Active" : "Click to apply"}
                </div>
              </div>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle title="Display & UX" />
        <div className="space-y-3">
          <Row
            label="Display currency"
            description="Used in summaries. Sandbox rates."
            right={
              <select
                value={settings.displayCurrency}
                onChange={(e) =>
                  updateSettings({
                    displayCurrency: e.target.value as "USD" | "EUR" | "WLV",
                  })
                }
                className="field !w-auto !h-9"
              >
                <option className="bg-bg-soft" value="USD">USD</option>
                <option className="bg-bg-soft" value="EUR">EUR</option>
                <option className="bg-bg-soft" value="WLV">WLV</option>
              </select>
            }
          />
          <Toggle
            label="Animations"
            description="Smooth page transitions, motion accents."
            value={settings.animationsEnabled}
            onChange={(v) => updateSettings({ animationsEnabled: v })}
          />
          <Toggle
            label="Hide balances"
            description="Mask all sandbox balance numbers."
            value={settings.hideBalances}
            onChange={(v) => updateSettings({ hideBalances: v })}
          />
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle
          title="Mock security"
          subtitle="None of these are real security features — they're just UI toggles."
        />
        <div className="space-y-3">
          <Toggle
            label="Pretend 2FA"
            description="Visual-only toggle. There is no real 2FA, this is a demo."
            value={settings.twoFactorMock}
            onChange={(v) => updateSettings({ twoFactorMock: v })}
          />
          <div className="glass !p-3 flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
            <div className="text-[12.5px] text-white/65">
              All authentication, balances, and history are stored locally in your browser. There is no server, no
              real account, and no real money.
            </div>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle title="Sandbox data" subtitle="Reset wipes coins, transactions, history and stats." />
        <button
          className="btn-outline !text-rose-300 !border-rose-400/30 hover:!bg-rose-500/10"
          onClick={() => setConfirmReset(true)}
        >
          <Trash2 className="w-4 h-4" /> Reset sandbox data
        </button>
        <div className="mt-3"><SandboxNote /></div>
      </GlassCard>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset sandbox data?"
        description="This wipes your demo balances, transactions, game history and profile, and reseeds the sandbox. This is local-only and cannot affect any real accounts."
      >
        <div className="flex justify-end gap-2">
          <button className="btn-outline" onClick={() => setConfirmReset(false)}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              reset();
              setConfirmReset(false);
              toast.success("Sandbox reset", { description: "Reseeded with default demo data." });
            }}
          >
            Reset everything
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Row({
  label,
  description,
  right,
}: {
  label: string;
  description?: string;
  right: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="font-medium text-sm">{label}</div>
        {description && <div className="text-[12px] text-white/55">{description}</div>}
      </div>
      {right}
    </div>
  );
}

function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <Row
      label={label}
      description={description}
      right={
        <button
          onClick={() => onChange(!value)}
          className={`w-11 h-6 rounded-full relative transition-colors ${value ? "bg-accent" : "bg-white/[0.08]"}`}
          aria-pressed={value}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${value ? "translate-x-5" : ""}`}
          />
        </button>
      }
    />
  );
}

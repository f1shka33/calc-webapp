import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function GlassCard({
  className,
  children,
  hover = true,
  strong = false,
}: {
  className?: string;
  children: ReactNode;
  hover?: boolean;
  strong?: boolean;
}) {
  return (
    <div
      className={cn(
        strong ? "glass-strong" : "glass",
        "p-5 transition-all duration-300",
        hover && "hover:border-border-strong hover:bg-white/[0.05]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3 mb-3">
      <div>
        <h2 className="text-lg sm:text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-[13px] text-white/45 mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}

export function SandboxNote({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-[11px] text-amber-200/80">
      <span className="badge-demo">Demo</span>
      <span>{children ?? "Sandbox data only — created by welv_bot."}</span>
    </div>
  );
}

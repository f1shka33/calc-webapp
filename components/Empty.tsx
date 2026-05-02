import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "glass p-8 text-center flex flex-col items-center gap-3",
        className,
      )}
    >
      {icon && (
        <div className="w-12 h-12 grid place-items-center rounded-2xl bg-white/[0.04] border border-border-soft text-white/55">
          {icon}
        </div>
      )}
      <div>
        <div className="text-[15px] font-semibold">{title}</div>
        {description && (
          <div className="text-[13px] text-white/55 mt-1 max-w-sm mx-auto">{description}</div>
        )}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton h-4 w-full", className)} />;
}

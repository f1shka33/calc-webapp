import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  blurb,
  align = "left",
  className
}: {
  eyebrow?: string;
  title: string;
  blurb?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-blood-500">
          ▸ {eyebrow}
        </div>
      )}
      <h2 className="heading-display text-balance text-4xl text-silver-100 md:text-5xl">
        {title}
      </h2>
      {blurb && <p className="mt-4 text-balance text-silver-300">{blurb}</p>}
    </div>
  );
}

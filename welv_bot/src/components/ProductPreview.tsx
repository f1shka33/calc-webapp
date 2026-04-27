// Generates a deterministic dark-luxury preview from the product slug/title.
// We don't ship real product images — instead we render an animated, on-brand
// placeholder so the catalog still feels premium without external assets.

function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const PALETTES = [
  ["#ff1a3c", "#5a000d"],
  ["#e60026", "#1a000a"],
  ["#ff3550", "#2b0010"],
  ["#c9001a", "#0a0a0d"],
  ["#ff5c79", "#3b0014"],
  ["#a30016", "#10020a"]
];

export function ProductPreview({
  title,
  imageUrl,
  categorySlug
}: {
  title: string;
  imageUrl: string | null;
  categorySlug?: string;
}) {
  if (imageUrl && imageUrl.startsWith("http")) {
    // Real image
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
      />
    );
  }

  const seed = hashStr(title + (categorySlug ?? ""));
  const [c1, c2] = PALETTES[seed % PALETTES.length];
  const angle = seed % 360;
  const initials = title
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 3)
    .join("")
    .toUpperCase();

  return (
    <div className="absolute inset-0 grain scanlines">
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(${angle}deg, ${c2}, #050507 60%, ${c1} 130%)`
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,26,60,0.35),transparent_60%)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <span className="absolute -inset-10 rounded-full bg-blood-500/20 blur-3xl" />
          <span className="relative font-display text-7xl tracking-tighter text-silver-100/90 mix-blend-screen">
            {initials || "W_"}
          </span>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-ink-950 to-transparent" />
    </div>
  );
}

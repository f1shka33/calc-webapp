export function HeroBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -top-32 left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-radial-blood blur-3xl" />
      <div className="absolute inset-0 bg-noise opacity-25 mix-blend-overlay" />
      <div className="absolute inset-0 scanlines opacity-40" />
      <div className="absolute -left-40 top-32 h-72 w-72 rounded-full bg-blood-700/30 blur-3xl animate-drift" />
      <div className="absolute -right-32 bottom-10 h-72 w-72 rounded-full bg-blood-500/20 blur-3xl animate-drift" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blood-500/60 to-transparent" />
    </div>
  );
}

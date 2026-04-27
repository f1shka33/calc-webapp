import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x py-32 text-center">
      <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-blood-500">▸ 404</div>
      <h1 className="mt-2 heading-display text-7xl text-silver-100 text-glow">Lost in the catalog</h1>
      <p className="mx-auto mt-3 max-w-md text-silver-300">
        That track doesn&apos;t exist. The hard drive is cursed.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="btn-primary">Back home</Link>
        <Link href="/catalog" className="btn-ghost">Browse catalog</Link>
      </div>
    </div>
  );
}

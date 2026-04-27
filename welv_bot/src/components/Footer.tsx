import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/5 bg-ink-950/80">
      <div className="container-x grid gap-10 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="heading-display text-3xl text-silver-100">
            welv<span className="text-blood-500">_</span>bot
          </div>
          <p className="mt-3 max-w-md text-sm text-silver-300">
            Buy digital weapons. Drop music. Become unavoidable. A dark luxury marketplace for
            underground artists, SoundCloud rappers, and TikTok demons.
          </p>
        </div>
        <div>
          <div className="label">Store</div>
          <ul className="space-y-2 text-sm text-silver-300">
            <li><Link href="/catalog" className="hover:text-white">Catalog</Link></li>
            <li><Link href="/custom-order" className="hover:text-white">Custom Order</Link></li>
            <li><Link href="/ai-brief" className="hover:text-white">AI Brief Generator</Link></li>
          </ul>
        </div>
        <div>
          <div className="label">Account</div>
          <ul className="space-y-2 text-sm text-silver-300">
            <li><Link href="/login" className="hover:text-white">Login</Link></li>
            <li><Link href="/signup" className="hover:text-white">Sign up</Link></li>
            <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5">
        <div className="container-x flex flex-col items-start justify-between gap-2 py-6 text-xs text-silver-400 sm:flex-row sm:items-center">
          <div>© {new Date().getFullYear()} welv_bot. All weapons reserved.</div>
          <div className="font-mono text-[10px] uppercase tracking-widest">
            v0.1 · made for the underground
          </div>
        </div>
      </div>
    </footer>
  );
}

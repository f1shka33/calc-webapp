import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import { HeroBackdrop } from "@/components/HeroBackdrop";

export const dynamic = "force-dynamic";

const REASONS = [
  {
    title: "Sound illegal",
    body: "Vocal chains, presets and mixer states tuned by people who actually mix records — not YouTube tutorials."
  },
  {
    title: "Look expensive",
    body: "Cover art, banners and branding kits engineered to make your unsigned project look like a major rollout."
  },
  {
    title: "Sell insane",
    body: "TikTok promo plans and AI prompt packs designed to abuse the algorithm and force the FYP to know your name."
  },
  {
    title: "Move fast",
    body: "Drop in chains, swap text in templates, export, post. From 'demo' to 'product' in one evening."
  }
];

const STEPS = [
  { n: "01", title: "Pick your weapon", body: "Vocal preset, mixer chain, cover, banner, brief, bundle. The whole armory." },
  { n: "02", title: "Pay & unlock", body: "Stripe, YooKassa, fake-checkout for dev. Your downloads unlock instantly." },
  { n: "03", title: "Drop the track", body: "Open in your DAW or design tool, replace placeholders, export, ship." },
  { n: "04", title: "Become unavoidable", body: "Look expensive. Sound insane. Repeat until the For You page belongs to you." }
];

const REVIEWS = [
  {
    quote:
      "I bought the Demonic Vocal Chain and three TikToks later my song was on the FYP. Refunds are not a feature here.",
    name: "@vorthex",
    role: "Underground rap, RU"
  },
  {
    quote:
      "Banner kit alone made my SoundCloud look like I'm signed. I'm not. But I look like I am.",
    name: "@nyx9000",
    role: "TikTok, US"
  },
  {
    quote:
      "Mixing chain replaced my entire ChatGPT-engineered preset folder. I deleted it. I have peace now.",
    name: "@razorvox",
    role: "SoundCloud, EU"
  }
];

const FAQ = [
  {
    q: "Are the files actually delivered instantly?",
    a: "Yes. After a successful payment (or fake-checkout in dev), download links unlock in your dashboard and stay there forever."
  },
  {
    q: "What software do I need?",
    a: "Most products work with FL Studio, Ableton, Logic, Reaper, Photoshop or Figma. Each product page lists exact compatibility."
  },
  {
    q: "Can I use this for paid releases?",
    a: "Yes. The default license covers a single solo artist for unlimited commercial releases. Reach out for label / multi-artist licensing."
  },
  {
    q: "Can I get a refund?",
    a: "Digital goods are non-refundable once unlocked. If the file is broken, we replace it within 24h."
  },
  {
    q: "Do you do custom work?",
    a: "Yes. Open the Custom Order page or the AI Brief Generator. We build vocals, covers, banners and full rollouts on commission."
  }
];

export default async function HomePage() {
  const [bestSellers, categories] = await Promise.all([
    prisma.product
      .findMany({
        where: { featured: true },
        include: { category: true },
        orderBy: [{ popularity: "desc" }],
        take: 6
      })
      .catch(() => []),
    prisma.category.findMany({ orderBy: { sort: "asc" } }).catch(() => [])
  ]);

  return (
    <div className="relative">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <HeroBackdrop />
        <div className="container-x relative pb-20 pt-24 md:pb-32 md:pt-36">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blood-700/50 bg-blood-900/40 px-4 py-1.5 font-mono text-[11px] uppercase tracking-[0.3em] text-blood-500">
              <span className="h-1.5 w-1.5 animate-glow-pulse rounded-full bg-blood-500" />
              Underground · Premium · Unfair
            </div>
            <h1 className="heading-display text-balance text-7xl text-silver-100 text-glow md:text-9xl">
              welv<span className="text-blood-500">_</span>bot
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-silver-200 md:text-xl">
              Digital weapons for artists who want to{" "}
              <span className="text-blood-500">sound</span>,{" "}
              <span className="text-blood-500">look</span>, and{" "}
              <span className="text-blood-500">sell</span> insane.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/catalog" className="btn-primary px-8 py-3 text-base">
                Open Store
              </Link>
              <Link href="/custom-order" className="btn-ghost px-8 py-3 text-base">
                Create Custom Order
              </Link>
            </div>

            <div className="mt-14 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
              {[
                ["10+", "categories"],
                ["140+", "happy demons"],
                ["24h", "delivery on custom"],
                ["∞", "downloads after purchase"]
              ].map(([n, l]) => (
                <div key={l} className="glass-card px-4 py-4">
                  <div className="font-display text-3xl text-silver-100">{n}</div>
                  <div className="text-xs uppercase tracking-wider text-silver-300">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="container-x py-20">
        <div className="flex items-end justify-between gap-6">
          <SectionHeading
            eyebrow="Best sellers"
            title="The most-bought weapons this month"
            blurb="The drops that artists keep coming back for. Plug in. Drop. Disappear."
          />
          <Link href="/catalog" className="btn-ghost hidden md:inline-flex">
            See all →
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {bestSellers.length === 0 ? (
            <EmptyState />
          ) : (
            bestSellers.map((p) => <ProductCard key={p.id} product={p} />)
          )}
        </div>
      </section>

      {/* WHY WELV_BOT */}
      <section className="container-x py-20">
        <SectionHeading
          eyebrow="Why artists use welv_bot"
          title="Turn your trash demo into a demonic product."
          blurb="Built by underground producers, designers and engineers who got tired of recommending the same plugins."
        />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((r) => (
            <div key={r.title} className="glass-card p-6">
              <div className="heading-display text-xl text-blood-500">{r.title}</div>
              <p className="mt-2 text-sm text-silver-300">{r.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="container-x py-20">
        <SectionHeading
          eyebrow="Categories"
          title="The full arsenal."
          blurb="Pick a weapon. Each one is engineered to make your project sound or look like it has a label behind it."
        />
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/catalog?category=${c.slug}`}
              className="glass-card card-hover p-4 text-left"
            >
              <div className="text-2xl">{c.emoji ?? "✦"}</div>
              <div className="mt-2 heading-display text-sm text-silver-100">{c.name}</div>
              <div className="mt-1 text-xs text-silver-400">{c.blurb}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container-x py-20">
        <SectionHeading
          eyebrow="How it works"
          title="Four steps to a different career."
        />
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="glass-card relative overflow-hidden p-6">
              <div className="font-mono text-xs uppercase tracking-widest text-blood-500">
                {s.n}
              </div>
              <div className="mt-2 heading-display text-xl text-silver-100">{s.title}</div>
              <p className="mt-2 text-sm text-silver-300">{s.body}</p>
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-blood-700/20 blur-3xl" />
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container-x py-20">
        <SectionHeading
          eyebrow="Reviews"
          title="What artists say after the drop."
        />
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {REVIEWS.map((r) => (
            <figure key={r.name} className="glass-card p-6">
              <blockquote className="text-sm text-silver-200">“{r.quote}”</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blood-700 bg-blood-900/40 font-display text-blood-500">
                  {r.name.charAt(1)?.toUpperCase()}
                </div>
                <div>
                  <div className="text-sm text-silver-100">{r.name}</div>
                  <div className="text-xs uppercase tracking-wider text-silver-400">{r.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container-x py-20">
        <SectionHeading eyebrow="FAQ" title="Questions the underground actually asks." />
        <div className="mx-auto mt-10 max-w-3xl space-y-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group glass-card overflow-hidden p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between text-silver-100">
                <span className="heading-display text-lg">{f.q}</span>
                <span className="font-mono text-blood-500 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-silver-300">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container-x pb-32 pt-10">
        <div className="glass-card relative overflow-hidden p-10 text-center md:p-16">
          <div className="pointer-events-none absolute inset-0 bg-radial-blood opacity-80" />
          <div className="pointer-events-none absolute inset-0 bg-noise opacity-30 mix-blend-overlay" />
          <div className="relative">
            <h3 className="heading-display text-balance text-4xl text-silver-100 text-glow md:text-6xl">
              Buy digital weapons.
              <br /> Drop music.
              <br /> Become unavoidable.
            </h3>
            <p className="mx-auto mt-4 max-w-2xl text-balance text-silver-300">
              For artists who want to look expensive and sound insane. The store is open. The
              algorithm is hungry.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/catalog" className="btn-primary px-8 py-3 text-base">
                Open the store
              </Link>
              <Link href="/ai-brief" className="btn-outline px-8 py-3 text-base">
                Generate a brief
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full glass-card p-12 text-center text-silver-300">
      <div className="heading-display text-2xl text-silver-100">No products yet</div>
      <p className="mt-2 text-sm">
        Run <code className="rounded bg-white/5 px-2 py-0.5 font-mono text-blood-500">npm run db:seed</code>{" "}
        to populate the catalog.
      </p>
    </div>
  );
}

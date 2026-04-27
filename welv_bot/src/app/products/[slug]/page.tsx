import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatRub, formatUsd } from "@/lib/format";
import { Stars } from "@/components/Stars";
import { ProductPreview } from "@/components/ProductPreview";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { BuyButton } from "@/components/BuyButton";

export const dynamic = "force-dynamic";

export default async function ProductDetail({ params }: { params: { slug: string } }) {
  const product = await prisma.product
    .findUnique({
      where: { slug: params.slug },
      include: {
        category: true,
        reviews: { include: { user: true }, orderBy: { createdAt: "desc" }, take: 5 }
      }
    })
    .catch(() => null);

  if (!product) notFound();

  const related = await prisma.product
    .findMany({
      where: { categoryId: product.categoryId, NOT: { id: product.id } },
      include: { category: true },
      take: 3,
      orderBy: { popularity: "desc" }
    })
    .catch(() => []);

  const includes = product.includes.split("\n").filter(Boolean);
  const tags = product.tags.split(",").map((t) => t.trim()).filter(Boolean);

  return (
    <div className="container-x py-14">
      <div className="mb-6 flex items-center gap-2 text-xs uppercase tracking-wider text-silver-400">
        <Link href="/catalog" className="hover:text-white">Catalog</Link>
        <span>/</span>
        <Link href={`/catalog?category=${product.category.slug}`} className="hover:text-white">
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-silver-200">{product.title}</span>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="glass-card relative aspect-[4/3] overflow-hidden">
          <ProductPreview
            title={product.title}
            imageUrl={product.imageUrl}
            categorySlug={product.category.slug}
          />
          <div className="absolute left-4 top-4 flex gap-2">
            <span className="pill-blood">{product.category.name}</span>
            {product.featured && <span className="pill">Best seller</span>}
          </div>
        </div>

        <div>
          <h1 className="heading-display text-balance text-5xl text-silver-100 text-glow">
            {product.title}
          </h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-silver-300">
            <Stars rating={product.rating} size="md" />
            <span className="font-mono">·</span>
            <span>{product.ratingCount} reviews</span>
          </div>

          <p className="mt-6 text-balance text-silver-200">{product.shortDesc}</p>

          <div className="mt-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <div className="font-display text-4xl text-white">{formatUsd(product.priceUsdCents)}</div>
            <div className="font-mono text-lg text-silver-300">{formatRub(product.priceRubKop)}</div>
          </div>

          <div id="buy" className="mt-6 flex flex-wrap gap-3">
            <BuyButton productId={product.id} />
            <Link href="/custom-order" className="btn-ghost">
              Need a custom version?
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
            <Spec label="Format" value={product.format} />
            <Spec label="License" value={product.license} />
            {product.compatibility && <Spec label="Compatibility" value={product.compatibility} />}
            <Spec label="Tags" value={tags.map((t) => `#${t}`).join("  ")} />
          </div>
        </div>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="glass-card p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-blood-500">▸ Description</div>
          <h2 className="mt-2 heading-display text-2xl text-silver-100">What is this?</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-silver-300">
            {product.description}
          </p>
        </section>

        <section className="glass-card p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-blood-500">▸ Includes</div>
          <h2 className="mt-2 heading-display text-2xl text-silver-100">What you get</h2>
          <ul className="mt-3 space-y-2">
            {includes.map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm text-silver-200">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blood-500" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="mt-14">
        <div className="flex items-end justify-between">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-blood-500">▸ Reviews</div>
          <Link href="#buy" className="text-xs uppercase tracking-wider text-silver-400 hover:text-white">
            Buy & write one →
          </Link>
        </div>
        <h2 className="mt-2 heading-display text-3xl text-silver-100">From the underground</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {product.reviews.length === 0 ? (
            <div className="glass-card p-6 text-sm text-silver-300">
              No reviews yet. Be the first demon to drop one.
            </div>
          ) : (
            product.reviews.map((r) => (
              <article key={r.id} className="glass-card p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-silver-100">{r.user.name ?? "Anonymous"}</div>
                  <Stars rating={r.rating} />
                </div>
                <p className="mt-2 text-sm text-silver-300">{r.body}</p>
              </article>
            ))
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="heading-display text-3xl text-silver-100">Related weapons</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p as ProductCardData} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-ink-900/40 p-3">
      <div className="text-[10px] uppercase tracking-widest text-silver-400">{label}</div>
      <div className="mt-1 text-silver-100">{value}</div>
    </div>
  );
}

import Link from "next/link";
import { formatRub, formatUsd } from "@/lib/format";
import { Stars } from "@/components/Stars";
import { ProductPreview } from "@/components/ProductPreview";

export type ProductCardData = {
  id: string;
  slug: string;
  title: string;
  shortDesc: string;
  priceUsdCents: number;
  priceRubKop: number;
  imageUrl: string | null;
  rating: number;
  ratingCount: number;
  tags: string;
  category: { name: string; slug: string };
};

export function ProductCard({ product }: { product: ProductCardData }) {
  const tags = product.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <article className="group glass-card card-hover relative flex flex-col overflow-hidden">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-[4/3] overflow-hidden border-b border-white/5"
      >
        <ProductPreview
          title={product.title}
          imageUrl={product.imageUrl}
          categorySlug={product.category.slug}
        />
        <span className="pill-blood absolute left-3 top-3">{product.category.name}</span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center justify-between text-xs text-silver-300">
          <Stars rating={product.rating} />
          <span className="font-mono">{product.ratingCount} reviews</span>
        </div>
        <h3 className="mt-3 heading-display text-xl text-silver-100">
          <Link href={`/products/${product.slug}`} className="hover:text-blood-500">
            {product.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-silver-300">{product.shortDesc}</p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span key={t} className="pill">#{t}</span>
          ))}
        </div>

        <div className="mt-5 flex items-end justify-between">
          <div>
            <div className="font-mono text-lg text-white">{formatUsd(product.priceUsdCents)}</div>
            <div className="font-mono text-xs text-silver-400">{formatRub(product.priceRubKop)}</div>
          </div>
          <div className="flex gap-2">
            <Link href={`/products/${product.slug}`} className="btn-ghost">
              View
            </Link>
            <Link href={`/products/${product.slug}#buy`} className="btn-primary">
              Buy
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { SectionHeading } from "@/components/SectionHeading";
import { CatalogFilters } from "@/components/CatalogFilters";

export const dynamic = "force-dynamic";

type Search = {
  q?: string;
  category?: string;
  format?: string;
  min?: string;
  max?: string;
  sort?: "popular" | "newest" | "price-asc" | "price-desc";
};

export default async function CatalogPage({
  searchParams
}: {
  searchParams: Search;
}) {
  const sort = searchParams.sort ?? "popular";

  const where: Prisma.ProductWhereInput = {};
  if (searchParams.q) {
    const q = searchParams.q;
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { shortDesc: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { tags: { contains: q, mode: "insensitive" } }
    ];
  }
  if (searchParams.category) where.category = { slug: searchParams.category };
  if (searchParams.format) where.format = { contains: searchParams.format, mode: "insensitive" };
  if (searchParams.min || searchParams.max) {
    where.priceUsdCents = {};
    if (searchParams.min) where.priceUsdCents.gte = Number(searchParams.min) * 100;
    if (searchParams.max) where.priceUsdCents.lte = Number(searchParams.max) * 100;
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "newest"
      ? { createdAt: "desc" }
      : sort === "price-asc"
      ? { priceUsdCents: "asc" }
      : sort === "price-desc"
      ? { priceUsdCents: "desc" }
      : { popularity: "desc" };

  const [products, categories] = await Promise.all([
    prisma.product.findMany({ where, orderBy, include: { category: true } }).catch(() => []),
    prisma.category.findMany({ orderBy: { sort: "asc" } }).catch(() => [])
  ]);

  return (
    <div className="container-x py-14">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow="Catalog"
          title="The full armory."
          blurb="Filter, search, sort. Click. Drop the demo. Become a product."
        />
        <Link href="/custom-order" className="btn-outline self-start md:self-end">
          Need something custom?
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[280px,1fr]">
        <CatalogFilters
          categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
          initial={searchParams}
        />

        <div>
          <div className="mb-4 flex items-center justify-between text-sm text-silver-300">
            <div>
              <span className="font-mono text-blood-500">{products.length}</span> result
              {products.length === 1 ? "" : "s"}
            </div>
          </div>
          {products.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <div className="heading-display text-2xl text-silver-100">Nothing matches.</div>
              <p className="mt-2 text-sm text-silver-300">
                Try clearing filters or searching for something looser. The underground rewards
                weirder queries.
              </p>
              <Link href="/catalog" className="btn-ghost mt-4">
                Reset filters
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p as ProductCardData} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

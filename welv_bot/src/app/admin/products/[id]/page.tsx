import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id: params.id } }),
    prisma.category.findMany({ orderBy: { sort: "asc" } })
  ]);
  if (!product) notFound();
  return (
    <div>
      <h2 className="heading-display text-2xl text-silver-100">Edit product</h2>
      <div className="mt-4">
        <ProductForm
          mode="edit"
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          product={{
            id: product.id,
            slug: product.slug,
            title: product.title,
            shortDesc: product.shortDesc,
            description: product.description,
            priceUsd: product.priceUsdCents / 100,
            priceRub: product.priceRubKop / 100,
            format: product.format,
            license: product.license,
            compatibility: product.compatibility ?? "",
            includes: product.includes,
            tags: product.tags,
            categoryId: product.categoryId,
            imageUrl: product.imageUrl ?? "",
            fileUrl: product.fileUrl ?? "",
            featured: product.featured
          }}
        />
      </div>
    </div>
  );
}

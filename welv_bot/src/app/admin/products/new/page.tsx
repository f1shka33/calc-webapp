import { prisma } from "@/lib/prisma";
import { ProductForm } from "@/components/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({ orderBy: { sort: "asc" } });
  return (
    <div>
      <h2 className="heading-display text-2xl text-silver-100">New product</h2>
      <div className="mt-4">
        <ProductForm
          mode="create"
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        />
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { CategoryManager } from "@/components/CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sort: "asc" },
    include: { _count: { select: { products: true } } }
  });
  return (
    <div>
      <h2 className="heading-display text-2xl text-silver-100">Categories</h2>
      <div className="mt-4">
        <CategoryManager
          initial={categories.map((c) => ({
            id: c.id,
            slug: c.slug,
            name: c.name,
            blurb: c.blurb,
            emoji: c.emoji,
            count: c._count.products
          }))}
        />
      </div>
    </div>
  );
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { ProductSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const adminCheck = await requireAdminApi();
  if (adminCheck) return adminCheck;

  const json = await req.json().catch(() => null);
  const parsed = ProductSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { priceUsd, priceRub, imageUrl, fileUrl, ...rest } = parsed.data;
  const created = await prisma.product.create({
    data: {
      ...rest,
      imageUrl: imageUrl || null,
      fileUrl: fileUrl || null,
      priceUsdCents: Math.round(priceUsd * 100),
      priceRubKop: Math.round(priceRub * 100)
    }
  });
  return NextResponse.json({ id: created.id });
}

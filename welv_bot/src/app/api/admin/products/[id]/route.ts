import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { ProductSchema } from "@/lib/validators";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const adminCheck = await requireAdminApi();
  if (adminCheck) return adminCheck;

  const json = await req.json().catch(() => null);
  const parsed = ProductSchema.partial().safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { priceUsd, priceRub, imageUrl, fileUrl, ...rest } = parsed.data;
  const data: Record<string, unknown> = { ...rest };
  if (priceUsd !== undefined) data.priceUsdCents = Math.round(priceUsd * 100);
  if (priceRub !== undefined) data.priceRubKop = Math.round(priceRub * 100);
  if (imageUrl !== undefined) data.imageUrl = imageUrl || null;
  if (fileUrl !== undefined) data.fileUrl = fileUrl || null;

  await prisma.product.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const adminCheck = await requireAdminApi();
  if (adminCheck) return adminCheck;
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";
import { CategorySchema } from "@/lib/validators";

export async function POST(req: Request) {
  const adminCheck = await requireAdminApi();
  if (adminCheck) return adminCheck;
  const json = await req.json().catch(() => null);
  const parsed = CategorySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }
  const created = await prisma.category.create({ data: parsed.data });
  return NextResponse.json({ id: created.id });
}

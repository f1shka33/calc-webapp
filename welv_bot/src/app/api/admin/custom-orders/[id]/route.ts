import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

const Schema = z.object({
  status: z.enum(["NEW", "ACCEPTED", "IN_PROGRESS", "DELIVERED", "REJECTED"])
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const adminCheck = await requireAdminApi();
  if (adminCheck) return adminCheck;

  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  await prisma.customOrder.update({
    where: { id: params.id },
    data: { status: parsed.data.status }
  });
  return NextResponse.json({ ok: true });
}

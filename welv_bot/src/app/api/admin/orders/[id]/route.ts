import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/admin";

const Schema = z.object({
  status: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"])
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const adminCheck = await requireAdminApi();
  if (adminCheck) return adminCheck;

  const json = await req.json().catch(() => null);
  const parsed = Schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: params.id }, include: { items: true } });
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: parsed.data.status,
        paidAt: parsed.data.status === "PAID" ? order.paidAt ?? new Date() : order.paidAt
      }
    });

    if (parsed.data.status === "PAID") {
      // Ensure download rows exist for each item.
      for (const item of order.items) {
        const existing = await tx.download.findFirst({
          where: { orderId: order.id, productId: item.productId }
        });
        if (!existing) {
          await tx.download.create({
            data: {
              userId: order.userId,
              orderId: order.id,
              productId: item.productId
            }
          });
        }
      }
    }
  });

  return NextResponse.json({ ok: true });
}

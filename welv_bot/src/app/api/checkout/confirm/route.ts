import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// Used by /checkout/fake to confirm a fake-checkout order.
// Real Stripe/YooKassa flows should confirm via webhook routes.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let json: { orderId?: string };
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = json.orderId;
  if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (order.provider !== "FAKE") {
    return NextResponse.json(
      { error: "Confirm is only available for fake-checkout orders." },
      { status: 400 }
    );
  }
  if (order.status === "PAID") {
    return NextResponse.json({ ok: true, alreadyPaid: true });
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: "PAID", paidAt: new Date() }
    });
    for (const item of order.items) {
      // Create download entries for each item (one per quantity unit isn't necessary —
      // a single Download row grants ongoing access to the product for that order).
      await tx.download.create({
        data: {
          userId: order.userId,
          productId: item.productId,
          orderId: order.id
        }
      });
      await tx.product.update({
        where: { id: item.productId },
        data: { popularity: { increment: 1 } }
      });
    }
  });

  return NextResponse.json({ ok: true });
}

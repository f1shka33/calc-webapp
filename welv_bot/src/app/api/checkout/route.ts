import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getPaymentProvider } from "@/lib/payments";
import { z } from "zod";

const Schema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(10).default(1)
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const totalUsdCents = product.priceUsdCents * parsed.data.quantity;
  const totalRubKop = product.priceRubKop * parsed.data.quantity;

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      status: "PENDING",
      totalUsdCents,
      totalRubKop,
      provider:
        (process.env.PAYMENT_PROVIDER ?? "fake").toUpperCase() === "STRIPE"
          ? "STRIPE"
          : (process.env.PAYMENT_PROVIDER ?? "fake").toUpperCase() === "YOOKASSA"
          ? "YOOKASSA"
          : "FAKE",
      items: {
        create: [
          {
            productId: product.id,
            quantity: parsed.data.quantity,
            priceUsdCents: product.priceUsdCents,
            priceRubKop: product.priceRubKop
          }
        ]
      }
    }
  });

  const provider = getPaymentProvider();
  const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const successUrl = `${origin}/dashboard?paid=${order.id}`;
  const cancelUrl = `${origin}/products/${product.slug}?canceled=1`;

  try {
    const result = await provider.createPayment({
      orderId: order.id,
      amountUsdCents: totalUsdCents,
      amountRubKop: totalRubKop,
      description: product.title,
      successUrl,
      cancelUrl
    });

    await prisma.order.update({
      where: { id: order.id },
      data: { providerRef: result.providerRef }
    });

    return NextResponse.json({ redirectUrl: result.redirectUrl, orderId: order.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Payment provider error" },
      { status: 500 }
    );
  }
}

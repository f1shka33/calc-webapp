import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

// Issues a redirect to the actual product file (or a placeholder text response
// if no fileUrl is set). Tracks download counts.
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const dl = await prisma.download.findUnique({
    where: { token: params.token },
    include: { product: true, order: true }
  });
  if (!dl) return NextResponse.json({ error: "Download not found" }, { status: 404 });
  if (dl.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (dl.order.status !== "PAID") {
    return NextResponse.json({ error: "Order not paid" }, { status: 402 });
  }

  await prisma.download.update({
    where: { id: dl.id },
    data: { count: { increment: 1 }, lastUsedAt: new Date() }
  });

  if (dl.product.fileUrl) {
    return NextResponse.redirect(dl.product.fileUrl);
  }

  // No fileUrl configured yet — return a friendly placeholder so the link works
  // end-to-end during development.
  const body =
    `welv_bot — placeholder download\n\n` +
    `Product: ${dl.product.title}\n` +
    `Token: ${dl.token}\n\n` +
    `The admin hasn't uploaded the real file yet.\n` +
    `Set product.fileUrl in the admin dashboard to deliver the real asset.\n`;
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${dl.product.slug}.txt"`
    }
  });
}

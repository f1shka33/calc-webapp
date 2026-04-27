import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { CustomOrderSchema } from "@/lib/validators";

export async function POST(req: Request) {
  const session = await getSession();

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = CustomOrderSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const created = await prisma.customOrder.create({
    data: {
      ...parsed.data,
      userId: session?.user?.id ?? null
    }
  });

  return NextResponse.json({ id: created.id });
}

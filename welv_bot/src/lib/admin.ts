import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

// Returns a NextResponse if the request is unauthorized; otherwise returns null.
export async function requireAdminApi() {
  const session = await getSession();
  if (!session?.user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { requireAdminApi } from "@/lib/admin";

// Local-disk upload handler for development. In production, swap this for S3/R2/Supabase Storage.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(req: Request) {
  const adminCheck = await requireAdminApi();
  if (adminCheck) return adminCheck;

  const fd = await req.formData();
  const file = fd.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = path.extname(file.name) || "";
  const safeBase = path.basename(file.name, ext).replace(/[^a-z0-9-_]+/gi, "-").slice(0, 40) || "file";
  const filename = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${safeBase}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);

  return NextResponse.json({ url: `/uploads/${filename}`, name: file.name, size: file.size });
}

export const runtime = "nodejs";

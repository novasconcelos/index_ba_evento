import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest } from "next/server";
import { UPLOAD_DIR } from "@/lib/providers/storage";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  // Só permitimos um nome de arquivo simples (sem travessia de diretório).
  const base = path.basename(name);
  if (base !== name) {
    return new Response("Not found", { status: 404 });
  }

  const fullPath = path.join(UPLOAD_DIR, base);
  try {
    const file = await readFile(fullPath);
    const ext = path.extname(base).toLowerCase();
    const contentType = MIME_BY_EXT[ext] ?? "application/octet-stream";
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

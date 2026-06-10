"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { getStorageProvider } from "@/lib/providers/storage";

export async function uploadMapImage(formData: FormData) {
  await requireAdmin();
  const eventId = String(formData.get("eventId"));
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return;

  const buffer = Buffer.from(await file.arrayBuffer());
  const saved = await getStorageProvider().save({
    buffer,
    filename: file.name,
    mimeType: file.type || "image/png",
  });

  await prisma.event.update({
    where: { id: eventId },
    data: { mapImageUrl: saved.url },
  });
  revalidatePath("/admin/mapa");
  revalidatePath("/mapa");
}

// Remove a imagem personalizada e volta ao mapa vetorial embutido.
export async function clearMapImage(formData: FormData) {
  await requireAdmin();
  const eventId = String(formData.get("eventId"));
  await prisma.event.update({
    where: { id: eventId },
    data: { mapImageUrl: null },
  });
  revalidatePath("/admin/mapa");
  revalidatePath("/mapa");
}

// Recebe um JSON { [standId]: {x,y,w,h} | null } e grava em cada stand.
export async function saveHotspots(formData: FormData) {
  await requireAdmin();
  const raw = String(formData.get("data") ?? "{}");
  let map: Record<string, { x: number; y: number; w: number; h: number } | null>;
  try {
    map = JSON.parse(raw);
  } catch {
    return;
  }

  await prisma.$transaction(
    Object.entries(map).map(([id, hs]) =>
      prisma.stand.update({
        where: { id },
        data: { hotspot: hs ? JSON.stringify(hs) : null },
      }),
    ),
  );
  revalidatePath("/admin/mapa");
  revalidatePath("/mapa");
}

export async function updateEventSvg(formData: FormData) {
  await requireAdmin();
  const eventId = String(formData.get("eventId"));
  const mapSvg = String(formData.get("mapSvg") ?? "");
  await prisma.event.update({ where: { id: eventId }, data: { mapSvg } });
  revalidatePath("/admin/mapa");
  revalidatePath("/mapa");
}

export async function updateStandShape(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const svgShapeId = String(formData.get("svgShapeId") ?? "").trim() || null;
  await prisma.stand.update({ where: { id }, data: { svgShapeId } });
  revalidatePath("/admin/mapa");
  revalidatePath("/mapa");
}

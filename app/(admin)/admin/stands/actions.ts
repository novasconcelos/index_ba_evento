"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { getActiveEventOrThrow } from "@/lib/event";
import { parseBRLToCents } from "@/lib/utils";

function readFields(formData: FormData) {
  return {
    code: String(formData.get("code") ?? "").trim(),
    segment: String(formData.get("segment") ?? "").trim() || null,
    sector: String(formData.get("sector") ?? "").trim() || null,
    sizeM2: formData.get("sizeM2")
      ? Number(formData.get("sizeM2"))
      : null,
    priceCents: parseBRLToCents(String(formData.get("price") ?? "0")),
    status: String(formData.get("status") ?? "AVAILABLE"),
    svgShapeId: String(formData.get("svgShapeId") ?? "").trim() || null,
    positionLabel: String(formData.get("positionLabel") ?? "").trim() || null,
  };
}

export async function createStand(formData: FormData) {
  await requireAdmin();
  const event = await getActiveEventOrThrow();
  const data = readFields(formData);
  await prisma.stand.create({ data: { ...data, eventId: event.id } });
  revalidatePath("/admin/stands");
  redirect("/admin/stands");
}

export async function updateStand(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const data = readFields(formData);
  await prisma.stand.update({ where: { id }, data });
  revalidatePath("/admin/stands");
  redirect("/admin/stands");
}

export async function deleteStand(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  await prisma.stand.delete({ where: { id } });
  revalidatePath("/admin/stands");
}

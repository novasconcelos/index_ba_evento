"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { getActiveEvent } from "@/lib/event";
import { parseBRLToCents } from "@/lib/utils";

export async function createGoal(formData: FormData) {
  await requireAdmin();
  const event = await getActiveEvent();
  const metric = String(formData.get("metric") ?? "REVENUE");
  const rawTarget = String(formData.get("target") ?? "0");
  const targetValue =
    metric === "REVENUE"
      ? parseBRLToCents(rawTarget)
      : Math.max(0, Math.round(Number(rawTarget) || 0));

  await prisma.goal.create({
    data: {
      eventId: event?.id ?? null,
      title: String(formData.get("title") ?? "Meta"),
      metric,
      targetValue,
    },
  });
  revalidatePath("/admin/metas");
  revalidatePath("/admin");
}

export async function deleteGoal(formData: FormData) {
  await requireAdmin();
  await prisma.goal.delete({ where: { id: String(formData.get("id")) } });
  revalidatePath("/admin/metas");
  revalidatePath("/admin");
}

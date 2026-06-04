"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

export async function markLeadContacted(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.lead.update({
    where: { id },
    data: { status: "CONTACTED" },
  });
  revalidatePath("/admin/leads");
}

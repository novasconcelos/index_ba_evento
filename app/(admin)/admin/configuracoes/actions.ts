"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { STAND_OPTION_KINDS, type StandOptionKind } from "@/lib/enums";

function isKind(v: string): v is StandOptionKind {
  return (STAND_OPTION_KINDS as string[]).includes(v);
}

export async function createStandOption(formData: FormData) {
  await requireAdmin();
  const kind = String(formData.get("kind") ?? "");
  const value = String(formData.get("value") ?? "").trim();
  if (!isKind(kind) || !value) return;

  // Evita duplicados (constraint @@unique([kind, value])).
  await prisma.standOption.upsert({
    where: { kind_value: { kind, value } },
    update: { active: true },
    create: { kind, value },
  });
  revalidatePath("/admin/configuracoes");
}

export async function deleteStandOption(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.standOption.delete({ where: { id } });
  revalidatePath("/admin/configuracoes");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { parseHotspot, serializeHotspot } from "@/lib/hotspot";
import {
  parseLayout,
  serializeLayout,
  computeActivationPlan,
  type LayoutMap,
} from "@/lib/map-version";

// Cria um rascunho a partir do layout VIVO atual (snapshot de Stand.hotspot).
export async function createDraftVersion(formData: FormData) {
  await requireAdmin();
  const eventId = String(formData.get("eventId"));
  const label =
    String(formData.get("label") ?? "").trim() ||
    `Versão de ${new Date().toLocaleDateString("pt-BR")}`;

  const stands = await prisma.stand.findMany({
    where: { eventId },
    select: { code: true, hotspot: true },
  });
  const layout: LayoutMap = {};
  for (const s of stands) layout[s.code] = parseHotspot(s.hotspot);

  const version = await prisma.mapVersion.create({
    data: { eventId, label, layout: serializeLayout(layout) },
  });
  revalidatePath("/admin/mapa");
  redirect(`/admin/mapa/versoes/${version.id}`);
}

// Salva o layout do rascunho. Recebe { [standId]: {x,y,w,h} | null } do editor
// e converte para codes antes de gravar (a chave do layout é o code).
export async function saveDraftLayout(formData: FormData) {
  await requireAdmin();
  const versionId = String(formData.get("versionId"));
  const raw = String(formData.get("data") ?? "{}");
  let byId: Record<string, { x: number; y: number; w: number; h: number } | null>;
  try {
    byId = JSON.parse(raw);
  } catch {
    return;
  }

  const version = await prisma.mapVersion.findUnique({ where: { id: versionId } });
  if (!version || version.status !== "DRAFT") return;

  const stands = await prisma.stand.findMany({
    where: { eventId: version.eventId, id: { in: Object.keys(byId) } },
    select: { id: true, code: true },
  });
  const codeById = new Map(stands.map((s) => [s.id, s.code]));

  const layout = parseLayout(version.layout);
  for (const [id, hs] of Object.entries(byId)) {
    const code = codeById.get(id);
    if (code) layout[code] = hs;
  }

  await prisma.mapVersion.update({
    where: { id: versionId },
    data: { layout: serializeLayout(layout) },
  });
  revalidatePath(`/admin/mapa/versoes/${versionId}`);
}

// Ativa um rascunho: aplica o layout SOMENTE nos stands AVAILABLE (status
// relidos dentro da transação — mesmo padrão anti-corrida do checkout),
// arquiva a versão ACTIVE anterior e grava o relatório de ativação.
export async function activateVersion(formData: FormData) {
  await requireAdmin();
  const versionId = String(formData.get("versionId"));

  await prisma.$transaction(async (tx) => {
    const version = await tx.mapVersion.findUniqueOrThrow({
      where: { id: versionId },
    });
    if (version.status !== "DRAFT") throw new Error("Versão não é um rascunho.");

    const stands = await tx.stand.findMany({
      where: { eventId: version.eventId },
      select: { id: true, code: true, status: true, hotspot: true },
    });
    const layout = parseLayout(version.layout);
    const plan = computeActivationPlan(stands, layout);
    const standByCode = new Map(stands.map((s) => [s.code, s]));

    // Snapshot do que estava valendo ANTES (para histórico da 1ª ativação).
    const liveSnapshot: LayoutMap = {};
    for (const s of stands) liveSnapshot[s.code] = parseHotspot(s.hotspot);

    // Aplica o layout só nos aplicáveis.
    for (const code of plan.applied) {
      const stand = standByCode.get(code)!;
      const hs = layout[code];
      await tx.stand.update({
        where: { id: stand.id },
        data: { hotspot: hs ? serializeHotspot(hs) : null },
      });
    }

    // Arquiva a ACTIVE anterior; se não houver, preserva o estado anterior
    // como uma versão arquivada automática.
    const now = new Date();
    const previous = await tx.mapVersion.findFirst({
      where: { eventId: version.eventId, status: "ACTIVE" },
    });
    if (previous) {
      await tx.mapVersion.update({
        where: { id: previous.id },
        data: { status: "ARCHIVED", archivedAt: now },
      });
    } else {
      await tx.mapVersion.create({
        data: {
          eventId: version.eventId,
          label: "Estado anterior (automático)",
          status: "ARCHIVED",
          layout: serializeLayout(liveSnapshot),
          archivedAt: now,
        },
      });
    }

    // Layout efetivo: protegidos mantêm a posição viva (não a do rascunho).
    const effective: LayoutMap = { ...layout };
    for (const { code } of plan.skipped) effective[code] = liveSnapshot[code] ?? null;
    for (const code of plan.missing) delete effective[code];

    await tx.mapVersion.update({
      where: { id: versionId },
      data: {
        status: "ACTIVE",
        activatedAt: now,
        layout: serializeLayout(effective),
        activationReport: JSON.stringify(plan),
      },
    });
  });

  revalidatePath("/admin/mapa");
  revalidatePath("/mapa");
  revalidatePath("/mapa2");
  revalidatePath(`/admin/mapa/versoes/${versionId}`);
}

// Cria um novo rascunho a partir de uma versão arquivada (restauração).
export async function restoreVersion(formData: FormData) {
  await requireAdmin();
  const versionId = String(formData.get("versionId"));
  const source = await prisma.mapVersion.findUnique({ where: { id: versionId } });
  if (!source || source.status !== "ARCHIVED") return;

  const draft = await prisma.mapVersion.create({
    data: {
      eventId: source.eventId,
      label: `Restaurada de "${source.label}"`,
      layout: source.layout,
    },
  });
  revalidatePath("/admin/mapa");
  redirect(`/admin/mapa/versoes/${draft.id}`);
}

export async function deleteDraftVersion(formData: FormData) {
  await requireAdmin();
  const versionId = String(formData.get("versionId"));
  const version = await prisma.mapVersion.findUnique({ where: { id: versionId } });
  if (!version || version.status !== "DRAFT") return;

  await prisma.mapVersion.delete({ where: { id: versionId } });
  revalidatePath("/admin/mapa");
  redirect("/admin/mapa");
}

"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActiveEventOrThrow } from "@/lib/event";
import { isValidCNPJ } from "@/lib/utils";
import { buildContractHtml } from "@/lib/contract";
import { getStorageProvider } from "@/lib/providers/storage";
import { getSignatureProvider } from "@/lib/providers/signature";
import { getEmailProvider } from "@/lib/providers/email";

const HOLD_MINUTES = 60;

const schema = z.object({
  nomeFantasia: z.string().min(2, "Informe o nome fantasia"),
  razaoSocial: z.string().optional(),
  cnpj: z
    .string()
    .optional()
    .refine((v) => !v || isValidCNPJ(v), "CNPJ inválido"),
  contato: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email("E-mail inválido"),
  segment: z.string().optional(),
  captador: z.enum(["FIEB", "SEBRAE", "BAHIA_EVENTOS", "OUTRO"]).optional(),
  indicacao: z.string().optional(),
  rtName: z.string().min(2, "Informe o responsável técnico"),
  rtDocument: z.string().optional(),
  rtEmail: z.string().email().optional().or(z.literal("")),
  rtPhone: z.string().optional(),
  standIds: z.array(z.string()).min(1, "Selecione ao menos um stand"),
});

export type CreateOrderResult =
  | { ok: true; token: string }
  | { ok: false; error: string };

/**
 * Recebe uma lista de IDs do carrinho (localStorage) e devolve apenas os que
 * ainda existem no banco E estão disponíveis. Usado para limpar itens obsoletos
 * antes de exibir o formulário de checkout (ex.: após re-seed).
 */
export async function validateStandIds(ids: string[]): Promise<string[]> {
  if (!ids.length) return [];
  const event = await getActiveEventOrThrow();
  const rows = await prisma.stand.findMany({
    where: { id: { in: ids }, eventId: event.id, status: "AVAILABLE" },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

export async function createOrder(
  formData: FormData,
): Promise<CreateOrderResult> {
  const event = await getActiveEventOrThrow();

  const parsed = schema.safeParse({
    nomeFantasia: formData.get("nomeFantasia"),
    razaoSocial: formData.get("razaoSocial") || undefined,
    cnpj: formData.get("cnpj") || undefined,
    contato: formData.get("contato") || undefined,
    telefone: formData.get("telefone") || undefined,
    email: formData.get("email"),
    segment: formData.get("segment") || undefined,
    captador: formData.get("captador") || undefined,
    indicacao: formData.get("indicacao") || undefined,
    rtName: formData.get("rtName"),
    rtDocument: formData.get("rtDocument") || undefined,
    rtEmail: formData.get("rtEmail") || undefined,
    rtPhone: formData.get("rtPhone") || undefined,
    standIds: formData.getAll("standIds").map(String),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  // Disponibilidade dos stands
  const stands = await prisma.stand.findMany({
    where: { id: { in: data.standIds }, eventId: event.id },
  });
  if (stands.length !== data.standIds.length) {
    return {
      ok: false,
      error:
        "Algum stand selecionado não foi encontrado. O mapa pode ter sido atualizado — por favor, volte ao mapa e selecione os stands novamente.",
    };
  }
  const indisponiveis = stands.filter((s) => s.status !== "AVAILABLE");
  if (indisponiveis.length > 0) {
    return {
      ok: false,
      error: `Stands indisponíveis: ${indisponiveis
        .map((s) => s.code)
        .join(", ")}. Atualize o mapa e tente novamente.`,
    };
  }

  // Upload da marca (opcional)
  const brand = formData.get("brand");
  let savedBrand: { path: string; mimeType: string; sizeBytes: number; filename: string } | null =
    null;
  if (brand instanceof File && brand.size > 0) {
    const buffer = Buffer.from(await brand.arrayBuffer());
    const saved = await getStorageProvider().save({
      buffer,
      filename: brand.name,
      mimeType: brand.type || "application/octet-stream",
    });
    savedBrand = {
      path: saved.path,
      mimeType: brand.type || "application/octet-stream",
      sizeBytes: saved.sizeBytes,
      filename: brand.name,
    };
  }

  const totalCents = stands.reduce((acc, s) => acc + s.priceCents, 0);
  const holdExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60_000);

  // Cria expositor + pedido + itens + RT + reserva os stands em transação.
  const order = await prisma.$transaction(async (tx) => {
    // Revalida disponibilidade dentro da transação (evita corrida)
    const fresh = await tx.stand.findMany({
      where: { id: { in: data.standIds }, status: "AVAILABLE" },
      select: { id: true },
    });
    if (fresh.length !== data.standIds.length) {
      throw new Error("CONFLICT");
    }

    const exhibitor = await tx.exhibitor.create({
      data: {
        nomeFantasia: data.nomeFantasia,
        razaoSocial: data.razaoSocial,
        cnpj: data.cnpj,
        contato: data.contato,
        telefone: data.telefone,
        email: data.email,
        segment: data.segment,
        captador: data.captador,
        indicacao: data.indicacao,
      },
    });

    const created = await tx.order.create({
      data: {
        eventId: event.id,
        exhibitorId: exhibitor.id,
        status: "RESERVED",
        totalCents,
        holdExpiresAt,
        items: {
          create: stands.map((s) => ({
            standId: s.id,
            code: s.code,
            priceCents: s.priceCents,
          })),
        },
        techResponsible: {
          create: {
            name: data.rtName,
            document: data.rtDocument,
            email: data.rtEmail || null,
            phone: data.rtPhone,
          },
        },
        ...(savedBrand
          ? {
              brandAsset: {
                create: {
                  filename: savedBrand.filename,
                  path: savedBrand.path,
                  mimeType: savedBrand.mimeType,
                  sizeBytes: savedBrand.sizeBytes,
                },
              },
            }
          : {}),
      },
    });

    await tx.stand.updateMany({
      where: { id: { in: data.standIds } },
      data: { status: "RESERVED" },
    });

    return created;
  }).catch((err: unknown) => {
    if (err instanceof Error && err.message === "CONFLICT") return null;
    throw err;
  });

  if (!order) {
    return {
      ok: false,
      error: "Um dos stands acabou de ser reservado. Revise sua seleção.",
    };
  }

  // Gera contrato + solicitação de assinatura
  const html = buildContractHtml({
    eventName: event.name,
    exhibitor: {
      nomeFantasia: data.nomeFantasia,
      razaoSocial: data.razaoSocial,
      cnpj: data.cnpj,
      contato: data.contato,
      email: data.email,
      telefone: data.telefone,
    },
    techResponsible: { name: data.rtName, document: data.rtDocument },
    items: stands.map((s) => ({
      code: s.code,
      sizeM2: s.sizeM2,
      priceCents: s.priceCents,
    })),
    totalCents,
    createdAt: new Date(),
    orderId: order.id,
  });

  const signature = await getSignatureProvider().createSignatureRequest({
    orderId: order.id,
    trackingToken: order.trackingToken,
    contractHtml: html,
    signer: { name: data.contato || data.nomeFantasia, email: data.email },
  });

  await prisma.contract.create({
    data: {
      orderId: order.id,
      html,
      status: "SENT",
      provider: signature.provider,
      providerRef: signature.externalId,
      signUrl: signature.signUrl,
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "CONTRACT_PENDING" },
  });

  // E-mail com link de acompanhamento (link mágico)
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const trackUrl = `${appUrl}/acompanhar/${order.trackingToken}`;
  await getEmailProvider().send({
    to: data.email,
    subject: `Reserva de stands — ${event.name}`,
    html: `<p>Olá, ${data.nomeFantasia}!</p>
      <p>Recebemos sua reserva. Acompanhe, assine o contrato e realize o pagamento pelo link:</p>
      <p><a href="${trackUrl}">${trackUrl}</a></p>`,
    text: `Acompanhe sua reserva: ${trackUrl}`,
  });

  return { ok: true, token: order.trackingToken };
}

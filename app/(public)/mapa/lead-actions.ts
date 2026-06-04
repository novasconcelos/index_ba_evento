"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { getActiveEvent } from "@/lib/event";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  whatsapp: z.string().min(8, "Informe um WhatsApp válido"),
  standId: z.string().optional(),
  standCode: z.string().optional(),
});

export type RecordLeadResult = { ok: true } | { ok: false; error: string };

/**
 * Registra um lead (interesse) capturado no mapa. Chamado pelo modal exibido na
 * primeira seleção de stand. Sem autenticação — é um visitante público.
 */
export async function recordLead(formData: FormData): Promise<RecordLeadResult> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    whatsapp: formData.get("whatsapp"),
    standId: formData.get("standId") || undefined,
    standCode: formData.get("standCode") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const event = await getActiveEvent();

  try {
    await prisma.lead.create({
      data: {
        eventId: event?.id ?? null,
        email: parsed.data.email.trim().toLowerCase(),
        whatsapp: parsed.data.whatsapp.trim(),
        standId: parsed.data.standId ?? null,
        standCode: parsed.data.standCode ?? null,
      },
    });
    return { ok: true };
  } catch {
    return { ok: false, error: "Não foi possível registrar. Tente novamente." };
  }
}

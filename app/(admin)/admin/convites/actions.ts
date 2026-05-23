"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { getActiveEvent } from "@/lib/event";
import { getEmailProvider } from "@/lib/providers/email";

const EMAIL_RE = /[^\s,;]+@[^\s,;]+\.[^\s,;]+/g;

export async function sendInvites(formData: FormData) {
  await requireAdmin();
  const raw = String(formData.get("emails") ?? "");
  const emails = Array.from(
    new Set((raw.match(EMAIL_RE) ?? []).map((e) => e.toLowerCase())),
  );
  if (emails.length === 0) return;

  const event = await getActiveEvent();
  const appUrl = process.env.APP_URL ?? "http://localhost:3100";
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60_000);
  const email = getEmailProvider();

  for (const to of emails) {
    const token = await prisma.magicLinkToken.create({
      data: { email: to, purpose: "invite", expiresAt },
    });
    const link = `${appUrl}/convite/${token.token}`;
    await email.send({
      to,
      subject: `Convite para reservar seu stand — ${event?.name ?? "Feira FIEB"}`,
      html: `<p>Olá!</p>
        <p>Você foi convidado(a) para reservar seu stand na ${
          event?.name ?? "Feira FIEB"
        }. Acesse o link abaixo para escolher seu stand no mapa e concluir o cadastro:</p>
        <p><a href="${link}">${link}</a></p>`,
      text: `Reserve seu stand: ${link}`,
    });
  }

  revalidatePath("/admin/convites");
}

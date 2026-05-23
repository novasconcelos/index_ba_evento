"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getPaymentProvider } from "@/lib/providers/payment";
import { getEmailProvider } from "@/lib/providers/email";

// Assinatura do contrato (no adaptador manual, acionada pelo próprio expositor;
// em produção, viria do webhook do provedor de assinatura).
export async function signContract(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const order = await prisma.order.findUnique({
    where: { trackingToken: token },
    include: { contract: true, exhibitor: true },
  });
  if (!order || order.status !== "CONTRACT_PENDING") return;

  await prisma.contract.update({
    where: { orderId: order.id },
    data: { status: "SIGNED", signedAt: new Date() },
  });

  // Gera a cobrança após a assinatura.
  const charge = await getPaymentProvider().createCharge({
    orderId: order.id,
    trackingToken: order.trackingToken,
    amountCents: order.totalCents,
    description: `Reserva de stands — pedido ${order.id}`,
    customer: {
      name: order.exhibitor?.nomeFantasia ?? "Expositor",
      email: order.exhibitor?.email ?? "",
      cnpj: order.exhibitor?.cnpj,
    },
  });

  await prisma.payment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      amountCents: order.totalCents,
      provider: charge.provider,
      providerRef: charge.externalId,
      paymentUrl: charge.paymentUrl,
      status: "PENDING",
    },
    update: {
      provider: charge.provider,
      providerRef: charge.externalId,
      paymentUrl: charge.paymentUrl,
      status: "PENDING",
    },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "PAYMENT_PENDING" },
  });

  revalidatePath(`/acompanhar/${token}`);
}

// Confirmação de pagamento (no adaptador manual; em produção, via webhook).
export async function confirmPayment(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const order = await prisma.order.findUnique({
    where: { trackingToken: token },
    include: { items: true, exhibitor: true, event: true },
  });
  if (!order) return;
  if (order.status !== "PAYMENT_PENDING" && order.status !== "SIGNED") return;

  await prisma.$transaction([
    prisma.payment.update({
      where: { orderId: order.id },
      data: { status: "PAID", paidAt: new Date() },
    }),
    prisma.order.update({
      where: { id: order.id },
      data: { status: "PAID", holdExpiresAt: null },
    }),
    prisma.stand.updateMany({
      where: { id: { in: order.items.map((i) => i.standId) } },
      data: { status: "SOLD" },
    }),
  ]);

  if (order.exhibitor?.email) {
    await getEmailProvider().send({
      to: order.exhibitor.email,
      subject: `Pagamento confirmado — ${order.event.name}`,
      html: `<p>Pagamento confirmado! Sua reserva de stands está garantida.</p>`,
      text: "Pagamento confirmado! Sua reserva de stands está garantida.",
    });
  }

  revalidatePath(`/acompanhar/${token}`);
}

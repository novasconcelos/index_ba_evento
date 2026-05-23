"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { getPaymentProvider } from "@/lib/providers/payment";

export async function adminMarkSigned(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const order = await prisma.order.findUnique({
    where: { id },
    include: { exhibitor: true },
  });
  if (!order || order.status !== "CONTRACT_PENDING") return;

  await prisma.contract.update({
    where: { orderId: id },
    data: { status: "SIGNED", signedAt: new Date() },
  });

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
    where: { orderId: id },
    create: {
      orderId: id,
      amountCents: order.totalCents,
      provider: charge.provider,
      providerRef: charge.externalId,
      paymentUrl: charge.paymentUrl,
      status: "PENDING",
    },
    update: { paymentUrl: charge.paymentUrl, status: "PENDING" },
  });

  await prisma.order.update({
    where: { id },
    data: { status: "PAYMENT_PENDING" },
  });
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin/pedidos");
}

export async function adminConfirmPayment(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return;

  await prisma.$transaction([
    prisma.payment.upsert({
      where: { orderId: id },
      create: {
        orderId: id,
        amountCents: order.totalCents,
        status: "PAID",
        paidAt: new Date(),
      },
      update: { status: "PAID", paidAt: new Date() },
    }),
    prisma.order.update({
      where: { id },
      data: { status: "PAID", holdExpiresAt: null },
    }),
    prisma.stand.updateMany({
      where: { id: { in: order.items.map((i) => i.standId) } },
      data: { status: "SOLD" },
    }),
  ]);
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin/pedidos");
}

export async function adminCancelOrder(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id"));
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return;

  await prisma.$transaction([
    prisma.order.update({ where: { id }, data: { status: "CANCELLED" } }),
    // Libera os stands que não foram efetivamente vendidos.
    prisma.stand.updateMany({
      where: {
        id: { in: order.items.map((i) => i.standId) },
        status: { in: ["RESERVED"] },
      },
      data: { status: "AVAILABLE" },
    }),
  ]);
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin/pedidos");
}

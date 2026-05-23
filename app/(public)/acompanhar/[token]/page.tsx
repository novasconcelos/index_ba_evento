import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, FileText } from "lucide-react";
import { prisma } from "@/lib/db";
import { formatBRL, cn } from "@/lib/utils";
import { orderStatusLabel } from "@/lib/labels";
import type { OrderStatus } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signContract, confirmPayment } from "./actions";

export const dynamic = "force-dynamic";

const RANK: Record<string, number> = {
  CART: 0,
  RESERVED: 1,
  CONTRACT_PENDING: 2,
  SIGNED: 3,
  PAYMENT_PENDING: 4,
  PAID: 5,
};

export default async function TrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const order = await prisma.order.findUnique({
    where: { trackingToken: token },
    include: {
      items: true,
      exhibitor: true,
      event: true,
      contract: true,
      payment: true,
    },
  });

  if (!order) notFound();

  const rank = RANK[order.status] ?? 0;
  const steps = [
    { label: "Reserva criada", done: rank >= 1 },
    { label: "Contrato gerado", done: rank >= 2 },
    { label: "Contrato assinado", done: rank >= 3 },
    { label: "Pagamento concluído", done: rank >= 5 },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">
          Acompanhamento da reserva
        </h1>
        <p className="text-sm text-gray-600">
          {order.event.name} • {order.exhibitor?.nomeFantasia} • Pedido{" "}
          <span className="font-mono">{order.id.slice(-8)}</span>
        </p>
      </div>

      <Card>
        <CardContent>
          <ol className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {steps.map((step, i) => (
              <li key={i} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    step.done
                      ? "bg-brand-teal text-white"
                      : "bg-gray-200 text-gray-500",
                  )}
                >
                  {step.done ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-sm",
                    step.done ? "font-medium text-gray-900" : "text-gray-500",
                  )}
                >
                  {step.label}
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Stands reservados</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-gray-100">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between py-2 text-sm">
                <span>Stand {item.code}</span>
                <span className="font-medium">{formatBRL(item.priceCents)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-gray-100 pt-3">
            <span className="font-medium">Total</span>
            <span className="text-lg font-bold text-brand-navy">
              {formatBRL(order.totalCents)}
            </span>
          </div>
        </CardContent>
      </Card>

      {order.contract && (
        <Card>
          <CardHeader>
            <CardTitle>Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href={`/contrato/${token}`}
              target="_blank"
              className="inline-flex items-center gap-2 text-brand-navy underline"
            >
              <FileText className="h-4 w-4" /> Ver / imprimir contrato (PDF)
            </Link>

            {order.status === "CONTRACT_PENDING" && (
              <form action={signContract}>
                <input type="hidden" name="token" value={token} />
                <Button type="submit" size="lg">
                  Assinar contrato eletronicamente
                </Button>
                <p className="mt-2 text-xs text-gray-500">
                  Na integração com o provedor de assinatura (ZapSign/Clicksign),
                  este botão abrirá o fluxo de assinatura. No modo atual, a
                  assinatura é registrada diretamente.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {(order.status === "PAYMENT_PENDING" || order.status === "PAID") &&
        order.payment && (
          <Card>
            <CardHeader>
              <CardTitle>Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.status === "PAID" ? (
                <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-green-800">
                  Pagamento confirmado! Sua reserva está garantida.
                </p>
              ) : (
                <>
                  <p className="text-sm text-gray-600">
                    Valor a pagar:{" "}
                    <span className="font-semibold text-brand-navy">
                      {formatBRL(order.payment.amountCents)}
                    </span>
                  </p>
                  <form action={confirmPayment}>
                    <input type="hidden" name="token" value={token} />
                    <Button type="submit" size="lg" variant="secondary">
                      Confirmar pagamento (simular)
                    </Button>
                    <p className="mt-2 text-xs text-gray-500">
                      Na integração com o provedor de pagamento (Asaas/Mercado
                      Pago), aqui ficaria o checkout/PIX/boleto e a confirmação
                      viria por webhook.
                    </p>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        )}

      <p className="text-center text-sm text-gray-500">
        Etapa atual:{" "}
        <span className="font-medium text-gray-800">
          {orderStatusLabel[order.status as OrderStatus]}
        </span>
      </p>
    </div>
  );
}

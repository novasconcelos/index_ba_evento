import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";
import {
  orderStatusLabel,
  orderStatusColor,
  paymentStatusLabel,
  contractStatusLabel,
} from "@/lib/labels";
import type {
  OrderStatus,
  PaymentStatus,
  ContractStatus,
} from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  adminMarkSigned,
  adminConfirmPayment,
  adminCancelOrder,
} from "../actions";

export const dynamic = "force-dynamic";

export default async function PedidoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      exhibitor: true,
      items: true,
      techResponsible: true,
      brandAsset: true,
      contract: true,
      payment: true,
      event: true,
    },
  });
  if (!order) notFound();

  const e = order.exhibitor;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">
            {e?.nomeFantasia ?? "Pedido"}
          </h1>
          <p className="text-sm text-gray-500">
            Pedido <span className="font-mono">{order.id.slice(-8)}</span> •{" "}
            {order.createdAt.toLocaleString("pt-BR")}
          </p>
        </div>
        <Badge color={orderStatusColor[order.status as OrderStatus]}>
          {orderStatusLabel[order.status as OrderStatus] ?? order.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Stands</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-gray-100">
              {order.items.map((i) => (
                <li key={i.id} className="flex justify-between py-2 text-sm">
                  <span>Stand {i.code}</span>
                  <span className="font-medium">{formatBRL(i.priceCents)}</span>
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

        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.status === "CONTRACT_PENDING" && (
              <form action={adminMarkSigned}>
                <input type="hidden" name="id" value={order.id} />
                <Button className="w-full">Marcar contrato assinado</Button>
              </form>
            )}
            {(order.status === "PAYMENT_PENDING" ||
              order.status === "SIGNED") && (
              <form action={adminConfirmPayment}>
                <input type="hidden" name="id" value={order.id} />
                <Button className="w-full" variant="secondary">
                  Confirmar pagamento
                </Button>
              </form>
            )}
            {order.status !== "PAID" && order.status !== "CANCELLED" && (
              <form action={adminCancelOrder}>
                <input type="hidden" name="id" value={order.id} />
                <Button className="w-full" variant="danger">
                  Cancelar pedido
                </Button>
              </form>
            )}
            <Link
              href={`/acompanhar/${order.trackingToken}`}
              target="_blank"
              className="flex items-center gap-1 text-sm text-brand-navy hover:underline"
            >
              <ExternalLink className="h-4 w-4" /> Página de acompanhamento
            </Link>
            {order.contract && (
              <Link
                href={`/contrato/${order.trackingToken}`}
                target="_blank"
                className="flex items-center gap-1 text-sm text-brand-navy hover:underline"
              >
                <FileText className="h-4 w-4" /> Contrato (PDF)
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expositor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{e?.nomeFantasia}</p>
            {e?.razaoSocial && <p className="text-gray-600">{e.razaoSocial}</p>}
            {e?.cnpj && <p className="text-gray-600">CNPJ: {e.cnpj}</p>}
            {e?.contato && <p className="text-gray-600">Contato: {e.contato}</p>}
            <p className="text-gray-600">{e?.email}</p>
            {e?.telefone && <p className="text-gray-600">{e.telefone}</p>}
            {e?.segment && <p className="text-gray-600">Segmento: {e.segment}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Responsável técnico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {order.techResponsible ? (
              <>
                <p className="font-medium">{order.techResponsible.name}</p>
                {order.techResponsible.document && (
                  <p className="text-gray-600">
                    Doc: {order.techResponsible.document}
                  </p>
                )}
                {order.techResponsible.email && (
                  <p className="text-gray-600">{order.techResponsible.email}</p>
                )}
                {order.techResponsible.phone && (
                  <p className="text-gray-600">{order.techResponsible.phone}</p>
                )}
              </>
            ) : (
              <p className="text-gray-500">Não informado</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marca / contrato / pagamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {order.brandAsset ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/files/${order.brandAsset.path}`}
                alt="Marca"
                className="h-16 w-auto rounded border border-gray-200 bg-white object-contain p-1"
              />
            ) : (
              <p className="text-gray-500">Sem marca enviada</p>
            )}
            {order.contract && (
              <p className="text-gray-600">
                Contrato:{" "}
                {contractStatusLabel[order.contract.status as ContractStatus] ??
                  order.contract.status}
              </p>
            )}
            {order.payment && (
              <p className="text-gray-600">
                Pagamento:{" "}
                {paymentStatusLabel[order.payment.status as PaymentStatus] ??
                  order.payment.status}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

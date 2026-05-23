import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";
import { orderStatusLabel, orderStatusColor } from "@/lib/labels";
import type { OrderStatus } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  await requireAdmin();
  const orders = await prisma.order.findMany({
    where: { status: { not: "CART" } },
    orderBy: { createdAt: "desc" },
    include: { exhibitor: true, items: true },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-brand-navy">Pedidos</h1>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="p-3">Expositor</th>
              <th className="p-3">Stands</th>
              <th className="p-3">Total</th>
              <th className="p-3">Etapa</th>
              <th className="p-3">Data</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-gray-500">
                  Nenhum pedido ainda.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="p-3">
                  <Link
                    href={`/admin/pedidos/${o.id}`}
                    className="font-medium text-brand-navy hover:underline"
                  >
                    {o.exhibitor?.nomeFantasia ?? "—"}
                  </Link>
                </td>
                <td className="p-3 text-gray-600">
                  {o.items.map((i) => i.code).join(", ")}
                </td>
                <td className="p-3">{formatBRL(o.totalCents)}</td>
                <td className="p-3">
                  <Badge color={orderStatusColor[o.status as OrderStatus]}>
                    {orderStatusLabel[o.status as OrderStatus] ?? o.status}
                  </Badge>
                </td>
                <td className="p-3 text-gray-500">
                  {o.createdAt.toLocaleDateString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

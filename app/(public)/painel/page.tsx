import Link from "next/link";
import { prisma } from "@/lib/db";
import { signOut } from "@/auth";
import { requireExhibitor } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";
import {
  orderStatusLabel,
  orderStatusColor,
  contractStatusLabel,
} from "@/lib/labels";
import type { OrderStatus, ContractStatus } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function PainelPage() {
  const session = await requireExhibitor();
  const exhibitorId = session.user.exhibitorId;

  const orders = exhibitorId
    ? await prisma.order.findMany({
        where: { exhibitorId, status: { not: "CART" } },
        orderBy: { createdAt: "desc" },
        include: { items: true, contract: true, payment: true },
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Minhas solicitações</h1>
          <p className="text-sm text-gray-600">
            Olá, {session.user.name}. Acompanhe o andamento e veja o contrato.
          </p>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button type="submit" variant="outline" size="sm">
            Sair
          </Button>
        </form>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-600">Você ainda não tem solicitações.</p>
          <Link href="/mapa" className="mt-4 inline-block">
            <Button>Escolher stands no mapa</Button>
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => (
            <li
              key={o.id}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-brand-navy">
                    Stands: {o.items.map((i) => i.code).join(", ") || "—"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {o.createdAt.toLocaleDateString("pt-BR")} ·{" "}
                    {formatBRL(o.totalCents)}
                  </p>
                </div>
                <Badge color={orderStatusColor[o.status as OrderStatus]}>
                  {orderStatusLabel[o.status as OrderStatus] ?? o.status}
                </Badge>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-3 text-sm">
                {o.contract && (
                  <span className="text-gray-600">
                    Contrato:{" "}
                    <strong>
                      {contractStatusLabel[o.contract.status as ContractStatus] ??
                        o.contract.status}
                    </strong>
                  </span>
                )}
                <Link
                  href={`/acompanhar/${o.trackingToken}`}
                  className="ml-auto font-semibold text-brand-navy underline"
                >
                  Acompanhar / ver contrato →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

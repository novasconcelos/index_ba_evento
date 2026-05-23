import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { captadorLabel } from "@/lib/labels";
import type { Captador } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function ExpositoresPage() {
  await requireAdmin();
  const exhibitors = await prisma.exhibitor.findMany({
    orderBy: { nomeFantasia: "asc" },
    include: { _count: { select: { orders: true } } },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-brand-navy">Expositores</h1>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="p-3">Nome fantasia</th>
              <th className="p-3">CNPJ</th>
              <th className="p-3">Contato</th>
              <th className="p-3">E-mail</th>
              <th className="p-3">Segmento</th>
              <th className="p-3">Captação</th>
              <th className="p-3">Pedidos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {exhibitors.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  Nenhum expositor cadastrado.
                </td>
              </tr>
            )}
            {exhibitors.map((e) => (
              <tr key={e.id}>
                <td className="p-3 font-medium">{e.nomeFantasia}</td>
                <td className="p-3 text-gray-600">{e.cnpj ?? "-"}</td>
                <td className="p-3 text-gray-600">{e.contato ?? "-"}</td>
                <td className="p-3 text-gray-600">{e.email}</td>
                <td className="p-3 text-gray-600">{e.segment ?? "-"}</td>
                <td className="p-3 text-gray-600">
                  {e.captador
                    ? captadorLabel[e.captador as Captador] ?? e.captador
                    : "-"}
                </td>
                <td className="p-3 text-gray-600">{e._count.orders}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

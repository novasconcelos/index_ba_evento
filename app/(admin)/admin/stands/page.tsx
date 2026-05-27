import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { getActiveEvent } from "@/lib/event";
import { formatBRL } from "@/lib/utils";
import { standStatusLabel, standStatusColor } from "@/lib/labels";
import type { StandStatus } from "@/lib/enums";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteStand } from "./actions";

export const dynamic = "force-dynamic";

export default async function StandsPage() {
  await requireAdmin();
  const event = await getActiveEvent();
  const stands = event
    ? await prisma.stand.findMany({
        where: { eventId: event.id },
        orderBy: { code: "asc" },
      })
    : [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">Stands</h1>
          <p className="text-sm text-gray-600">{stands.length} stands</p>
        </div>
        <Link href="/admin/stands/novo">
          <Button>
            <Plus className="h-4 w-4" /> Novo stand
          </Button>
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="p-3">Código</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">ASA</th>
              <th className="p-3">Localização</th>
              <th className="p-3">m²</th>
              <th className="p-3">Valor</th>
              <th className="p-3">Status</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stands.map((s) => (
              <tr key={s.id}>
                <td className="p-3 font-medium">{s.code}</td>
                <td className="p-3 text-gray-600">{s.tipo ?? "-"}</td>
                <td className="p-3 text-gray-600">{s.sector ?? "-"}</td>
                <td className="p-3 text-gray-600">{s.positionLabel ?? "-"}</td>
                <td className="p-3 text-gray-600">{s.sizeM2 ?? "-"}</td>
                <td className="p-3">{formatBRL(s.priceCents)}</td>
                <td className="p-3">
                  <Badge color={standStatusColor[s.status as StandStatus]}>
                    {standStatusLabel[s.status as StandStatus] ?? s.status}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/stands/${s.id}`}
                      className="text-gray-500 hover:text-brand-navy"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <form action={deleteStand}>
                      <input type="hidden" name="id" value={s.id} />
                      <button
                        className="text-gray-400 hover:text-red-600"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

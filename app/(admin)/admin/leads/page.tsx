import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { leadStatusLabel, leadStatusColor } from "@/lib/labels";
import type { LeadStatus } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { markLeadContacted } from "./actions";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  await requireAdmin();
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
  });

  const novos = leads.filter((l) => l.status === "NEW").length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Leads</h1>
        <p className="text-sm text-gray-600">
          {leads.length} interesse(s) capturado(s) no mapa · {novos} novo(s)
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="p-3">E-mail</th>
              <th className="p-3">WhatsApp</th>
              <th className="p-3">Stand de interesse</th>
              <th className="p-3">Status</th>
              <th className="p-3">Data</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {leads.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  Nenhum lead capturado ainda.
                </td>
              </tr>
            )}
            {leads.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="p-3 font-medium text-brand-navy">
                  <a href={`mailto:${l.email}`} className="hover:underline">
                    {l.email}
                  </a>
                </td>
                <td className="p-3 text-gray-600">{l.whatsapp}</td>
                <td className="p-3 text-gray-600">{l.standCode ?? "—"}</td>
                <td className="p-3">
                  <Badge color={leadStatusColor[l.status as LeadStatus]}>
                    {leadStatusLabel[l.status as LeadStatus] ?? l.status}
                  </Badge>
                </td>
                <td className="p-3 text-gray-500">
                  {l.createdAt.toLocaleDateString("pt-BR")}
                </td>
                <td className="p-3 text-right">
                  {l.status === "NEW" && (
                    <form action={markLeadContacted}>
                      <input type="hidden" name="id" value={l.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Marcar contatado
                      </Button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

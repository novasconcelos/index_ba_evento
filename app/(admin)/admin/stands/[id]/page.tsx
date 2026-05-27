import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { StandForm } from "@/components/admin/stand-form";
import { getAllStandOptions } from "@/lib/stand-options";
import { updateStand } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditStandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [stand, { tipos, asas, localizacoes }] = await Promise.all([
    prisma.stand.findUnique({ where: { id } }),
    getAllStandOptions(),
  ]);
  if (!stand) notFound();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-brand-navy">
        Editar stand {stand.code}
      </h1>
      <StandForm
        action={updateStand}
        stand={stand}
        tipos={tipos}
        asas={asas}
        localizacoes={localizacoes}
      />
    </div>
  );
}

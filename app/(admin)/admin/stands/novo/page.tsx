import { requireAdmin } from "@/lib/auth-helpers";
import { StandForm } from "@/components/admin/stand-form";
import { getAllStandOptions } from "@/lib/stand-options";
import { createStand } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovoStandPage() {
  await requireAdmin();
  const { tipos, asas, localizacoes } = await getAllStandOptions();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-brand-navy">Novo stand</h1>
      <StandForm
        action={createStand}
        tipos={tipos}
        asas={asas}
        localizacoes={localizacoes}
      />
    </div>
  );
}

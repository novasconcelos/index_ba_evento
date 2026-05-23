import { requireAdmin } from "@/lib/auth-helpers";
import { StandForm } from "@/components/admin/stand-form";
import { createStand } from "../actions";

export default async function NovoStandPage() {
  await requireAdmin();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-brand-navy">Novo stand</h1>
      <StandForm action={createStand} />
    </div>
  );
}

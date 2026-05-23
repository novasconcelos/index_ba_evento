import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { StandForm } from "@/components/admin/stand-form";
import { updateStand } from "../actions";

export default async function EditStandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const stand = await prisma.stand.findUnique({ where: { id } });
  if (!stand) notFound();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-brand-navy">
        Editar stand {stand.code}
      </h1>
      <StandForm action={updateStand} stand={stand} />
    </div>
  );
}

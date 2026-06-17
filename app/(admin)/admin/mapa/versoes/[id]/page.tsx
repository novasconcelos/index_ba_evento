import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { serializeHotspot } from "@/lib/hotspot";
import { parseLayout, computeActivationPlan } from "@/lib/map-version";
import type { StandStatus } from "@/lib/enums";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HotspotEditor } from "@/components/admin/hotspot-editor";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { StandBlock } from "@/components/map/stand-block";
import { PavilionScene, VIEW_W, VIEW_H, slopeFor } from "@/lib/venue/index-pavilion";
import {
  saveDraftLayout,
  activateVersion,
  restoreVersion,
  deleteDraftVersion,
} from "../../version-actions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativa",
  ARCHIVED: "Arquivada",
};
const STATUS_COLOR: Record<string, string> = {
  DRAFT: "#d97706",
  ACTIVE: "#16a34a",
  ARCHIVED: "#64748b",
};

export default async function MapVersionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const version = await prisma.mapVersion.findUnique({ where: { id } });
  if (!version) notFound();

  const event = await prisma.event.findUnique({ where: { id: version.eventId } });
  const stands = await prisma.stand.findMany({
    where: { eventId: version.eventId },
    orderBy: { code: "asc" },
  });

  const layout = parseLayout(version.layout);
  const plan = computeActivationPlan(stands, layout);
  const isDraft = version.status === "DRAFT";

  // Stands para o editor/preview: hotspot vem do LAYOUT DA VERSÃO (por code),
  // não do Stand.hotspot vivo.
  const editorStands = stands.map((s) => {
    const hs = layout[s.code];
    return {
      id: s.id,
      code: s.code,
      status: s.status,
      sector: s.sector,
      sizeM2: s.sizeM2 ?? 9,
      hotspot: hs ? serializeHotspot(hs) : null,
    };
  });
  const protectedIds = stands
    .filter((s) => plan.skipped.some((k) => k.code === s.code))
    .map((s) => s.id);

  const report = version.activationReport
    ? (JSON.parse(version.activationReport) as typeof plan)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-brand-navy">
          Versão do mapa — {version.label}
        </h1>
        <Badge color={STATUS_COLOR[version.status]}>
          {STATUS_LABEL[version.status] ?? version.status}
        </Badge>
        <Link href="/admin/mapa" className="text-sm text-brand-navy underline">
          ← Voltar ao editor do mapa
        </Link>
      </div>

      <p className="text-sm text-gray-500">
        Criada em {version.createdAt.toLocaleString("pt-BR")}
        {version.activatedAt &&
          ` · ativada em ${version.activatedAt.toLocaleString("pt-BR")}`}
        {version.archivedAt &&
          ` · arquivada em ${version.archivedAt.toLocaleString("pt-BR")}`}
      </p>

      {isDraft && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Editar rascunho</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-500">
                As alterações aqui <strong>não afetam o mapa publicado</strong> até a
                ativação. Stands com borda tracejada vermelha (🔒) estão vendidos,
                reservados, bloqueados ou cedidos — na ativação eles{" "}
                <strong>mantêm a posição atual do site</strong>, mesmo que você os mova
                no rascunho.
              </p>
              <HotspotEditor
                imageUrl={event?.mapImageUrl ?? null}
                stands={editorStands}
                saveAction={saveDraftLayout}
                hiddenFields={[{ name: "versionId", value: version.id }]}
                protectedIds={protectedIds}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ativar esta versão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-700">
                <strong>{plan.applied.length}</strong> stands disponíveis receberão a
                nova posição.{" "}
                {plan.skipped.length > 0 && (
                  <>
                    <strong>{plan.skipped.length}</strong> protegidos manterão a posição
                    atual:{" "}
                    <span className="text-gray-600">
                      {plan.skipped.map((s) => s.code).join(", ")}
                    </span>
                    .
                  </>
                )}
                {plan.missing.length > 0 && (
                  <>
                    {" "}
                    <span className="text-amber-600">
                      {plan.missing.length} código(s) do rascunho não existem mais e
                      serão ignorados: {plan.missing.join(", ")}.
                    </span>
                  </>
                )}
              </p>
              <p className="text-xs text-gray-500">
                Os status são reverificados no momento da ativação — se um stand for
                reservado entre agora e a confirmação, ele também será protegido.
              </p>
              <div className="flex flex-wrap gap-3">
                <form action={activateVersion}>
                  <input type="hidden" name="versionId" value={version.id} />
                  <ConfirmSubmit
                    message={`Ativar "${version.label}"? O mapa publicado será substituído (stands vendidos/reservados mantêm a posição).`}
                  >
                    Ativar e publicar
                  </ConfirmSubmit>
                </form>
                <form action={deleteDraftVersion}>
                  <input type="hidden" name="versionId" value={version.id} />
                  <ConfirmSubmit
                    message={`Excluir o rascunho "${version.label}"? Esta ação não pode ser desfeita.`}
                    variant="outline"
                  >
                    Excluir rascunho
                  </ConfirmSubmit>
                </form>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!isDraft && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Layout desta versão (somente leitura)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className="block w-full">
                  <PavilionScene />
                  {editorStands.map((s) => {
                    const hs = layout[s.code];
                    if (!hs) return null;
                    return (
                      <StandBlock
                        key={s.id}
                        code={s.code}
                        status={s.status as StandStatus}
                        x={hs.x * VIEW_W}
                        y={hs.y * VIEW_H}
                        w={hs.w * VIEW_W}
                        h={hs.h * VIEW_H}
                        slope={slopeFor(s.sector, hs.x + hs.w / 2)}
                      />
                    );
                  })}
                </svg>
              </div>
            </CardContent>
          </Card>

          {report && (
            <Card>
              <CardHeader>
                <CardTitle>Relatório da ativação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium text-green-700">
                    Aplicados ({report.applied.length}):
                  </span>{" "}
                  <span className="text-gray-600">
                    {report.applied.join(", ") || "—"}
                  </span>
                </p>
                <p>
                  <span className="font-medium text-amber-700">
                    Protegidos — posição mantida ({report.skipped.length}):
                  </span>{" "}
                  <span className="text-gray-600">
                    {report.skipped.map((s) => `${s.code} (${s.status})`).join(", ") ||
                      "—"}
                  </span>
                </p>
                {report.missing.length > 0 && (
                  <p>
                    <span className="font-medium text-red-700">
                      Inexistentes ({report.missing.length}):
                    </span>{" "}
                    <span className="text-gray-600">{report.missing.join(", ")}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {version.status === "ARCHIVED" && (
            <form action={restoreVersion}>
              <input type="hidden" name="versionId" value={version.id} />
              <ConfirmSubmit
                message={`Criar um novo rascunho a partir de "${version.label}"? O mapa publicado não muda até você ativar o rascunho.`}
                variant="outline"
              >
                Restaurar como rascunho
              </ConfirmSubmit>
            </form>
          )}
        </>
      )}
    </div>
  );
}

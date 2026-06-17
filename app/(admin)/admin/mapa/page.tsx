import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { getActiveEvent } from "@/lib/event";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HotspotEditor } from "@/components/admin/hotspot-editor";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  updateEventSvg,
  updateStandShape,
  uploadMapImage,
  clearMapImage,
  saveHotspots,
} from "./actions";
import { createDraftVersion } from "./version-actions";

export const dynamic = "force-dynamic";

const VERSION_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativa",
  ARCHIVED: "Arquivada",
};
const VERSION_COLOR: Record<string, string> = {
  DRAFT: "#d97706",
  ACTIVE: "#16a34a",
  ARCHIVED: "#64748b",
};

export default async function MapaEditorPage() {
  await requireAdmin();
  const event = await getActiveEvent();
  if (!event) {
    return <p className="text-gray-600">Nenhum evento ativo.</p>;
  }
  const stands = await prisma.stand.findMany({
    where: { eventId: event.id },
    orderBy: { code: "asc" },
  });
  const versions = await prisma.mapVersion.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "desc" },
  });

  // IDs de formas presentes no SVG (id="..." ou data-code="...").
  const svg = event.mapSvg ?? "";
  const shapeIds = new Set<string>();
  for (const m of svg.matchAll(/data-code="([^"]+)"/g)) shapeIds.add(m[1]);

  const editorStands = stands.map((s) => ({
    id: s.id,
    code: s.code,
    status: s.status,
    sector: s.sector,
    sizeM2: s.sizeM2 ?? 9,
    hotspot: s.hotspot,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Editor do mapa</h1>

      {/* ── VERSÕES DO MAPA (rascunho → revisão → ativação) ──────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Versões do mapa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Crie uma <strong>versão de análise</strong> para reposicionar stands sem
            afetar o site. Ao ativar, a nova posição vale só para stands{" "}
            <strong>disponíveis</strong> — vendidos, reservados, bloqueados e cedidos
            mantêm a posição atual. A versão anterior fica guardada no histórico.
          </p>
          <form action={createDraftVersion} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="eventId" value={event.id} />
            <div className="space-y-1">
              <Label htmlFor="version-label">Nome da versão</Label>
              <Input
                id="version-label"
                name="label"
                placeholder="Ex.: Reorganização ASA B"
                className="w-64"
              />
            </div>
            <Button type="submit" variant="outline">
              Criar versão de análise
            </Button>
          </form>
          {versions.length > 0 && (
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500">
                <tr>
                  <th className="py-1">Versão</th>
                  <th className="py-1">Status</th>
                  <th className="py-1">Criada</th>
                  <th className="py-1">Ativada</th>
                  <th className="py-1"></th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id} className="border-t border-gray-100">
                    <td className="py-2 font-medium">{v.label}</td>
                    <td className="py-2">
                      <Badge color={VERSION_COLOR[v.status]}>
                        {VERSION_LABEL[v.status] ?? v.status}
                      </Badge>
                    </td>
                    <td className="py-2 text-gray-500">
                      {v.createdAt.toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2 text-gray-500">
                      {v.activatedAt ? v.activatedAt.toLocaleString("pt-BR") : "—"}
                    </td>
                    <td className="py-2 text-right">
                      <Link
                        href={`/admin/mapa/versoes/${v.id}`}
                        className="text-brand-navy underline"
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* ── MAPA DO PAVILHÃO (vetorial ou imagem) + HOTSPOTS ─────────── */}
      <Card>
        <CardHeader>
          <CardTitle>
            {event.mapImageUrl
              ? "Mapa por imagem (hotspots) — edição direta do mapa publicado"
              : "Mapa do pavilhão — edição direta do mapa publicado"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!event.mapImageUrl && (
            <p className="text-sm text-gray-500">
              Mapa vetorial do pavilhão — a mesma visão que o visitante vê no site.
              Posicione os stands abaixo; tudo fica nítido em qualquer zoom.{" "}
              <strong>Alterações aqui vão direto ao site</strong> — para revisar antes,
              use uma versão de análise acima.
            </p>
          )}
          <HotspotEditor
            imageUrl={event.mapImageUrl ?? null}
            stands={editorStands}
            saveAction={saveHotspots}
          />
        </CardContent>
      </Card>

      {/* ── IMAGEM PERSONALIZADA (OPCIONAL) ──────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Imagem personalizada (opcional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-500">
            Se preferir usar uma arte própria (planta do designer, render 3D etc.),
            envie a imagem — ela substitui o mapa vetorial no site e no editor acima.
          </p>
          <div className="flex flex-wrap items-end gap-3">
            <form action={uploadMapImage} className="flex flex-wrap items-end gap-3">
              <input type="hidden" name="eventId" value={event.id} />
              <div className="space-y-1">
                <Label htmlFor="image">Imagem do mapa</Label>
                <Input id="image" name="image" type="file" accept="image/*" className="w-64" />
              </div>
              <Button type="submit" variant="outline">
                {event.mapImageUrl ? "Substituir imagem" : "Enviar imagem"}
              </Button>
            </form>
            {event.mapImageUrl && (
              <form action={clearMapImage}>
                <input type="hidden" name="eventId" value={event.id} />
                <Button type="submit" variant="outline">
                  Remover imagem e usar o mapa vetorial
                </Button>
              </form>
            )}
          </div>
          {event.mapImageUrl && (
            <p className="text-xs text-green-600">
              Imagem atual:{" "}
              <code className="text-gray-600">{event.mapImageUrl.split("/").pop()}</code>
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── AVANÇADO (LEGADO): SVG COLADO ───────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Avançado (legado) — SVG da planta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={updateEventSvg} className="space-y-3">
              <input type="hidden" name="eventId" value={event.id} />
              <Label htmlFor="mapSvg">
                Cole aqui o SVG do designer. Cada stand deve ter{" "}
                <code>data-code=&quot;CÓDIGO&quot;</code>.
              </Label>
              <Textarea
                id="mapSvg"
                name="mapSvg"
                rows={10}
                defaultValue={svg}
                className="font-mono text-xs"
              />
              <Button type="submit">Salvar planta</Button>
            </form>
            {svg && (
              <div
                className="max-h-[300px] overflow-auto rounded-lg border border-gray-200"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vínculo forma ↔ stand (SVG legado)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    <th className="py-1">Stand</th>
                    <th className="py-1">ID da forma</th>
                    <th className="py-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {stands.map((s) => {
                    const linked = s.svgShapeId && shapeIds.has(s.svgShapeId);
                    return (
                      <tr key={s.id} className="border-t border-gray-100">
                        <td className="py-2 font-medium">{s.code}</td>
                        <td className="py-2">
                          <form
                            action={updateStandShape}
                            className="flex items-center gap-2"
                          >
                            <input type="hidden" name="id" value={s.id} />
                            <Input
                              name="svgShapeId"
                              defaultValue={s.svgShapeId ?? ""}
                              className="h-8 w-28"
                            />
                            <Button type="submit" size="sm" variant="outline">
                              OK
                            </Button>
                          </form>
                        </td>
                        <td className="py-2">
                          {linked ? (
                            <span className="text-green-600">vinculado</span>
                          ) : (
                            <span className="text-amber-600">sem forma</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

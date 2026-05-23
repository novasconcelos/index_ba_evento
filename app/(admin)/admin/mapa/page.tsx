import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { getActiveEvent } from "@/lib/event";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HotspotEditor } from "@/components/admin/hotspot-editor";
import { updateEventSvg, updateStandShape, uploadMapImage, saveHotspots } from "./actions";

export const dynamic = "force-dynamic";

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

  // IDs de formas presentes no SVG (id="..." ou data-code="...").
  const svg = event.mapSvg ?? "";
  const shapeIds = new Set<string>();
  for (const m of svg.matchAll(/data-code="([^"]+)"/g)) shapeIds.add(m[1]);

  const editorStands = stands.map((s) => ({
    id: s.id,
    code: s.code,
    status: s.status,
    hotspot: s.hotspot,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Editor do mapa</h1>

      {/* ── IMAGEM + HOTSPOTS ────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa por imagem (hotspots)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={uploadMapImage} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="eventId" value={event.id} />
            <div className="space-y-1">
              <Label htmlFor="image">Imagem do mapa</Label>
              <Input id="image" name="image" type="file" accept="image/*" className="w-64" />
            </div>
            <Button type="submit" variant="outline">
              {event.mapImageUrl ? "Substituir imagem" : "Enviar imagem"}
            </Button>
            {event.mapImageUrl && (
              <span className="text-xs text-green-600">
                Imagem atual: <code className="text-gray-600">{event.mapImageUrl.split("/").pop()}</code>
              </span>
            )}
          </form>

          {event.mapImageUrl ? (
            <HotspotEditor
              imageUrl={event.mapImageUrl}
              stands={editorStands}
              saveAction={saveHotspots}
            />
          ) : (
            <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500">
              Envie uma imagem do mapa acima para começar a posicionar os stands.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ── SVG VETORIAL ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Pré-visualização da planta (SVG)</CardTitle>
        </CardHeader>
        <CardContent>
          {svg ? (
            <div
              className="max-h-[420px] overflow-auto rounded-lg border border-gray-200"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <p className="text-sm text-gray-500">
              Nenhuma planta SVG. Cole o código abaixo.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>SVG da planta</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vínculo forma ↔ stand</CardTitle>
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

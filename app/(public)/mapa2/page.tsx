import { getActiveEvent } from "@/lib/event";
import { prisma } from "@/lib/db";
import type { MapStand } from "@/components/map/interactive-map";
import { InteractiveImageMap } from "@/components/map/interactive-image-map";
import { MapViewSwitcher } from "@/components/map/map-view-switcher";
import { CartSummary } from "@/components/cart/cart-summary";
import type { StandStatus } from "@/lib/enums";

export const dynamic = "force-dynamic";

// Protótipo de comparação: planta baixa 2D top-down (visão operacional para
// alta densidade de stands). Ignora mapImageUrl/mapSvg de propósito — esta
// página é exclusivamente a variante "flat" do mapa vetorial.
export default async function Mapa2Page() {
  const event = await getActiveEvent();

  if (!event) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        Nenhum evento ativo. Rode <code>npm run db:seed</code> ou cadastre um
        evento no painel administrativo.
      </div>
    );
  }

  const stands = await prisma.stand.findMany({
    where: { eventId: event.id },
    orderBy: { code: "asc" },
  });

  const mapStands: MapStand[] = stands.map((s) => ({
    id: s.id,
    code: s.code,
    status: s.status as StandStatus,
    priceCents: s.priceCents,
    sizeM2: s.sizeM2,
    segment: s.segment,
    tipo: s.tipo,
    sector: s.sector,
    positionLabel: s.positionLabel,
    svgShapeId: s.svgShapeId,
    hotspot: s.hotspot,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-brand-navy">{event.name}</h1>
            <p className="text-sm text-gray-600">
              Planta 2D — visão operacional (protótipo de comparação).
            </p>
          </div>
          <MapViewSwitcher active="flat" />
        </div>
        <InteractiveImageMap imageUrl={null} stands={mapStands} variant="flat" />
      </div>
      <CartSummary />
    </div>
  );
}

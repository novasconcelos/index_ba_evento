import { getActiveEvent } from "@/lib/event";
import { prisma } from "@/lib/db";
import { InteractiveMap, type MapStand } from "@/components/map/interactive-map";
import { InteractiveImageMap } from "@/components/map/interactive-image-map";
import { MapLegend } from "@/components/map/map-legend";
import { CartSummary } from "@/components/cart/cart-summary";
import type { StandStatus } from "@/lib/enums";

export const dynamic = "force-dynamic";

export default async function MapaPage() {
  const event = await getActiveEvent();

  if (!event || (!event.mapSvg && !event.mapImageUrl)) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        Nenhum mapa de evento configurado. Rode <code>npm run db:seed</code> ou
        configure a planta no painel administrativo.
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
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">{event.name}</h1>
          <p className="text-sm text-gray-600">
            Clique nos stands disponíveis (verdes) para montar sua reserva.
          </p>
        </div>
        <MapLegend />
        {event.mapImageUrl ? (
          <InteractiveImageMap imageUrl={event.mapImageUrl} stands={mapStands} />
        ) : (
          <InteractiveMap svg={event.mapSvg!} stands={mapStands} />
        )}
      </div>
      <CartSummary />
    </div>
  );
}

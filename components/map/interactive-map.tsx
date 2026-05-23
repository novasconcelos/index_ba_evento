"use client";

import * as React from "react";
import { useCart, type CartItem } from "@/components/cart/cart-context";
import { formatBRL } from "@/lib/utils";
import { standStatusLabel } from "@/lib/labels";
import type { StandStatus } from "@/lib/enums";

export interface MapStand {
  id: string;
  code: string;
  status: StandStatus;
  priceCents: number;
  sizeM2: number | null;
  segment: string | null;
  sector: string | null;
  svgShapeId: string | null;
  hotspot?: string | null;
}

function fillFor(status: StandStatus, selected: boolean): {
  fill: string;
  stroke: string;
  width: string;
} {
  if (selected) return { fill: "#29b6c9", stroke: "#1b1568", width: "3" };
  switch (status) {
    case "AVAILABLE":
      return { fill: "#bbf7d0", stroke: "#16a34a", width: "1.5" };
    case "RESERVED":
      return { fill: "#fde68a", stroke: "#f59e0b", width: "1.5" };
    case "SOLD":
      return { fill: "#e9d5ff", stroke: "#9333ea", width: "1.5" };
    case "SPONSOR":
      return { fill: "#bae6fd", stroke: "#0ea5e9", width: "1.5" };
    case "BLOCKED":
      return { fill: "#e5e7eb", stroke: "#9ca3af", width: "1.5" };
    case "CEDED":
      return { fill: "#e2e8f0", stroke: "#64748b", width: "1.5" };
  }
}

interface Tooltip {
  x: number;
  y: number;
  stand: MapStand;
}

export function InteractiveMap({
  svg,
  stands,
}: {
  svg: string;
  stands: MapStand[];
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { items, has, toggle } = useCart();
  const [tooltip, setTooltip] = React.useState<Tooltip | null>(null);

  const byShape = React.useMemo(() => {
    const map = new Map<string, MapStand>();
    for (const s of stands) {
      if (s.svgShapeId) map.set(s.svgShapeId, s);
    }
    return map;
  }, [stands]);

  const selectedIds = React.useMemo(
    () => new Set(items.map((i) => i.id)),
    [items],
  );

  // Aplica cores/estados às formas conforme status e seleção.
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    for (const stand of stands) {
      if (!stand.svgShapeId) continue;
      const el = container.querySelector<SVGElement>(
        `[data-code="${CSS.escape(stand.code)}"]`,
      );
      if (!el) continue;
      const selected = selectedIds.has(stand.id);
      const style = fillFor(stand.status, selected);
      el.setAttribute("fill", style.fill);
      el.setAttribute("stroke", style.stroke);
      el.setAttribute("stroke-width", style.width);
      el.style.cursor =
        stand.status === "AVAILABLE" ? "pointer" : "not-allowed";
    }
  }, [stands, selectedIds]);

  const findStand = (target: EventTarget | null): MapStand | null => {
    if (!(target instanceof Element)) return null;
    const shape = target.closest("[data-code]");
    const code = shape?.getAttribute("data-code");
    return code ? byShape.get(code) ?? null : null;
  };

  const onClick = (e: React.MouseEvent) => {
    const stand = findStand(e.target);
    if (!stand || stand.status !== "AVAILABLE") return;
    const item: CartItem = {
      id: stand.id,
      code: stand.code,
      priceCents: stand.priceCents,
      sizeM2: stand.sizeM2,
      segment: stand.segment,
      sector: stand.sector,
    };
    toggle(item);
  };

  const onMove = (e: React.MouseEvent) => {
    const stand = findStand(e.target);
    if (!stand) {
      setTooltip(null);
      return;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    setTooltip({
      x: e.clientX - (rect?.left ?? 0),
      y: e.clientY - (rect?.top ?? 0),
      stand,
    });
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        onClick={onClick}
        onMouseMove={onMove}
        onMouseLeave={() => setTooltip(null)}
        className="overflow-auto rounded-xl border border-gray-200 bg-white p-2"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 w-52 rounded-lg border border-gray-200 bg-white p-3 text-xs shadow-lg"
          style={{
            left: Math.min(tooltip.x + 12, (containerRef.current?.clientWidth ?? 0) - 210),
            top: tooltip.y + 12,
          }}
        >
          <p className="text-sm font-bold text-brand-navy">
            Stand {tooltip.stand.code}
          </p>
          <p className="text-gray-500">{tooltip.stand.segment}</p>
          <div className="mt-1 flex justify-between">
            <span className="text-gray-500">Status</span>
            <span className="font-medium">
              {standStatusLabel[tooltip.stand.status]}
            </span>
          </div>
          {tooltip.stand.sizeM2 != null && (
            <div className="flex justify-between">
              <span className="text-gray-500">Metragem</span>
              <span className="font-medium">{tooltip.stand.sizeM2} m²</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Valor</span>
            <span className="font-semibold text-brand-navy">
              {formatBRL(tooltip.stand.priceCents)}
            </span>
          </div>
          {tooltip.stand.status === "AVAILABLE" && (
            <p className="mt-1 text-brand-teal-dark">
              {has(tooltip.stand.id)
                ? "Clique para remover"
                : "Clique para selecionar"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

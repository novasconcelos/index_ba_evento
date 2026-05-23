"use client";

import * as React from "react";
import { useCart, type CartItem } from "@/components/cart/cart-context";
import { formatBRL } from "@/lib/utils";
import { standStatusLabel, standStatusColor } from "@/lib/labels";
import { parseHotspot } from "@/lib/hotspot";
import type { MapStand } from "@/components/map/interactive-map";
import type { StandStatus } from "@/lib/enums";

/* ─── cores dos hotspots ──────────────────────────────────────── */
function tintFor(status: StandStatus, selected: boolean): { bg: string; border: string } {
  if (selected) return { bg: "rgba(45,42,140,0.60)", border: "#c6e84d" };
  switch (status) {
    case "AVAILABLE": return { bg: "rgba(34,197,94,0.45)",   border: "#16a34a" };
    case "RESERVED":  return { bg: "rgba(245,158,11,0.45)",  border: "#d97706" };
    case "SOLD":      return { bg: "rgba(147,51,234,0.45)",  border: "#7e22ce" };
    case "SPONSOR":   return { bg: "rgba(14,165,233,0.45)",  border: "#0284c7" };
    case "BLOCKED":   return { bg: "rgba(107,114,128,0.50)", border: "#4b5563" };
    case "CEDED":     return { bg: "rgba(71,85,105,0.50)",   border: "#334155" };
  }
}

/* ─── badge de status ─────────────────────────────────────────── */
const statusBg: Record<StandStatus, string> = {
  AVAILABLE: "bg-green-100 text-green-800 border-green-300",
  RESERVED:  "bg-amber-100 text-amber-800 border-amber-300",
  SOLD:      "bg-purple-100 text-purple-800 border-purple-300",
  SPONSOR:   "bg-sky-100 text-sky-800 border-sky-300",
  BLOCKED:   "bg-gray-100 text-gray-600 border-gray-300",
  CEDED:     "bg-slate-100 text-slate-600 border-slate-300",
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.5;

/* ─── componente principal ────────────────────────────────────── */
export function InteractiveImageMap({
  imageUrl,
  stands,
}: {
  imageUrl: string;
  stands: MapStand[];
}) {
  const { items, has, toggle } = useCart();

  /* zoom / pan */
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const panStart = React.useRef<{ mx: number; my: number; px: number; py: number } | null>(null);
  const viewportRef = React.useRef<HTMLDivElement>(null);

  /* hover / seleção no info-panel */
  const [hovered, setHovered] = React.useState<string | null>(null);
  const [focused, setFocused] = React.useState<string | null>(null); // destaque do painel

  const selectedIds = React.useMemo(() => new Set(items.map((i) => i.id)), [items]);

  const withHotspots = React.useMemo(
    () =>
      stands
        .map((s) => ({ stand: s, hs: parseHotspot(s.hotspot) }))
        .filter((x) => x.hs !== null) as {
        stand: MapStand;
        hs: NonNullable<ReturnType<typeof parseHotspot>>;
      }[],
    [stands],
  );

  /* zoom com a roda do mouse, centrado no cursor */
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const vp = viewportRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setZoom((prev) => {
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev + delta));
      if (next === prev) return prev;
      // ajusta pan para manter ponto sob cursor fixo
      setPan((p) => ({
        x: mx - (mx - p.x) * (next / prev),
        y: my - (my - p.y) * (next / prev),
      }));
      return next;
    });
  };

  /* arrastar para mover */
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button[data-stand]")) return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    panStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!panStart.current) return;
    setPan({
      x: panStart.current.px + (e.clientX - panStart.current.mx),
      y: panStart.current.py + (e.clientY - panStart.current.my),
    });
  };
  const onPointerUp = () => { panStart.current = null; };

  /* botões de zoom */
  const zoomIn  = () => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(1)));
  const zoomOut = () => {
    setZoom((z) => {
      const next = Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(1));
      if (next === MIN_ZOOM) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const zoomReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  /* clique num stand */
  const select = (stand: MapStand) => {
    if (stand.status !== "AVAILABLE") return;
    const item: CartItem = {
      id: stand.id, code: stand.code,
      priceCents: stand.priceCents, sizeM2: stand.sizeM2,
      segment: stand.segment, sector: stand.sector,
    };
    toggle(item);
  };

  /* agrupar por segmento para o painel */
  const bySegment = React.useMemo(() => {
    const map = new Map<string, MapStand[]>();
    for (const s of stands) {
      const key = s.segment ?? "Sem segmento";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [stands]);

  const hoveredEntry = withHotspots.find((x) => x.stand.id === (hovered ?? focused));

  return (
    <div className="space-y-4">
      {/* ── viewport do mapa ──────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {/* barra de controles */}
        <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-1.5">
          <span className="text-xs text-gray-500">Zoom</span>
          <button
            onClick={zoomOut}
            className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 bg-white text-lg leading-none hover:bg-gray-100 disabled:opacity-40"
            disabled={zoom <= MIN_ZOOM}
          >−</button>
          <span className="min-w-[3rem] text-center text-xs font-medium text-gray-700">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 bg-white text-lg leading-none hover:bg-gray-100 disabled:opacity-40"
            disabled={zoom >= MAX_ZOOM}
          >+</button>
          <button
            onClick={zoomReset}
            className="ml-1 rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
          >Resetar</button>
          <span className="ml-auto text-xs text-gray-400">
            Scroll para zoom · Arraste para mover
          </span>
        </div>

        {/* área de visualização */}
        <div
          ref={viewportRef}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className="relative select-none overflow-hidden"
          style={{ height: 420, cursor: panStart.current ? "grabbing" : zoom > 1 ? "grab" : "default" }}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              position: "relative",
              width: "100%",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Mapa do evento" className="block w-full" draggable={false} />

            {/* hotspot overlays */}
            {withHotspots.map(({ stand, hs }) => {
              const sel = selectedIds.has(stand.id);
              const isFocused = focused === stand.id;
              const style = tintFor(stand.status, sel);
              return (
                <button
                  key={stand.id}
                  type="button"
                  data-stand="1"
                  onClick={() => select(stand)}
                  onMouseEnter={() => setHovered(stand.id)}
                  onMouseLeave={() => setHovered((h) => (h === stand.id ? null : h))}
                  className="absolute rounded-sm transition-[filter] hover:brightness-110"
                  style={{
                    left:   `${hs.x * 100}%`,
                    top:    `${hs.y * 100}%`,
                    width:  `${hs.w * 100}%`,
                    height: `${hs.h * 100}%`,
                    backgroundColor: style.bg,
                    border: `2px solid ${isFocused ? "#c6e84d" : style.border}`,
                    boxShadow: isFocused ? "0 0 0 3px #2d2a8c" : undefined,
                    cursor: stand.status === "AVAILABLE" ? "pointer" : "not-allowed",
                  }}
                  aria-label={`Stand ${stand.code} — ${standStatusLabel[stand.status]}`}
                />
              );
            })}
          </div>

          {/* tooltip flutuante (fixo no viewport, não escala com zoom) */}
          {hoveredEntry && (
            <div
              className="pointer-events-none absolute left-3 top-3 z-20 w-48 rounded-lg border border-gray-200 bg-white p-2.5 text-xs shadow-lg"
            >
              <p className="text-sm font-bold text-brand-navy">Stand {hoveredEntry.stand.code}</p>
              {hoveredEntry.stand.segment && (
                <p className="text-gray-500">{hoveredEntry.stand.segment}</p>
              )}
              {hoveredEntry.stand.sector && (
                <p className="text-gray-400 text-[11px]">{hoveredEntry.stand.sector}</p>
              )}
              <div className="mt-1 flex justify-between">
                <span className="text-gray-500">Status</span>
                <span className={`rounded border px-1 text-[10px] font-medium ${statusBg[hoveredEntry.stand.status]}`}>
                  {standStatusLabel[hoveredEntry.stand.status]}
                </span>
              </div>
              {hoveredEntry.stand.sizeM2 != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Metragem</span>
                  <span className="font-medium">{hoveredEntry.stand.sizeM2} m²</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Valor</span>
                <span className="font-semibold text-brand-navy">{formatBRL(hoveredEntry.stand.priceCents)}</span>
              </div>
              {hoveredEntry.stand.status === "AVAILABLE" && (
                <p className="mt-1 font-medium text-brand-teal-dark">
                  {has(hoveredEntry.stand.id) ? "✓ Selecionado — clique para remover" : "Clique para selecionar"}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── painel de áreas / stands ──────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-brand-navy">Stands por área</h2>
        <div className="space-y-4">
          {bySegment.map(([segment, segStands]) => {
            const available = segStands.filter((s) => s.status === "AVAILABLE").length;
            return (
              <div key={segment}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">{segment}</span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
                    {available} disponíve{available === 1 ? "l" : "is"}
                  </span>
                  <span className="text-xs text-gray-400">{segStands.length} no total</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {segStands.map((s) => {
                    const sel = selectedIds.has(s.id);
                    const isFoc = focused === s.id;
                    const color = standStatusColor[s.status];
                    return (
                      <button
                        key={s.id}
                        type="button"
                        title={`${s.code} — ${standStatusLabel[s.status]}${s.sizeM2 ? ` · ${s.sizeM2} m²` : ""} · ${formatBRL(s.priceCents)}`}
                        onClick={() => {
                          setFocused((f) => (f === s.id ? null : s.id));
                          select(s);
                        }}
                        onMouseEnter={() => setFocused(s.id)}
                        onMouseLeave={() => setFocused(null)}
                        className="rounded border px-2 py-0.5 text-[11px] font-semibold transition-all"
                        style={{
                          backgroundColor: sel ? "#2d2a8c" : `${color}22`,
                          borderColor: isFoc || sel ? (sel ? "#c6e84d" : "#2d2a8c") : color,
                          color: sel ? "#fff" : color,
                          cursor: s.status === "AVAILABLE" ? "pointer" : "default",
                          opacity: s.status === "BLOCKED" || s.status === "CEDED" ? 0.5 : 1,
                        }}
                      >
                        {s.code}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* legenda */}
        <div className="mt-4 flex flex-wrap gap-3 border-t border-gray-100 pt-3">
          {(Object.entries(standStatusLabel) as [StandStatus, string][]).map(([k, label]) => (
            <span key={k} className="flex items-center gap-1 text-xs text-gray-600">
              <span
                className="inline-block h-3 w-3 rounded-sm border"
                style={{ backgroundColor: `${standStatusColor[k]}33`, borderColor: standStatusColor[k] }}
              />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

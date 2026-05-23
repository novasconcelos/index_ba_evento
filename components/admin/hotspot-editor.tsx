"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { parseHotspot, type Hotspot } from "@/lib/hotspot";
import { standStatusColor } from "@/lib/labels";
import type { StandStatus } from "@/lib/enums";

interface EditorStand {
  id: string;
  code: string;
  status: string;
  hotspot: string | null;
}

const DEFAULT_W = 0.04;
const DEFAULT_H = 0.035;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

type DragState = {
  id: string;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  orig: Hotspot;
} | null;

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;
const ZOOM_STEP = 0.5;

export function HotspotEditor({
  imageUrl,
  stands,
  saveAction,
}: {
  imageUrl: string;
  stands: EditorStand[];
  saveAction: (formData: FormData) => void;
}) {
  const imgRef   = React.useRef<HTMLImageElement>(null);
  const wrapRef  = React.useRef<HTMLDivElement>(null);   // div escalada
  const vpRef    = React.useRef<HTMLDivElement>(null);   // viewport com overflow:hidden
  const dragRef  = React.useRef<DragState>(null);
  const movedRef = React.useRef(false);

  /* zoom / pan */
  const [zoom, setZoom]   = React.useState(1);
  const [pan,  setPan]    = React.useState({ x: 0, y: 0 });
  const panStart = React.useRef<{ mx: number; my: number; px: number; py: number } | null>(null);

  const [hotspots, setHotspots] = React.useState<Record<string, Hotspot>>(() => {
    const init: Record<string, Hotspot> = {};
    for (const s of stands) {
      const hs = parseHotspot(s.hotspot);
      if (hs) init[s.id] = hs;
    }
    return init;
  });

  const [activeId, setActiveId] = React.useState<string>(stands[0]?.id ?? "");
  const placedCount = Object.keys(hotspots).length;

  /* ── coordenada normalizada relativa à imagem ─────────────── */
  const normFromClient = (clientX: number, clientY: number) => {
    const img  = imgRef.current;
    const wrap = wrapRef.current;
    if (!img || !wrap) return { x: 0, y: 0 };
    // posição do img no viewport escalado
    const imgRect  = img.getBoundingClientRect();
    return {
      x: clamp01((clientX - imgRect.left) / imgRect.width),
      y: clamp01((clientY - imgRect.top)  / imgRect.height),
    };
  };

  /* ── zoom com roda, centrado no cursor ────────────────────── */
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const vp = vpRef.current;
    if (!vp) return;
    const rect = vp.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    setZoom((prev) => {
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      const next  = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, +(prev + delta).toFixed(1)));
      if (next === prev) return prev;
      setPan((p) => ({
        x: mx - (mx - p.x) * (next / prev),
        y: my - (my - p.y) * (next / prev),
      }));
      return next;
    });
  };

  const zoomIn    = () => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(1)));
  const zoomOut   = () => setZoom((z) => {
    const n = Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(1));
    if (n === MIN_ZOOM) setPan({ x: 0, y: 0 });
    return n;
  });
  const zoomReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  /* ── pan de fundo (quando não estamos arrastando um hotspot) ─ */
  const onVpPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.dataset.box || target.dataset.handle) return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    panStart.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  };
  const onVpPointerMove = (e: React.PointerEvent) => {
    // se houver drag de hotspot, delega
    if (dragRef.current) { onPointerMoveHotspot(e); return; }
    if (!panStart.current) return;
    const dx = e.clientX - panStart.current.mx;
    const dy = e.clientY - panStart.current.my;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) movedRef.current = true;
    setPan({ x: panStart.current.px + dx, y: panStart.current.py + dy });
  };
  const onVpPointerUp = () => { panStart.current = null; endDrag(); };

  /* ── clique no fundo → posicionar hotspot ────────────────────── */
  const onWrapClick = (e: React.MouseEvent) => {
    if (movedRef.current) { movedRef.current = false; return; }
    const target = e.target as HTMLElement;
    if (target.dataset.box || target.dataset.handle) return;
    if (!activeId) return;
    const { x, y } = normFromClient(e.clientX, e.clientY);
    setHotspots((prev) => {
      const ex = prev[activeId];
      const w  = ex?.w ?? DEFAULT_W;
      const h  = ex?.h ?? DEFAULT_H;
      return { ...prev, [activeId]: { x: clamp01(x - w / 2), y: clamp01(y - h / 2), w, h } };
    });
  };

  /* ── arrastar hotspot / handle ──────────────────────────────── */
  const onPointerMoveHotspot = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const img = imgRef.current;
    if (!img) return;
    const imgRect = img.getBoundingClientRect();
    const dx = (e.clientX - drag.startX) / imgRect.width;
    const dy = (e.clientY - drag.startY) / imgRect.height;
    if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) movedRef.current = true;
    setHotspots((prev) => {
      const o = drag.orig;
      if (drag.mode === "move") {
        return { ...prev, [drag.id]: { ...o, x: clamp01(o.x + dx), y: clamp01(o.y + dy) } };
      }
      return {
        ...prev,
        [drag.id]: {
          ...o,
          w: Math.max(0.005, Math.min(1 - o.x, o.w + dx)),
          h: Math.max(0.005, Math.min(1 - o.y, o.h + dy)),
        },
      };
    });
  };

  const endDrag = () => { dragRef.current = null; };

  const startDrag = (e: React.PointerEvent, id: string, mode: "move" | "resize") => {
    e.stopPropagation();
    setActiveId(id);
    movedRef.current = false;
    dragRef.current  = { id, mode, startX: e.clientX, startY: e.clientY, orig: hotspots[id] };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const removeActive = () => {
    setHotspots((prev) => { const n = { ...prev }; delete n[activeId]; return n; });
  };

  return (
    <div className="space-y-3">
      {/* barra de controles */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white p-3">
        <label className="text-sm font-medium text-gray-700">Stand ativo:</label>
        <select
          value={activeId}
          onChange={(e) => setActiveId(e.target.value)}
          className="h-9 rounded-lg border border-gray-300 px-2 text-sm"
        >
          {stands.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} {hotspots[s.id] ? "✓" : ""}
            </option>
          ))}
        </select>

        <Button type="button" size="sm" variant="outline" onClick={removeActive}>
          Remover área
        </Button>

        <span className="text-xs text-gray-500">{placedCount}/{stands.length} posicionados</span>

        {/* zoom */}
        <div className="flex items-center gap-1 ml-2">
          <span className="text-xs text-gray-500">Zoom</span>
          <button onClick={zoomOut} disabled={zoom <= MIN_ZOOM}
            className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 bg-white text-base hover:bg-gray-100 disabled:opacity-40">−</button>
          <span className="min-w-[3rem] text-center text-xs font-medium text-gray-700">{Math.round(zoom * 100)}%</span>
          <button onClick={zoomIn} disabled={zoom >= MAX_ZOOM}
            className="flex h-7 w-7 items-center justify-center rounded border border-gray-300 bg-white text-base hover:bg-gray-100 disabled:opacity-40">+</button>
          <button onClick={zoomReset}
            className="rounded border border-gray-300 bg-white px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100">
            Resetar
          </button>
        </div>

        <form action={saveAction} className="ml-auto">
          <input type="hidden" name="data" value={JSON.stringify(hotspots)} />
          <Button type="submit" size="sm">Salvar posições</Button>
        </form>
      </div>

      <p className="text-xs text-gray-500">
        Selecione um stand, dê zoom e <strong>clique no mapa</strong> para posicionar.
        Arraste a área para mover; quadradinho do canto para redimensionar. Scroll = zoom.
      </p>

      {/* viewport do mapa */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div
          ref={vpRef}
          onWheel={onWheel}
          onPointerDown={onVpPointerDown}
          onPointerMove={onVpPointerMove}
          onPointerUp={onVpPointerUp}
          onPointerLeave={onVpPointerUp}
          onClick={onWrapClick}
          className="relative select-none overflow-hidden"
          style={{ height: 500, cursor: panStart.current ? "grabbing" : zoom > 1 ? "grab" : "crosshair" }}
        >
          <div
            ref={wrapRef}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              position: "relative",
              width: "100%",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Mapa do evento"
              className="block w-full"
              draggable={false}
            />

            {stands.map((s) => {
              const hs     = hotspots[s.id];
              if (!hs) return null;
              const active = s.id === activeId;
              const color  = standStatusColor[s.status as StandStatus] ?? "#64748b";
              return (
                <div
                  key={s.id}
                  data-box="1"
                  onPointerDown={(e) => startDrag(e, s.id, "move")}
                  className="absolute flex items-center justify-center"
                  style={{
                    left:   `${hs.x * 100}%`,
                    top:    `${hs.y * 100}%`,
                    width:  `${hs.w * 100}%`,
                    height: `${hs.h * 100}%`,
                    backgroundColor: `${color}55`,
                    border:     active ? "2px solid #c6e84d" : `1.5px solid ${color}`,
                    boxShadow:  active ? "0 0 0 2px #2d2a8c" : undefined,
                    cursor: "move",
                  }}
                >
                  <span
                    className="pointer-events-none select-none text-brand-navy font-bold"
                    style={{ fontSize: `clamp(6px, ${hs.w * 60}vw, 11px)` }}
                  >
                    {s.code}
                  </span>
                  {active && (
                    <span
                      data-handle="1"
                      onPointerDown={(e) => startDrag(e, s.id, "resize")}
                      className="absolute -bottom-1.5 -right-1.5 h-3 w-3 cursor-se-resize rounded-sm border border-white bg-brand-navy"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

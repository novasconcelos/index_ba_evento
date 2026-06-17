"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { parseHotspot, type Hotspot } from "@/lib/hotspot";
import { standStatusColor } from "@/lib/labels";
import { StandBlock } from "@/components/map/stand-block";
import { PavilionScene, VIEW_W, VIEW_H, slopeFor } from "@/lib/venue/index-pavilion";
import { shelfPack, widthForSize, BLOCK_H } from "@/lib/venue/stand-scale";
import type { StandStatus } from "@/lib/enums";

interface EditorStand {
  id: string;
  code: string;
  status: string;
  sector: string | null;
  sizeM2: number;
  hotspot: string | null;
}

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

// imageUrl null → fundo = cena vetorial do pavilhão (mesma visão do público).
export function HotspotEditor({
  imageUrl,
  stands,
  saveAction,
  hiddenFields = [],
  protectedIds = [],
}: {
  imageUrl: string | null;
  stands: EditorStand[];
  saveAction: (formData: FormData) => void;
  // campos extras enviados no form de salvar (ex.: versionId no modo rascunho)
  hiddenFields?: { name: string; value: string }[];
  // stands protegidos (vendidos/reservados): editáveis no rascunho, mas serão
  // mantidos na posição atual durante a ativação — só indicação visual aqui
  protectedIds?: string[];
}) {
  const protectedSet = React.useMemo(() => new Set(protectedIds), [protectedIds]);
  const vector   = !imageUrl;
  const baseRef  = React.useRef<HTMLImageElement | SVGSVGElement | null>(null);
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

  /* ── coordenada normalizada relativa à base (imagem ou cena) ─ */
  const normFromClient = (clientX: number, clientY: number) => {
    const base = baseRef.current;
    const wrap = wrapRef.current;
    if (!base || !wrap) return { x: 0, y: 0 };
    // posição da base no viewport escalado
    const baseRect = base.getBoundingClientRect();
    return {
      x: clamp01((clientX - baseRect.left) / baseRect.width),
      y: clamp01((clientY - baseRect.top)  / baseRect.height),
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
    const activeStand = stands.find((s) => s.id === activeId);
    setHotspots((prev) => {
      const ex = prev[activeId];
      // Bloco novo nasce com largura proporcional aos m² (profundidade fixa).
      const w  = ex?.w ?? widthForSize(activeStand?.sizeM2 ?? 9);
      const h  = ex?.h ?? BLOCK_H;
      return { ...prev, [activeId]: { x: clamp01(x - w / 2), y: clamp01(y - h / 2), w, h } };
    });
    // auto-avança para o próximo stand ainda sem área (agiliza o cadastro)
    const idx  = stands.findIndex((s) => s.id === activeId);
    const next = stands.slice(idx + 1).find((s) => !hotspots[s.id]);
    if (next) setActiveId(next.id);
  };

  /* ── mover/redimensionar com o teclado (precisão) ───────────── */
  React.useEffect(() => {
    const ARROWS = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (!activeId || !hotspots[activeId]) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeActive();
        return;
      }
      if (!ARROWS.includes(e.key)) return;
      e.preventDefault();
      const step = e.shiftKey ? 0.01 : 0.002;
      setHotspots((prev) => {
        const o = prev[activeId];
        if (!o) return prev;
        const n = { ...o };
        if (e.altKey) {
          if (e.key === "ArrowRight") n.w = Math.min(1 - o.x, o.w + step);
          if (e.key === "ArrowLeft")  n.w = Math.max(0.005, o.w - step);
          if (e.key === "ArrowDown")  n.h = Math.min(1 - o.y, o.h + step);
          if (e.key === "ArrowUp")    n.h = Math.max(0.005, o.h - step);
        } else {
          if (e.key === "ArrowRight") n.x = clamp01(o.x + step);
          if (e.key === "ArrowLeft")  n.x = clamp01(o.x - step);
          if (e.key === "ArrowDown")  n.y = clamp01(o.y + step);
          if (e.key === "ArrowUp")    n.y = clamp01(o.y - step);
        }
        return { ...prev, [activeId]: n };
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, hotspots]);

  /* ── distribui em prateleiras os stands ainda sem área ──────── */
  // Largura proporcional aos m² (mesma escala do mapa público).
  const autoDistribute = () => {
    const missing = stands.filter((s) => !hotspots[s.id]);
    if (missing.length === 0) return;
    const region = { x0: 0.08, x1: 0.92, y0: 0.15, y1: 0.8, slope: 0 };
    const packed = shelfPack(
      missing.map((s) => ({ id: s.id, sizeM2: s.sizeM2 })),
      region,
    );
    setHotspots((prev) => ({ ...prev, ...packed }));
  };

  /* ── arrastar hotspot / handle ──────────────────────────────── */
  const onPointerMoveHotspot = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const base = baseRef.current;
    if (!base) return;
    const baseRect = base.getBoundingClientRect();
    const dx = (e.clientX - drag.startX) / baseRect.width;
    const dy = (e.clientY - drag.startY) / baseRect.height;
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
              {s.code} {protectedSet.has(s.id) ? "🔒" : ""} {hotspots[s.id] ? "✓" : ""}
            </option>
          ))}
        </select>

        <Button type="button" size="sm" variant="outline" onClick={removeActive}>
          Remover área
        </Button>

        <Button type="button" size="sm" variant="outline" onClick={autoDistribute}>
          Auto-distribuir
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
          {hiddenFields.map((f) => (
            <input key={f.name} type="hidden" name={f.name} value={f.value} />
          ))}
          <Button type="submit" size="sm">Salvar posições</Button>
        </form>
      </div>

      <p className="text-xs text-gray-500">
        Selecione um stand, dê zoom e <strong>clique no mapa</strong> para posicionar — o
        próximo stand sem área é selecionado automaticamente. Arraste para mover; quadradinho
        do canto para redimensionar. <strong>Setas</strong> do teclado ajustam a posição
        (<strong>Alt+setas</strong> redimensiona, <strong>Shift</strong> move mais rápido,
        <strong>Delete</strong> remove). Scroll = zoom.
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
            {imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                ref={baseRef as React.RefObject<HTMLImageElement>}
                src={imageUrl}
                alt="Mapa do evento"
                className="block w-full"
                draggable={false}
              />
            ) : (
              /* cena vetorial do pavilhão + blocos WYSIWYG (mesma visão do público) */
              <svg
                ref={baseRef as React.RefObject<SVGSVGElement>}
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                className="block w-full"
              >
                <PavilionScene />
                {stands.map((s) => {
                  const hs = hotspots[s.id];
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
                      focused={s.id === activeId}
                    />
                  );
                })}
              </svg>
            )}

            {stands.map((s) => {
              const hs     = hotspots[s.id];
              if (!hs) return null;
              const active = s.id === activeId;
              const locked = protectedSet.has(s.id);
              const color  = standStatusColor[s.status as StandStatus] ?? "#64748b";
              const idleBorder = locked
                ? "2px dashed #dc2626"
                : vector
                  ? "1px dashed rgba(45,42,140,0.4)"
                  : `1.5px solid ${color}`;
              return (
                <div
                  key={s.id}
                  data-box="1"
                  onPointerDown={(e) => startDrag(e, s.id, "move")}
                  className="absolute flex items-center justify-center"
                  style={
                    vector
                      ? {
                          // camada de interação transparente sobre o bloco SVG
                          left:   `${hs.x * 100}%`,
                          top:    `${hs.y * 100}%`,
                          width:  `${hs.w * 100}%`,
                          height: `${hs.h * 100}%`,
                          border: active ? "2px solid #c6e84d" : idleBorder,
                          boxShadow: active ? "0 0 0 2px #2d2a8c" : undefined,
                          cursor: "move",
                        }
                      : {
                          left:   `${hs.x * 100}%`,
                          top:    `${hs.y * 100}%`,
                          width:  `${hs.w * 100}%`,
                          height: `${hs.h * 100}%`,
                          backgroundColor: `${color}55`,
                          border:     active ? "2px solid #c6e84d" : idleBorder,
                          boxShadow:  active ? "0 0 0 2px #2d2a8c" : undefined,
                          cursor: "move",
                        }
                  }
                >
                  {!vector && (
                    <span
                      className="pointer-events-none select-none text-brand-navy font-bold"
                      style={{ fontSize: `clamp(6px, ${hs.w * 60}vw, 11px)` }}
                    >
                      {s.code}
                    </span>
                  )}
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

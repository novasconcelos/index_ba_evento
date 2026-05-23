// Área clicável de um stand sobre a imagem do mapa.
// Coordenadas normalizadas (0..1) relativas à largura/altura da imagem.
export interface Hotspot {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function parseHotspot(json: string | null | undefined): Hotspot | null {
  if (!json) return null;
  try {
    const o = JSON.parse(json);
    if (
      typeof o?.x === "number" &&
      typeof o?.y === "number" &&
      typeof o?.w === "number" &&
      typeof o?.h === "number"
    ) {
      return { x: o.x, y: o.y, w: o.w, h: o.h };
    }
  } catch {
    // ignora JSON inválido
  }
  return null;
}

export function serializeHotspot(h: Hotspot): string {
  const round = (n: number) => Math.round(n * 10000) / 10000;
  return JSON.stringify({
    x: round(h.x),
    y: round(h.y),
    w: round(h.w),
    h: round(h.h),
  });
}

// Escala dos blocos de stand no mapa: profundidade fixa e largura proporcional
// aos m² (como pavilhões reais — profundidade ~3m, frente variável). Funções
// puras (server e client), reutilizadas pelo seed (lib/sample-map.ts) e pelo
// editor de hotspots (components/admin/hotspot-editor.tsx). Tudo em coordenadas
// normalizadas (0..1) sobre o viewBox do pavilhão.

import type { Hotspot } from "@/lib/hotspot";

// Largura normalizada por m². Profundidade fixa → largura linear na área:
// 9 m² ≈ 0.0216, 18 m² ≈ 0.0432, 27 m² ≈ 0.0648 (um 27 ocupa 3× a largura de um 9).
export const W_PER_M2 = 0.0024;
export const MIN_W = 0.012; // piso de segurança para stands minúsculos
export const BLOCK_H = 0.045; // profundidade (altura) fixa do bloco
export const GAP_X = 0.006; // espaçamento horizontal entre blocos
export const GAP_Y = 0.014; // espaçamento vertical entre prateleiras (corredor)

export function widthForSize(sizeM2: number): number {
  return Math.max(MIN_W, sizeM2 * W_PER_M2);
}

export interface PackRegion {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  slope: number; // deslocamento de Y ao longo da largura da região (inclinação da asa)
}

export interface PackItem {
  id: string;
  sizeM2: number;
}

// Empacota os stands em "prateleiras" da esquerda para a direita, quebrando a
// linha quando o próximo bloco não cabe na largura da região. Acompanha o slope
// da asa pela posição do centro do bloco. Retorna o hotspot {x,y,w,h} por id.
export function shelfPack(
  items: PackItem[],
  region: PackRegion,
): Record<string, Hotspot> {
  const { x0, x1, y0, slope } = region;
  const regionW = x1 - x0;
  const out: Record<string, Hotspot> = {};

  let cx = x0;
  let cy = y0;

  for (const item of items) {
    const w = widthForSize(item.sizeM2);
    const h = BLOCK_H;

    // quebra de linha quando estoura a largura da região (e não é o 1º da linha)
    if (cx > x0 && cx + w > x1) {
      cx = x0;
      cy += h + GAP_Y;
    }

    // slope aplicado pela posição do centro do bloco na região (igual ao gridHotspot)
    const center = regionW > 0 ? (cx + w / 2 - x0) / regionW : 0;
    const y = cy + slope * center;

    const round = (n: number) => +n.toFixed(4);
    out[item.id] = { x: round(cx), y: round(y), w: round(w), h: round(h) };

    cx += w + GAP_X;
  }

  return out;
}

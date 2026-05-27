import type { StandStatus } from "@/lib/enums";

export interface StandSpec {
  code: string;
  segment: string;
  tipo: string;
  sector: string; // ASA: A / B / FOYER
  positionLabel: string; // Localização (= code no exemplo)
  sizeM2: number;
  priceCents: number;
  status: StandStatus;
  svgShapeId: string;
  hotspot: string; // JSON {x,y,w,h} normalizado (0..1) sobre o mapa 3D
}

// Regiões aproximadas das asas sobre a imagem 3D (geral.jpg), em coords 0..1.
// `slope` desloca o Y ao longo das colunas para acompanhar a perspectiva.
interface GridRegion {
  x0: number; x1: number; y0: number; y1: number;
  cols: number; rows: number; slope: number;
}

const ASA_REGIONS: Record<string, GridRegion> = {
  // Asa esquerda (desce em direção ao centro): ASA A
  A: { x0: 0.07, x1: 0.43, y0: 0.20, y1: 0.62, cols: 8, rows: 4, slope: 0.16 },
  // Asa direita (sobe em direção à direita): ASA B
  B: { x0: 0.57, x1: 0.94, y0: 0.30, y1: 0.66, cols: 8, rows: 2, slope: -0.16 },
  // Centro (foyer)
  FOYER: { x0: 0.44, x1: 0.56, y0: 0.55, y1: 0.72, cols: 4, rows: 2, slope: 0 },
};

function gridHotspot(index: number, region: GridRegion): string {
  const { x0, x1, y0, y1, cols, rows, slope } = region;
  const cellW = (x1 - x0) / cols;
  const cellH = (y1 - y0) / rows;
  const c = index % cols;
  const r = Math.floor(index / cols) % rows;
  const w = cellW * 0.72;
  const h = cellH * 0.6;
  const x = x0 + c * cellW + (cellW - w) / 2;
  const y = y0 + r * cellH + (cellH - h) / 2 + slope * (c / Math.max(1, cols - 1));
  const round = (n: number) => +n.toFixed(4);
  return JSON.stringify({ x: round(x), y: round(y), w: round(w), h: round(h) });
}

interface Block {
  sectorLetter: string;
  segment: string;
  asa: string;
  count: number;
}

const BLOCKS: Block[] = [
  { sectorLetter: "H", segment: "Alimentos e Bebidas", asa: "A", count: 16 },
  { sectorLetter: "G", segment: "Agroindústria", asa: "A", count: 16 },
  { sectorLetter: "O", segment: "Institucional", asa: "B", count: 16 },
];

// Tipos reais da planilha (BASE_GERAL).
export const SAMPLE_TIPOS = [
  "Padrão",
  "Tech",
  "Piso",
  "Padrão com depósito",
  "Restaurante",
  "Cervejaria",
  "Carrinho Praça de Alimentação",
];

export const SAMPLE_ASAS = ["A", "B", "FOYER"];

const SIZES = [9, 18, 27];
const PRICE_PER_M2_CENTS = 45000; // R$ 450,00 / m²

// Distribui alguns status iniciais para o mapa parecer realista.
function initialStatus(index: number): StandStatus {
  const mod = index % 7;
  if (mod === 0) return "SOLD";
  if (mod === 1) return "RESERVED";
  if (mod === 5) return "SPONSOR";
  return "AVAILABLE";
}

const COLS = 8;
const CELL_W = 116;
const CELL_H = 88;
const PAD_X = 70;
const BLOCK_TOP = 70;
const BLOCK_GAP = 230;
const ROW_GAP = 96;

export interface SampleMap {
  stands: StandSpec[];
  svg: string;
}

export function buildSampleMap(): SampleMap {
  const stands: StandSpec[] = [];
  const shapes: string[] = [];
  const labels: string[] = [];
  const asaCursor: Record<string, number> = { A: 0, B: 0, FOYER: 0 };

  BLOCKS.forEach((block, blockIndex) => {
    const blockTop = BLOCK_TOP + blockIndex * BLOCK_GAP;
    labels.push(
      `<text x="${PAD_X}" y="${blockTop - 16}" class="block-label" font-size="20" font-weight="700" fill="#1b1568">Setor ${block.sectorLetter} — ${block.segment} (ASA ${block.asa})</text>`,
    );

    for (let i = 0; i < block.count; i++) {
      const n = i + 1;
      const code = `${block.sectorLetter}${n}`;
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = PAD_X + col * CELL_W;
      const y = blockTop + row * ROW_GAP;
      const w = CELL_W - 16;
      const h = CELL_H - 16;
      const size = SIZES[i % SIZES.length];

      const region = ASA_REGIONS[block.asa] ?? ASA_REGIONS.A;
      const hotspot = gridHotspot(asaCursor[block.asa] ?? 0, region);
      asaCursor[block.asa] = (asaCursor[block.asa] ?? 0) + 1;

      stands.push({
        code,
        segment: block.segment,
        tipo: SAMPLE_TIPOS[(blockIndex * 5 + i) % SAMPLE_TIPOS.length],
        sector: block.asa, // ASA: "A" / "B"
        positionLabel: code,
        sizeM2: size,
        priceCents: size * PRICE_PER_M2_CENTS,
        status: initialStatus(blockIndex * 5 + i),
        svgShapeId: code,
        hotspot,
      });

      shapes.push(
        `<rect id="${code}" data-code="${code}" class="stand" x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1.5" />`,
      );
      labels.push(
        `<text x="${x + w / 2}" y="${y + h / 2 + 5}" text-anchor="middle" font-size="15" font-weight="600" fill="#0f172a" pointer-events="none">${code}</text>`,
      );
    }
  });

  const width = PAD_X * 2 + COLS * CELL_W;
  const height = BLOCK_TOP + BLOCKS.length * BLOCK_GAP;

  const svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" width="100%" style="max-width:100%;height:auto">
  <rect x="0" y="0" width="${width}" height="${height}" fill="#eef2f5" />
  <rect x="${PAD_X - 24}" y="40" width="${COLS * CELL_W + 16}" height="${height - 60}" fill="#ffffff" stroke="#e2e8f0" rx="12" />
  ${shapes.join("\n  ")}
  ${labels.join("\n  ")}
</svg>`;

  return { stands, svg };
}

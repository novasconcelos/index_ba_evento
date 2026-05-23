import type { StandStatus } from "@/lib/enums";

export interface StandSpec {
  code: string;
  segment: string;
  sector: string;
  sizeM2: number;
  priceCents: number;
  status: StandStatus;
  svgShapeId: string;
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

      stands.push({
        code,
        segment: block.segment,
        sector: `ASA ${block.asa}`,
        sizeM2: size,
        priceCents: size * PRICE_PER_M2_CENTS,
        status: initialStatus(blockIndex * 5 + i),
        svgShapeId: code,
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

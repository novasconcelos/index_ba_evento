import type { StandStatus } from "@/lib/enums";
import { shelfPack, type PackRegion } from "@/lib/venue/stand-scale";

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
  hotspot: string; // JSON {x,y,w,h} normalizado (0..1) sobre o mapa do pavilhão
}

// Regiões das asas sobre a cena vetorial do pavilhão (lib/venue/index-pavilion),
// em coords 0..1. `slope` desloca o Y ao longo da largura para acompanhar a
// inclinação das asas (≈0.177 px/px no viewBox 1600×760 → 0.11 normalizado na
// largura de cada região). Os stands são empacotados em prateleiras pelo
// shelfPack (lib/venue/stand-scale), com largura proporcional aos m².
const ASA_REGIONS: Record<string, PackRegion> = {
  // Asa esquerda (desce em direção ao centro): ASA A — começa após o Auditório.
  A: { x0: 0.135, x1: 0.43, y0: 0.20, y1: 0.56, slope: 0.11 },
  // Asa direita (sobe em direção à direita): ASA B — termina antes da Cozinha Show.
  B: { x0: 0.58, x1: 0.865, y0: 0.34, y1: 0.56, slope: -0.11 },
  // Centro (foyer): entre o Lounge e o Credenciamento.
  FOYER: { x0: 0.445, x1: 0.555, y0: 0.50, y1: 0.63, slope: 0 },
};

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

export function buildSampleMap(): StandSpec[] {
  const stands: StandSpec[] = [];

  // 1) Monta os stands (sem hotspot ainda), preservando a ordem por asa.
  BLOCKS.forEach((block, blockIndex) => {
    for (let i = 0; i < block.count; i++) {
      const n = i + 1;
      const code = `${block.sectorLetter}${n}`;
      const size = SIZES[i % SIZES.length];

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
        hotspot: "", // preenchido no passo 2
      });
    }
  });

  // 2) Empacota por asa: largura proporcional aos m², em prateleiras.
  const byAsa = new Map<string, StandSpec[]>();
  for (const s of stands) {
    if (!byAsa.has(s.sector)) byAsa.set(s.sector, []);
    byAsa.get(s.sector)!.push(s);
  }
  for (const [asa, group] of byAsa) {
    const region = ASA_REGIONS[asa] ?? ASA_REGIONS.A;
    const packed = shelfPack(
      group.map((s) => ({ id: s.code, sizeM2: s.sizeM2 })),
      region,
    );
    for (const s of group) s.hotspot = JSON.stringify(packed[s.code]);
  }

  return stands;
}

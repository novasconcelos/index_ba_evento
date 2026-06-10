// Cena-base vetorial do pavilhão do INDEX (estilo isométrico 2.5D), usada como
// fundo do mapa público e do editor de hotspots do admin. Desenhada em um
// viewBox fixo; as coordenadas normalizadas (0..1) dos hotspots são convertidas
// para este espaço multiplicando por VIEW_W / VIEW_H.

export const VIEW_W = 1600;
export const VIEW_H = 760;

// Inclinação das asas em px de Y por px de X (asas formam um "V" raso com o
// vale no centro, como o pavilhão real). Esquerda desce para o centro (+),
// direita sobe para fora (−).
export const WING_SLOPE_PX = 0.177;

// Slope a aplicar num bloco de stand, a partir da ASA (sector) ou, na falta
// dela, da posição X do centro do hotspot (0..1).
export function slopeFor(sector: string | null | undefined, cx: number): number {
  if (sector === "A") return WING_SLOPE_PX;
  if (sector === "B") return -WING_SLOPE_PX;
  if (sector === "FOYER") return 0;
  if (cx < 0.44) return WING_SLOPE_PX;
  if (cx > 0.56) return -WING_SLOPE_PX;
  return 0;
}

// Escurece/clareia uma cor hex (#rrggbb) multiplicando os canais por `f`.
export function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * f)));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// Pontos de interesse fixos (badges numerados na cena + legenda em HTML).
// Coordenadas em px do viewBox.
export const POIS: { n: number; label: string; x: number; y: number }[] = [
  { n: 1, label: "Credenciamento", x: 800, y: 478 },
  { n: 2, label: "Auditório Principal", x: 129, y: 118 },
  { n: 3, label: "Cozinha Show", x: 1471, y: 148 },
  { n: 4, label: "Lounge INDEX", x: 800, y: 230 },
  { n: 5, label: "Arena de Negócios", x: 480, y: 198 },
  { n: 6, label: "Praça de Alimentação", x: 1248, y: 478 },
];

/* Geometria das asas (px). Slope das bordas = WING_SLOPE_PX. */
const K = WING_SLOPE_PX;
// Asa esquerda (ASA A): desce da esquerda para o centro.
const LW = { x0: 48, x1: 736, yTop0: 99, yBot0: 471 };
// Asa direita (ASA B): espelhada.
const RW = { x0: 864, x1: 1552, yTop1: 99, yBot1: 471 };
// Foyer central.
const FY = { x0: 704, x1: 896, yTop: 206, yBot: 623 };

const WALL_H = 26;

const leftFloor = `${LW.x0},${LW.yTop0} ${LW.x1},${LW.yTop0 + K * (LW.x1 - LW.x0)} ${LW.x1},${LW.yBot0 + K * (LW.x1 - LW.x0)} ${LW.x0},${LW.yBot0}`;
const rightFloor = `${RW.x0},${RW.yTop1 + K * (RW.x1 - RW.x0)} ${RW.x1},${RW.yTop1} ${RW.x1},${RW.yBot1} ${RW.x0},${RW.yBot1 + K * (RW.x1 - RW.x0)}`;
const foyerFloor = `${FY.x0},${FY.yTop} ${FY.x1},${FY.yTop} ${FY.x1},${FY.yBot} ${FY.x0},${FY.yBot}`;

const leftWall = `${LW.x0},${LW.yTop0 - WALL_H} ${LW.x1},${LW.yTop0 + K * (LW.x1 - LW.x0) - WALL_H} ${LW.x1},${LW.yTop0 + K * (LW.x1 - LW.x0)} ${LW.x0},${LW.yTop0}`;
const rightWall = `${RW.x0},${RW.yTop1 + K * (RW.x1 - RW.x0) - WALL_H} ${RW.x1},${RW.yTop1 - WALL_H} ${RW.x1},${RW.yTop1} ${RW.x0},${RW.yTop1 + K * (RW.x1 - RW.x0)}`;
const foyerWall = `${FY.x0},${FY.yTop - WALL_H} ${FY.x1},${FY.yTop - WALL_H} ${FY.x1},${FY.yTop} ${FY.x0},${FY.yTop}`;

// Paredes laterais (extremidades oeste/leste), para dar profundidade.
const westWall = `${LW.x0 - 10},${LW.yTop0 - WALL_H - 6} ${LW.x0},${LW.yTop0 - WALL_H} ${LW.x0},${LW.yBot0} ${LW.x0 - 10},${LW.yBot0 - 6}`;
const eastWall = `${RW.x1 + 10},${RW.yTop1 - WALL_H - 6} ${RW.x1},${RW.yTop1 - WALL_H} ${RW.x1},${RW.yBot1} ${RW.x1 + 10},${RW.yBot1 - 6}`;

/* Bloco decorativo isométrico (estruturas fixas: auditório, lounge etc.). */
function Decor({
  x,
  y,
  w,
  h,
  k,
  fill,
  label,
  fontSize = 11,
  vertical = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  k: number;
  fill: string;
  label: string;
  fontSize?: number;
  vertical?: boolean;
}) {
  const E = 12;
  const drop = Math.abs(k) * w;
  const yL = y + (k > 0 ? 0 : drop);
  const yR = y + (k > 0 ? drop : 0);
  const ht = Math.max(10, h - E - drop);
  const cx = x + w / 2;
  const cy = (yL + yR) / 2 + ht / 2;
  return (
    <g>
      <polygon
        points={`${x},${yL + ht} ${x + w},${yR + ht} ${x + w},${yR + ht + E} ${x},${yL + ht + E}`}
        fill={shade(fill, 0.62)}
      />
      <polygon
        points={`${x},${yL} ${x + w},${yR} ${x + w},${yR + ht} ${x},${yL + ht}`}
        fill={fill}
        stroke={shade(fill, 0.72)}
        strokeWidth={1}
      />
      <text
        x={cx}
        y={cy + fontSize * 0.35}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={700}
        fill="#ffffff"
        opacity={0.92}
        pointerEvents="none"
        transform={vertical ? `rotate(-90 ${cx} ${cy})` : undefined}
        style={{ letterSpacing: 1 }}
      >
        {label}
      </text>
    </g>
  );
}

/* Badge numerado de POI (também usado pela planta 2D). */
export function PoiBadge({ n, x, y, r = 15 }: { n: number; x: number; y: number; r?: number }) {
  return (
    <g pointerEvents="none">
      <circle cx={x} cy={y} r={r} fill="#1f2937" stroke="#ffffff" strokeWidth={2.5} />
      <text
        x={x}
        y={y + r * 0.33}
        textAnchor="middle"
        fontSize={r * 0.93}
        fontWeight={800}
        fill="#ffffff"
      >
        {String(n).padStart(2, "0")}
      </text>
    </g>
  );
}

// Cena-base (sem hooks — pode ser usada em server e client components).
// Renderizar dentro de um <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>.
export function PavilionScene() {
  return (
    <g>
      <defs>
        <linearGradient id="pav-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#eef7f8" />
          <stop offset="100%" stopColor="#fbfcfe" />
        </linearGradient>
        <filter id="pav-blur" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      {/* fundo */}
      <rect x={4} y={4} width={VIEW_W - 8} height={VIEW_H - 8} rx={18} fill="url(#pav-bg)" stroke="#e2e8f0" />

      {/* sombra do prédio */}
      <g filter="url(#pav-blur)" transform="translate(8 18)" fill="#0f172a" opacity={0.13}>
        <polygon points={leftFloor} />
        <polygon points={rightFloor} />
        <polygon points={foyerFloor} />
      </g>

      {/* pisos das asas */}
      <polygon points={leftFloor} fill="#dfe3ea" stroke="#b6bcc9" strokeWidth={1.5} />
      <polygon points={rightFloor} fill="#dfe3ea" stroke="#b6bcc9" strokeWidth={1.5} />

      {/* paredes de fundo */}
      <polygon points={leftWall} fill="#b9bfcc" />
      <polygon points={rightWall} fill="#b9bfcc" />
      <polygon points={westWall} fill="#9aa1b1" />
      <polygon points={eastWall} fill="#9aa1b1" />

      {/* foyer central */}
      <polygon points={foyerWall} fill="#aab0bf" />
      <polygon points={foyerFloor} fill="#e8ebf1" stroke="#b6bcc9" strokeWidth={1.5} />

      {/* rótulos das áreas (atrás dos stands) */}
      <text x={300} y={330} fontSize={46} fontWeight={800} fill="#2d2a8c" opacity={0.13} transform="rotate(10 300 330)" style={{ letterSpacing: 6 }}>
        ASA A
      </text>
      <text x={1230} y={330} fontSize={46} fontWeight={800} fill="#2d2a8c" opacity={0.13} transform="rotate(-10 1230 330)" style={{ letterSpacing: 6 }}>
        ASA B
      </text>
      <text x={800} y={420} textAnchor="middle" fontSize={22} fontWeight={800} fill="#2d2a8c" opacity={0.2} style={{ letterSpacing: 5 }}>
        FOYER
      </text>

      {/* estruturas fixas */}
      <Decor x={64} y={130} w={130} h={190} k={WING_SLOPE_PX} fill="#7a7a46" label="AUDITÓRIO" fontSize={13} vertical />
      <Decor x={1406} y={160} w={130} h={140} k={-WING_SLOPE_PX} fill="#0e7490" label="COZINHA SHOW" fontSize={10} vertical />
      <Decor x={730} y={244} w={140} h={58} k={0} fill="#5b8a72" label="LOUNGE" fontSize={11} />
      <Decor x={716} y={500} w={168} h={48} k={0} fill="#2d2a8c" label="CREDENCIAMENTO" fontSize={9.5} />

      {/* entrada */}
      <polygon points={`788,614 812,614 800,600`} fill="#c6e84d" stroke="#9bbe27" strokeWidth={1} />
      <rect x={740} y={623} width={120} height={10} rx={3} fill="#c3c9d4" />
      <rect x={746} y={636} width={108} height={9} rx={3} fill="#cdd2dc" />
      <rect x={752} y={648} width={96} height={8} rx={3} fill="#d7dbe3" />
      <text x={800} y={678} textAnchor="middle" fontSize={16} fontWeight={800} fill="#2d2a8c" style={{ letterSpacing: 4 }}>
        ENTRADA
      </text>

      {/* badges de POI */}
      {POIS.map((p) => (
        <PoiBadge key={p.n} n={p.n} x={p.x} y={p.y} />
      ))}
    </g>
  );
}

// Planta baixa 2D (top-down) do pavilhão do INDEX — variante "operacional" da
// cena isométrica (lib/venue/index-pavilion.tsx). Mesmo viewBox e mesmas regiões
// das asas, para que os hotspots normalizados (0..1) caiam nos mesmos lugares.
// Traço técnico de planta: contornos finos, sem extrusão, sem sombra, sem slope.

import { VIEW_W, VIEW_H, WING_SLOPE_PX, POIS, PoiBadge } from "@/lib/venue/index-pavilion";

const K = WING_SLOPE_PX;
// Mesma geometria em planta da cena isométrica.
const LW = { x0: 48, x1: 736, yTop0: 99, yBot0: 471 };
const RW = { x0: 864, x1: 1552, yTop1: 99, yBot1: 471 };
const FY = { x0: 704, x1: 896, yTop: 206, yBot: 623 };

const leftFloor = `${LW.x0},${LW.yTop0} ${LW.x1},${LW.yTop0 + K * (LW.x1 - LW.x0)} ${LW.x1},${LW.yBot0 + K * (LW.x1 - LW.x0)} ${LW.x0},${LW.yBot0}`;
const rightFloor = `${RW.x0},${RW.yTop1 + K * (RW.x1 - RW.x0)} ${RW.x1},${RW.yTop1} ${RW.x1},${RW.yBot1} ${RW.x0},${RW.yBot1 + K * (RW.x1 - RW.x0)}`;
const foyerFloor = `${FY.x0},${FY.yTop} ${FY.x1},${FY.yTop} ${FY.x1},${FY.yBot} ${FY.x0},${FY.yBot}`;

/* Estrutura fixa em planta: retângulo flat com label. */
function Decor2D({
  x,
  y,
  w,
  h,
  fill,
  label,
  fontSize = 11,
  vertical = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  label: string;
  fontSize?: number;
  vertical?: boolean;
}) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={3} fill={fill} fillOpacity={0.18} stroke={fill} strokeWidth={1.5} />
      <text
        x={cx}
        y={cy + fontSize * 0.35}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={700}
        fill={fill}
        pointerEvents="none"
        transform={vertical ? `rotate(-90 ${cx} ${cy})` : undefined}
        style={{ letterSpacing: 1 }}
      >
        {label}
      </text>
    </g>
  );
}

// Cena-base 2D (sem hooks — server e client). Renderizar dentro de um
// <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>.
export function PavilionScene2D() {
  return (
    <g>
      <defs>
        {/* grid sutil de planta técnica */}
        <pattern id="pav2d-grid" width={40} height={40} patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" strokeWidth={1} />
        </pattern>
      </defs>

      {/* fundo */}
      <rect x={4} y={4} width={VIEW_W - 8} height={VIEW_H - 8} rx={18} fill="#fbfcfe" stroke="#e2e8f0" />
      <rect x={4} y={4} width={VIEW_W - 8} height={VIEW_H - 8} rx={18} fill="url(#pav2d-grid)" opacity={0.6} />

      {/* pisos das asas e foyer — contorno técnico */}
      <polygon points={leftFloor} fill="#ffffff" stroke="#94a3b8" strokeWidth={2} />
      <polygon points={rightFloor} fill="#ffffff" stroke="#94a3b8" strokeWidth={2} />
      <polygon points={foyerFloor} fill="#f8fafc" stroke="#94a3b8" strokeWidth={2} />

      {/* rótulos das áreas (horizontais, estilo planta) */}
      <text x={300} y={320} fontSize={42} fontWeight={800} fill="#2d2a8c" opacity={0.1} style={{ letterSpacing: 6 }}>
        ASA A
      </text>
      <text x={1230} y={320} fontSize={42} fontWeight={800} fill="#2d2a8c" opacity={0.1} style={{ letterSpacing: 6 }}>
        ASA B
      </text>
      <text x={800} y={420} textAnchor="middle" fontSize={20} fontWeight={800} fill="#2d2a8c" opacity={0.16} style={{ letterSpacing: 5 }}>
        FOYER
      </text>

      {/* estruturas fixas */}
      <Decor2D x={64} y={130} w={130} h={190} fill="#7a7a46" label="AUDITÓRIO" fontSize={13} vertical />
      <Decor2D x={1406} y={160} w={130} h={140} fill="#0e7490" label="COZINHA SHOW" fontSize={10} vertical />
      <Decor2D x={730} y={244} w={140} h={58} fill="#5b8a72" label="LOUNGE" fontSize={11} />
      <Decor2D x={716} y={500} w={168} h={48} fill="#2d2a8c" label="CREDENCIAMENTO" fontSize={9.5} />

      {/* entrada */}
      <polygon points={`788,614 812,614 800,600`} fill="#c6e84d" stroke="#9bbe27" strokeWidth={1} />
      <text x={800} y={648} textAnchor="middle" fontSize={16} fontWeight={800} fill="#2d2a8c" style={{ letterSpacing: 4 }}>
        ENTRADA
      </text>

      {/* badges de POI (menores que no isométrico, para densidade) */}
      {POIS.map((p) => (
        <PoiBadge key={p.n} n={p.n} x={p.x} y={p.y} r={12} />
      ))}
    </g>
  );
}

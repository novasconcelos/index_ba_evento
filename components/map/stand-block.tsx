// Bloco isométrico de stand renderizado dentro do SVG do mapa vetorial.
// Recebe o bounding-box já em px do viewBox; o slope inclina a face superior
// para acompanhar a asa do pavilhão (ver lib/venue/index-pavilion.tsx).

import type { StandStatus } from "@/lib/enums";
import { standStatusColor, standStatusLabel } from "@/lib/labels";
import { shade } from "@/lib/venue/index-pavilion";

export function StandBlock({
  code,
  status,
  x,
  y,
  w,
  h,
  slope,
  selected = false,
  focused = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  code: string;
  status: StandStatus;
  x: number;
  y: number;
  w: number;
  h: number;
  slope: number;
  selected?: boolean;
  focused?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const E = Math.max(5, Math.min(10, h * 0.28)); // extrusão (altura do bloco)
  const drop = Math.abs(slope) * w; // queda vertical da face ao longo da largura
  const yL = y + (slope > 0 ? 0 : drop);
  const yR = y + (slope > 0 ? drop : 0);
  const ht = Math.max(8, h - E - drop);

  const base = selected ? "#2d2a8c" : standStatusColor[status];
  const highlight = selected || focused;
  const stroke = highlight ? "#c6e84d" : shade(base, 0.72);
  const fontSize = Math.max(8, Math.min(15, Math.min(w * 0.32, ht * 0.62)));
  const available = status === "AVAILABLE";

  return (
    <g
      data-stand="1"
      role="button"
      aria-label={`Stand ${code} — ${standStatusLabel[status]}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="transition-[filter] hover:brightness-110"
      opacity={status === "BLOCKED" || status === "CEDED" ? 0.85 : 1}
      style={{ cursor: available || selected ? "pointer" : "not-allowed" }}
    >
      {/* face frontal (extrusão) */}
      <polygon
        points={`${x},${yL + ht} ${x + w},${yR + ht} ${x + w},${yR + ht + E} ${x},${yL + ht + E}`}
        fill={shade(base, 0.6)}
      />
      {/* face superior */}
      <polygon
        points={`${x},${yL} ${x + w},${yR} ${x + w},${yR + ht} ${x},${yL + ht}`}
        fill={base}
        stroke={stroke}
        strokeWidth={highlight ? 2.5 : 1}
      />
      <text
        x={x + w / 2}
        y={(yL + yR) / 2 + ht / 2 + fontSize * 0.35}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={700}
        fill="#ffffff"
        pointerEvents="none"
      >
        {code}
      </text>
    </g>
  );
}

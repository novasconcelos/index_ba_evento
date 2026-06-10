// Stand em planta 2D (top-down) — variante flat do StandBlock, usada pela
// página /mapa2. Retângulo simples sem extrusão nem slope; o label do código
// é omitido quando o bloco é pequeno demais (alta densidade → código via
// tooltip/zoom), que é o que faz a planta 2D escalar para centenas de stands.

import type { StandStatus } from "@/lib/enums";
import { standStatusColor, standStatusLabel } from "@/lib/labels";
import { shade } from "@/lib/venue/index-pavilion";

const MIN_LABEL_W = 28; // px do viewBox abaixo dos quais o código não é desenhado

export function StandFlat({
  code,
  status,
  x,
  y,
  w,
  h,
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
  selected?: boolean;
  focused?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const base = selected ? "#2d2a8c" : standStatusColor[status];
  const highlight = selected || focused;
  const stroke = highlight ? "#c6e84d" : shade(base, 0.7);
  const fontSize = Math.max(8, Math.min(14, Math.min(w * 0.32, h * 0.5)));
  const available = status === "AVAILABLE";
  const showLabel = w >= MIN_LABEL_W;

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
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={2}
        fill={base}
        fillOpacity={0.85}
        stroke={stroke}
        strokeWidth={highlight ? 2.5 : 1}
      />
      {showLabel && (
        <text
          x={x + w / 2}
          y={y + h / 2 + fontSize * 0.35}
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight={700}
          fill="#ffffff"
          pointerEvents="none"
        >
          {code}
        </text>
      )}
    </g>
  );
}

// Versionamento do mapa (modelo MapVersion). O layout de uma versão é um JSON
// { [standCode]: Hotspot | null } — chaveado pelo CÓDIGO do stand (único por
// evento e estável entre recriações), não pelo id. Stand.hotspot continua a
// fonte viva do mapa público; a ativação copia o layout para os stands
// aplicáveis (somente AVAILABLE — vendidos/reservados etc. são protegidos).

import type { Hotspot } from "@/lib/hotspot";
import type { StandStatus } from "@/lib/enums";

export type LayoutMap = Record<string, Hotspot | null>;

export function parseLayout(json: string | null | undefined): LayoutMap {
  if (!json) return {};
  try {
    const o = JSON.parse(json);
    if (o && typeof o === "object" && !Array.isArray(o)) return o as LayoutMap;
  } catch {
    // ignora JSON inválido
  }
  return {};
}

export function serializeLayout(layout: LayoutMap): string {
  return JSON.stringify(layout);
}

// Status cujo hotspot NÃO pode ser alterado pela ativação de uma versão
// ("só os disponíveis" podem mudar de posição).
export const PROTECTED_STATUSES: StandStatus[] = [
  "RESERVED",
  "SOLD",
  "SPONSOR",
  "CEDED",
  "BLOCKED",
];

export function isProtected(status: string): boolean {
  return (PROTECTED_STATUSES as string[]).includes(status);
}

export interface ActivationPlan {
  applied: string[]; // codes que receberão o layout da versão
  skipped: { code: string; status: string }[]; // protegidos — mantêm a posição atual
  missing: string[]; // codes do layout que não existem mais no evento
}

// Plano de ativação a partir dos stands ATUAIS (status frescos) e do layout da
// versão. Função pura: usada na página (preview) e dentro da transação de
// ativação (decisão final).
export function computeActivationPlan(
  stands: { code: string; status: string }[],
  layout: LayoutMap,
): ActivationPlan {
  const byCode = new Map(stands.map((s) => [s.code, s.status]));
  const applied: string[] = [];
  const skipped: { code: string; status: string }[] = [];
  const missing: string[] = [];

  for (const code of Object.keys(layout)) {
    const status = byCode.get(code);
    if (status === undefined) {
      missing.push(code);
    } else if (isProtected(status)) {
      skipped.push({ code, status });
    } else {
      applied.push(code);
    }
  }

  return { applied, skipped, missing };
}

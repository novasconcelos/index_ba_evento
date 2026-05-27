import { prisma } from "@/lib/db";
import type { StandOptionKind } from "@/lib/enums";

/**
 * Retorna os valores ativos de uma lista cadastrável (Tipo, ASA, Localização),
 * ordenados por sortOrder e depois por valor. Usado no formulário de stand e no
 * mapa público.
 */
export async function getStandOptions(
  kind: StandOptionKind,
): Promise<string[]> {
  const rows = await prisma.standOption.findMany({
    where: { kind, active: true },
    orderBy: [{ sortOrder: "asc" }, { value: "asc" }],
    select: { value: true },
  });
  return rows.map((r) => r.value);
}

/** Busca as três listas de uma vez (para páginas que precisam de todas). */
export async function getAllStandOptions(): Promise<{
  tipos: string[];
  asas: string[];
  localizacoes: string[];
}> {
  const [tipos, asas, localizacoes] = await Promise.all([
    getStandOptions("TIPO"),
    getStandOptions("ASA"),
    getStandOptions("LOCALIZACAO"),
  ]);
  return { tipos, asas, localizacoes };
}

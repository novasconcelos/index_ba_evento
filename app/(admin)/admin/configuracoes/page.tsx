import { Trash2, Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { STAND_OPTION_KINDS, type StandOptionKind } from "@/lib/enums";
import { standOptionKindLabel, standOptionKindSingular } from "@/lib/labels";
import { createStandOption, deleteStandOption } from "./actions";

export const dynamic = "force-dynamic";

const HINTS: Record<StandOptionKind, string> = {
  TIPO: "Ex.: Padrão, Tech, Piso, Padrão com depósito, Restaurante…",
  ASA: "Ex.: A, B, FOYER",
  LOCALIZACAO: "Ex.: H31, N6, M37 — código de posição do stand na planta",
};

export default async function ConfiguracoesPage() {
  await requireAdmin();

  const all = await prisma.standOption.findMany({
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }, { value: "asc" }],
  });
  const byKind = (kind: StandOptionKind) => all.filter((o) => o.kind === kind);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Configurações</h1>
        <p className="text-sm text-gray-600">
          Listas usadas no cadastro de stands e na seleção do mapa: Tipo, ASA e
          Localização.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {STAND_OPTION_KINDS.map((kind) => {
          const options = byKind(kind);
          return (
            <Card key={kind}>
              <CardHeader>
                <CardTitle>{standOptionKindLabel[kind]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-gray-400">{HINTS[kind]}</p>

                {options.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-center text-xs text-gray-500">
                    Nenhum valor cadastrado.
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                    {options.map((o) => (
                      <li
                        key={o.id}
                        className="flex items-center justify-between px-3 py-2 text-sm"
                      >
                        <span className="font-medium text-gray-800">
                          {o.value}
                        </span>
                        <form action={deleteStandOption}>
                          <input type="hidden" name="id" value={o.id} />
                          <button
                            className="text-gray-400 hover:text-red-600"
                            title="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )}

                <form action={createStandOption} className="flex items-center gap-2">
                  <input type="hidden" name="kind" value={kind} />
                  <Input
                    name="value"
                    required
                    placeholder={`Novo ${standOptionKindSingular[kind]}`}
                    className="h-9"
                  />
                  <Button type="submit" size="sm" variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

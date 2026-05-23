import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { formatBRL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createGoal, deleteGoal } from "./actions";

export const dynamic = "force-dynamic";

export default async function MetasPage() {
  await requireAdmin();
  const goals = await prisma.goal.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">Metas</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Metas cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma meta.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {goals.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{g.title}</p>
                      <p className="text-gray-500">
                        {g.metric === "REVENUE"
                          ? `Receita: ${formatBRL(g.targetValue)}`
                          : `Stands vendidos: ${g.targetValue}`}
                      </p>
                    </div>
                    <form action={deleteGoal}>
                      <input type="hidden" name="id" value={g.id} />
                      <button className="text-gray-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nova meta</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createGoal} className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input id="title" name="title" required />
              </div>
              <div>
                <Label htmlFor="metric">Tipo</Label>
                <Select id="metric" name="metric" defaultValue="REVENUE">
                  <option value="REVENUE">Receita (R$)</option>
                  <option value="STANDS_SOLD">Stands vendidos (qtd)</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="target">Alvo</Label>
                <Input
                  id="target"
                  name="target"
                  placeholder="Ex.: R$ 2.000.000,00 ou 40"
                  required
                />
              </div>
              <Button type="submit">Adicionar meta</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { getActiveEvent } from "@/lib/event";
import { formatBRL } from "@/lib/utils";
import {
  standStatusLabel,
  standStatusColor,
  orderStatusLabel,
  orderStatusColor,
  captadorLabel,
} from "@/lib/labels";
import type { StandStatus, OrderStatus, Captador } from "@/lib/enums";
import { StatCard } from "@/components/admin/stat-card";
import {
  StatusDonut,
  StagesBar,
  type Slice,
} from "@/components/admin/dashboard-charts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdmin();
  const event = await getActiveEvent();

  const [
    totalExhibitors,
    standsGroup,
    ordersGroup,
    captadorGroup,
    revenueAgg,
    pipelineAgg,
    goals,
  ] = await Promise.all([
    prisma.exhibitor.count(),
    prisma.stand.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.exhibitor.groupBy({ by: ["captador"], _count: { _all: true } }),
    prisma.order.aggregate({
      where: { status: "PAID" },
      _sum: { totalCents: true },
    }),
    prisma.order.aggregate({
      where: {
        status: { in: ["RESERVED", "CONTRACT_PENDING", "SIGNED", "PAYMENT_PENDING"] },
      },
      _sum: { totalCents: true },
    }),
    prisma.goal.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const standCount = (s: StandStatus) =>
    standsGroup.find((g) => g.status === s)?._count._all ?? 0;
  const totalStands = standsGroup.reduce((a, g) => a + g._count._all, 0);
  const soldStands = standCount("SOLD");
  const revenuePaid = revenueAgg._sum.totalCents ?? 0;
  const pipeline = pipelineAgg._sum.totalCents ?? 0;

  const standSlices: Slice[] = standsGroup.map((g) => ({
    label: standStatusLabel[g.status as StandStatus] ?? g.status,
    value: g._count._all,
    color: standStatusColor[g.status as StandStatus] ?? "#94a3b8",
  }));

  const stageOrder: OrderStatus[] = [
    "RESERVED",
    "CONTRACT_PENDING",
    "SIGNED",
    "PAYMENT_PENDING",
    "PAID",
    "CANCELLED",
  ];
  const stageSlices: Slice[] = stageOrder
    .map((s) => ({
      label: orderStatusLabel[s],
      value: ordersGroup.find((g) => g.status === s)?._count._all ?? 0,
      color: orderStatusColor[s],
    }))
    .filter((s) => s.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-navy">Dashboard</h1>
        <p className="text-sm text-gray-600">
          {event?.name ?? "Nenhum evento ativo"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Expositores" value={String(totalExhibitors)} />
        <StatCard
          label="Stands vendidos"
          value={`${soldStands}/${totalStands}`}
        />
        <StatCard
          label="Receita confirmada"
          value={formatBRL(revenuePaid)}
          hint="Pedidos pagos"
        />
        <StatCard
          label="Em negociação"
          value={formatBRL(pipeline)}
          hint="Reservas/contratos em aberto"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de stands</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusDonut data={standSlices} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Etapas das negociações</CardTitle>
          </CardHeader>
          <CardContent>
            {stageSlices.length > 0 ? (
              <StagesBar data={stageSlices} />
            ) : (
              <p className="text-sm text-gray-500">Sem pedidos ainda.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Progresso das metas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.length === 0 && (
              <p className="text-sm text-gray-500">
                Nenhuma meta cadastrada. Defina metas em “Metas”.
              </p>
            )}
            {goals.map((goal) => {
              const current =
                goal.metric === "REVENUE" ? revenuePaid : soldStands;
              const pct = Math.min(
                100,
                Math.round((current / Math.max(1, goal.targetValue)) * 100),
              );
              const fmt = (v: number) =>
                goal.metric === "REVENUE" ? formatBRL(v) : String(v);
              return (
                <div key={goal.id}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{goal.title}</span>
                    <span className="text-gray-500">
                      {fmt(current)} / {fmt(goal.targetValue)} ({pct}%)
                    </span>
                  </div>
                  <div className="mt-1 h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-brand-teal"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por captação</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-gray-100 text-sm">
              {captadorGroup.map((g) => (
                <li
                  key={g.captador ?? "none"}
                  className="flex justify-between py-2"
                >
                  <span>
                    {g.captador
                      ? captadorLabel[g.captador as Captador] ?? g.captador
                      : "Não informado"}
                  </span>
                  <span className="font-medium">{g._count._all}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

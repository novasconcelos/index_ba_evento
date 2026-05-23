import Link from "next/link";
import { getActiveEvent } from "@/lib/event";
import { prisma } from "@/lib/db";
import { formatBRL } from "@/lib/utils";
import { IndexLogo } from "@/components/brand/index-logo";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const event = await getActiveEvent();
  const stats = event
    ? {
        total: await prisma.stand.count({ where: { eventId: event.id } }),
        available: await prisma.stand.count({
          where: { eventId: event.id, status: "AVAILABLE" },
        }),
        from: await prisma.stand.aggregate({
          where: { eventId: event.id, status: "AVAILABLE" },
          _min: { priceCents: true },
        }),
      }
    : null;

  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="bg-index-gradient relative overflow-hidden rounded-3xl p-8 sm:p-12">
        <IndexLogo
          className="pointer-events-none absolute -right-10 top-1/2 hidden h-80 w-80 -translate-y-1/2 opacity-30 sm:block"
          primary="#2d2a8c"
          accent="#ffffff"
        />
        <div className="relative max-w-2xl">
          <p className="inline-block rounded-full bg-brand-navy/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-lime">
            {event?.name ?? "INDEX 2027"} · Centro de Convenções · Salvador
          </p>
          <h1 className="mt-4 text-4xl font-extrabold uppercase leading-none text-brand-navy sm:text-6xl">
            O maior evento da indústria do Nordeste
          </h1>
          <p className="mt-4 max-w-xl text-lg font-medium text-brand-indigo-dark">
            Reserve seu stand direto no mapa do evento: escolha a área, cadastre
            sua empresa, assine o contrato e receba o link de pagamento — tudo
            online.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/mapa"
              className="rounded-full bg-brand-navy px-7 py-3.5 font-bold text-white shadow-lg transition-colors hover:bg-brand-navy-light"
            >
              Reservar meu stand
            </Link>
            <Link
              href="/mapa"
              className="rounded-full bg-white px-7 py-3.5 font-bold text-brand-navy shadow-lg transition-colors hover:bg-brand-lime"
            >
              Ver mapa do evento
            </Link>
          </div>
        </div>
      </section>

      {/* INDEX EM NÚMEROS */}
      <section>
        <h2 className="text-3xl font-extrabold uppercase text-brand-navy">
          Index em números
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <BigStat
            value="185 mi"
            label="em negócios gerados"
            variant="lime"
          />
          <BigStat
            value="40.000"
            label="visitantes em 3 dias"
            variant="navy"
          />
          <BigStat value="+400" label="expositores" variant="navy" />
        </div>
      </section>

      {/* DISPONIBILIDADE (dados reais) */}
      {stats && (
        <section>
          <h2 className="text-3xl font-extrabold uppercase text-brand-navy">
            Disponibilidade
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <LiveStat label="Stands no evento" value={String(stats.total)} />
            <LiveStat
              label="Disponíveis agora"
              value={String(stats.available)}
              highlight
            />
            <LiveStat
              label="A partir de"
              value={formatBRL(stats.from._min.priceCents ?? 0)}
            />
          </div>
        </section>
      )}

      {/* COMO FUNCIONA */}
      <section>
        <h2 className="text-3xl font-extrabold uppercase text-brand-navy">
          Como funciona
        </h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-3">
          <Step
            n={1}
            title="Selecione no mapa"
            text="Clique nos stands disponíveis e monte sua reserva como num e-commerce."
          />
          <Step
            n={2}
            title="Cadastre sua empresa"
            text="CNPJ, responsável técnico e marca em um único formulário."
          />
          <Step
            n={3}
            title="Assine e pague"
            text="Contrato gerado automaticamente, assinatura eletrônica e link de pagamento."
          />
        </div>
      </section>

      {/* CTA MAPA */}
      <section className="relative overflow-hidden rounded-3xl bg-brand-navy p-8 text-white sm:p-12">
        <IndexLogo
          className="pointer-events-none absolute -right-8 -top-8 hidden h-56 w-56 opacity-20 sm:block"
          primary="#ffffff"
          accent="#c6e84d"
        />
        <div className="relative max-w-xl">
          <h2 className="text-3xl font-extrabold uppercase">
            Garanta seu espaço
          </h2>
          <p className="mt-3 text-white/90">
            Os melhores pontos vão rápido. Veja o mapa, escolha sua área e
            reserve agora.
          </p>
          <Link
            href="/mapa"
            className="mt-6 inline-block rounded-full bg-brand-lime px-7 py-3.5 font-bold text-brand-navy hover:bg-brand-lime-dark"
          >
            Abrir o mapa do evento
          </Link>
        </div>
      </section>
    </div>
  );
}

function BigStat({
  value,
  label,
  variant,
}: {
  value: string;
  label: string;
  variant: "lime" | "navy";
}) {
  const styles =
    variant === "lime"
      ? "bg-brand-lime text-brand-navy"
      : "bg-brand-navy text-white";
  return (
    <div className={`rounded-2xl p-6 ${styles}`}>
      <p className="text-4xl font-extrabold leading-none sm:text-5xl">{value}</p>
      <p className="mt-2 text-sm font-semibold uppercase tracking-wide">
        {label}
      </p>
    </div>
  );
}

function LiveStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-5 ${
        highlight ? "border-brand-green" : "border-gray-200"
      }`}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          highlight ? "text-brand-teal-dark" : "text-brand-navy"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Step({ n, title, text }: { n: number; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy font-bold text-white">
        {n}
      </span>
      <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{text}</p>
    </div>
  );
}

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { OrderStatus, StandStatus } from "../lib/enums";
import { buildSampleMap } from "../lib/sample-map";

const prisma = new PrismaClient();

interface OrderSpec {
  exhibitor: {
    nomeFantasia: string;
    razaoSocial?: string;
    cnpj?: string;
    contato?: string;
    telefone?: string;
    email: string;
    segment?: string;
    captador?: "FIEB" | "SEBRAE" | "BAHIA_EVENTOS" | "OUTRO";
    indicacao?: string;
  };
  status: OrderStatus;
  standCount: number;
}

const ORDER_SPECS: OrderSpec[] = [
  {
    exhibitor: {
      nomeFantasia: "OLEOPLAN",
      razaoSocial: "Oleoplan Indústria de Óleos S.A.",
      cnpj: "12.345.678/0001-90",
      contato: "Leonardo Zilio",
      telefone: "61 99925-8221",
      email: "leonardo.zilio@oleoplan.com.br",
      segment: "Alimentos e Bebidas",
      captador: "FIEB",
      indicacao: "FIEB",
    },
    status: "PAID",
    standCount: 3,
  },
  {
    exhibitor: {
      nomeFantasia: "PREFEITURA DE ILHÉUS",
      contato: "Paulo Ganem",
      telefone: "73 98815-4767",
      email: "pcganem@uol.com.br",
      segment: "Alimentos e Bebidas",
      captador: "SEBRAE",
      indicacao: "SEBRAE",
    },
    status: "PAID",
    standCount: 2,
  },
  {
    exhibitor: {
      nomeFantasia: "AIBA / ABAPA",
      contato: "Gustavo / Thiago",
      telefone: "77 9701-6573",
      email: "institucional@abapa.com.br",
      segment: "Agroindústria",
      captador: "FIEB",
      indicacao: "FIEB",
    },
    status: "PAYMENT_PENDING",
    standCount: 3,
  },
  {
    exhibitor: {
      nomeFantasia: "SISTEMA OCEB",
      contato: "Jefferson",
      telefone: "71 3056-8912",
      email: "rosemeire.brito@sescoopba.coop.br",
      segment: "Agroindústria",
      captador: "SEBRAE",
      indicacao: "SEBRAE",
    },
    status: "SIGNED",
    standCount: 2,
  },
  {
    exhibitor: {
      nomeFantasia: "PROJETO ORIGEM",
      contato: "Lila",
      telefone: "71 99971-6646",
      email: "lila.ribeiro@fieb.org.br",
      segment: "Alimentos e Bebidas",
      captador: "FIEB",
      indicacao: "BAHIA EVENTOS",
    },
    status: "CONTRACT_PENDING",
    standCount: 2,
  },
  {
    exhibitor: {
      nomeFantasia: "PREFEITURA DE VITÓRIA DA CONQUISTA",
      contato: "Marcelo",
      telefone: "77 99814-4249",
      email: "smde@pmvc.ba.gov.br",
      segment: "Institucional",
      captador: "SEBRAE",
      indicacao: "SEBRAE",
    },
    status: "RESERVED",
    standCount: 4,
  },
  {
    exhibitor: {
      nomeFantasia: "BISCOITO KI GOMA",
      contato: "Marcelo Gomes",
      telefone: "75 9 92640013",
      email: "gomesdealcantara@yahoo.com.br",
      segment: "Alimentos e Bebidas",
      captador: "FIEB",
      indicacao: "FIEB",
    },
    status: "RESERVED",
    standCount: 2,
  },
];

function standStatusForOrder(status: OrderStatus): StandStatus {
  return status === "RESERVED" || status === "CONTRACT_PENDING"
    ? "RESERVED"
    : "SOLD";
}

async function main() {
  console.log("Limpando dados...");
  await prisma.payment.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.brandAsset.deleteMany();
  await prisma.technicalResponsible.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.magicLinkToken.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.stand.deleteMany();
  await prisma.exhibitor.deleteMany();
  await prisma.event.deleteMany();
  await prisma.adminUser.deleteMany();

  console.log("Criando usuário admin...");
  const passwordHash = await bcrypt.hash("admin123", 10);
  await prisma.adminUser.create({
    data: {
      email: "admin@fieb.org.br",
      name: "Administrador",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Criando evento e planta (SVG)...");
  const { stands, svg } = buildSampleMap();
  const event = await prisma.event.create({
    data: {
      name: "INDEX 2027",
      slug: "index-2027",
      year: 2027,
      startDate: new Date("2027-05-05"),
      endDate: new Date("2027-05-07"),
      mapSvg: svg,
      active: true,
    },
  });

  console.log(`Criando ${stands.length} stands...`);
  await prisma.stand.createMany({
    data: stands.map((s) => ({ ...s, eventId: event.id })),
  });

  console.log("Criando expositores e pedidos de exemplo...");
  // Aloca stands AVAILABLE sequencialmente para os pedidos de exemplo.
  let cursor = 0;
  const availableStands = await prisma.stand.findMany({
    where: { eventId: event.id, status: "AVAILABLE" },
    orderBy: { code: "asc" },
  });

  for (const spec of ORDER_SPECS) {
    const picked = availableStands.slice(cursor, cursor + spec.standCount);
    cursor += spec.standCount;
    if (picked.length === 0) continue;

    const exhibitor = await prisma.exhibitor.create({ data: spec.exhibitor });
    const totalCents = picked.reduce((acc, s) => acc + s.priceCents, 0);
    const standStatus = standStatusForOrder(spec.status);

    const order = await prisma.order.create({
      data: {
        eventId: event.id,
        exhibitorId: exhibitor.id,
        status: spec.status,
        totalCents,
        items: {
          create: picked.map((s) => ({
            standId: s.id,
            code: s.code,
            priceCents: s.priceCents,
          })),
        },
        techResponsible: {
          create: {
            name: spec.exhibitor.contato ?? "Responsável Técnico",
            email: spec.exhibitor.email,
            phone: spec.exhibitor.telefone,
          },
        },
      },
    });

    await prisma.stand.updateMany({
      where: { id: { in: picked.map((s) => s.id) } },
      data: { status: standStatus },
    });

    // Contrato/Pagamento conforme a etapa.
    if (
      spec.status === "CONTRACT_PENDING" ||
      spec.status === "SIGNED" ||
      spec.status === "PAYMENT_PENDING" ||
      spec.status === "PAID"
    ) {
      await prisma.contract.create({
        data: {
          orderId: order.id,
          status: spec.status === "CONTRACT_PENDING" ? "SENT" : "SIGNED",
          signedAt: spec.status === "CONTRACT_PENDING" ? null : new Date(),
        },
      });
    }
    if (spec.status === "PAYMENT_PENDING" || spec.status === "PAID") {
      await prisma.payment.create({
        data: {
          orderId: order.id,
          amountCents: totalCents,
          status: spec.status === "PAID" ? "PAID" : "PENDING",
          paidAt: spec.status === "PAID" ? new Date() : null,
          paymentUrl: `${process.env.APP_URL ?? "http://localhost:3000"}/acompanhar/${order.trackingToken}`,
        },
      });
    }
  }

  console.log("Criando metas...");
  await prisma.goal.createMany({
    data: [
      {
        eventId: event.id,
        title: "Receita total da feira",
        metric: "REVENUE",
        targetValue: 200_000_000, // R$ 2.000.000,00
      },
      {
        eventId: event.id,
        title: "Stands vendidos",
        metric: "STANDS_SOLD",
        targetValue: 40,
      },
    ],
  });

  console.log("Seed concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

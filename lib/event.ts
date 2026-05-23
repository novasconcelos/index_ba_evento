import { prisma } from "@/lib/db";

// Retorna o evento ativo (o sistema é focado em uma edição por vez).
export async function getActiveEvent() {
  const event = await prisma.event.findFirst({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });
  return event;
}

export async function getActiveEventOrThrow() {
  const event = await getActiveEvent();
  if (!event) {
    throw new Error(
      "Nenhum evento ativo encontrado. Rode o seed (npm run db:seed) ou crie um evento no admin.",
    );
  }
  return event;
}

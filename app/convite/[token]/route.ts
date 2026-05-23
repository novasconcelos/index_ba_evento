import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const invite = await prisma.magicLinkToken.findUnique({ where: { token } });

  const base = process.env.APP_URL ?? new URL(req.url).origin;

  if (invite && !invite.usedAt && invite.expiresAt > new Date()) {
    await prisma.magicLinkToken.update({
      where: { token },
      data: { usedAt: new Date() },
    });
  }

  return NextResponse.redirect(`${base}/mapa`);
}

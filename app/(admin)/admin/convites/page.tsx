import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { Label, Textarea } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sendInvites } from "./actions";

export const dynamic = "force-dynamic";

export default async function ConvitesPage() {
  await requireAdmin();
  const invites = await prisma.magicLinkToken.findMany({
    where: { purpose: "invite" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-navy">
        Convites para expositores
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Enviar convites</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={sendInvites} className="space-y-4">
            <div>
              <Label htmlFor="emails">
                E-mails (separados por vírgula, ponto e vírgula ou linha)
              </Label>
              <Textarea
                id="emails"
                name="emails"
                rows={5}
                placeholder="contato@empresa1.com&#10;contato@empresa2.com"
              />
            </div>
            <Button type="submit">Enviar convites</Button>
            <p className="text-xs text-gray-400">
              No modo atual os e-mails são registrados no console do servidor.
              Configure SMTP/Resend para envio real.
            </p>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Convites recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {invites.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhum convite enviado.</p>
          ) : (
            <ul className="divide-y divide-gray-100 text-sm">
              {invites.map((i) => (
                <li key={i.id} className="flex justify-between py-2">
                  <span>{i.email}</span>
                  <span className="text-gray-400">
                    {i.usedAt
                      ? "Utilizado"
                      : i.createdAt.toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

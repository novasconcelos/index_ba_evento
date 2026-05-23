import { prisma } from "@/lib/db";

const PRINT_WIDGET = `
<style>@media print { .__print-btn { display: none !important; } }</style>
<button class="__print-btn" onclick="window.print()"
  style="position:fixed;top:16px;right:16px;padding:10px 16px;border:0;border-radius:8px;background:#1b1568;color:#fff;font-family:sans-serif;cursor:pointer">
  Imprimir / Salvar PDF
</button>
`;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const order = await prisma.order.findUnique({
    where: { trackingToken: token },
    include: { contract: true },
  });

  if (!order?.contract?.html) {
    return new Response("Contrato não encontrado", { status: 404 });
  }

  const html = order.contract.html.replace("</body>", `${PRINT_WIDGET}</body>`);
  return new Response(html, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

import { formatBRL } from "@/lib/utils";

export interface ContractData {
  eventName: string;
  exhibitor: {
    nomeFantasia: string;
    razaoSocial?: string | null;
    cnpj?: string | null;
    contato?: string | null;
    email: string;
    telefone?: string | null;
  };
  techResponsible?: { name: string; document?: string | null } | null;
  items: { code: string; sizeM2: number | null; priceCents: number }[];
  totalCents: number;
  createdAt: Date;
  orderId: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildContractHtml(data: ContractData): string {
  const date = data.createdAt.toLocaleDateString("pt-BR");
  const e = data.exhibitor;
  const rows = data.items
    .map(
      (i) => `
      <tr>
        <td>Stand ${escapeHtml(i.code)}</td>
        <td style="text-align:center">${i.sizeM2 ?? "-"} m²</td>
        <td style="text-align:right">${formatBRL(i.priceCents)}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8" />
<style>
  body { font-family: Georgia, "Times New Roman", serif; color: #14151a; line-height: 1.6; max-width: 760px; margin: 0 auto; padding: 32px; }
  h1 { font-size: 20px; text-align: center; text-transform: uppercase; }
  h2 { font-size: 14px; margin-top: 28px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th, td { border: 1px solid #ddd; padding: 8px; font-size: 13px; }
  th { background: #f1f5f9; text-align: left; }
  .total { text-align: right; font-weight: bold; font-size: 15px; margin-top: 8px; }
  .sign { margin-top: 64px; display: flex; justify-content: space-between; }
  .sign div { width: 45%; border-top: 1px solid #333; padding-top: 6px; text-align: center; font-size: 12px; }
  .muted { color: #555; font-size: 13px; }
</style>
</head>
<body>
  <h1>Contrato de Locação de Stand<br/>${escapeHtml(data.eventName)}</h1>
  <p class="muted">Contrato nº ${escapeHtml(data.orderId)} — ${date}</p>

  <h2>1. Partes</h2>
  <p><strong>CONTRATADA:</strong> Organização do evento ${escapeHtml(
    data.eventName,
  )}.</p>
  <p><strong>CONTRATANTE (Expositor):</strong> ${escapeHtml(
    e.razaoSocial || e.nomeFantasia,
  )}${e.cnpj ? `, inscrita no CNPJ sob nº ${escapeHtml(e.cnpj)}` : ""}, nome
  fantasia "${escapeHtml(e.nomeFantasia)}", representada por
  ${escapeHtml(e.contato || "—")}, e-mail ${escapeHtml(e.email)}${
    e.telefone ? `, telefone ${escapeHtml(e.telefone)}` : ""
  }.</p>
  ${
    data.techResponsible
      ? `<p><strong>Responsável Técnico:</strong> ${escapeHtml(
          data.techResponsible.name,
        )}${
          data.techResponsible.document
            ? ` (${escapeHtml(data.techResponsible.document)})`
            : ""
        }.</p>`
      : ""
  }

  <h2>2. Objeto</h2>
  <p>A CONTRATADA cede à CONTRATANTE o direito de uso dos stands abaixo
  relacionados durante a realização do evento, observadas as normas do
  regulamento do expositor.</p>
  <table>
    <thead><tr><th>Stand</th><th style="text-align:center">Área</th><th style="text-align:right">Valor</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="total">Valor total: ${formatBRL(data.totalCents)}</p>

  <h2>3. Pagamento</h2>
  <p>O pagamento será realizado por meio do link enviado pela CONTRATADA, nas
  condições acordadas. A reserva dos stands é confirmada após a assinatura
  deste contrato e a quitação do valor devido.</p>

  <h2>4. Disposições gerais</h2>
  <p>As partes elegem o foro da comarca da sede da CONTRATADA para dirimir
  eventuais controvérsias. Este instrumento é assinado eletronicamente,
  reconhecendo-se a validade jurídica da assinatura digital.</p>

  <div class="sign">
    <div>CONTRATADA</div>
    <div>CONTRATANTE — ${escapeHtml(e.nomeFantasia)}</div>
  </div>
</body>
</html>`;
}

/**
 * Importa expositores a partir de um CSV exportado da planilha.
 *
 * Uso:  npm run db:import -- caminho/para/planilha.csv
 *
 * Colunas esperadas (cabeçalho, em qualquer ordem):
 *   Nome Fantasia, Contato, Telefone, E-mail, Segmento, ASA, Captador
 *
 * Linhas sem "Nome Fantasia" e sem "E-mail" são ignoradas.
 */
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Parser CSV simples com suporte a aspas e vírgulas internas.
function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (inQuotes) {
      if (c === '"' && content[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (field !== "" || row.length > 0) {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      }
      if (c === "\r" && content[i + 1] === "\n") i++;
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function norm(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const CAPTADORES = ["FIEB", "SEBRAE", "BAHIA_EVENTOS", "OUTRO"];

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Informe o caminho do CSV: npm run db:import -- planilha.csv");
    process.exit(1);
  }

  const rows = parseCsv(readFileSync(file, "utf8"));
  if (rows.length < 2) {
    console.error("CSV vazio ou sem dados.");
    process.exit(1);
  }

  const header = rows[0].map(norm);
  const col = (name: string) => header.indexOf(norm(name));
  const idx = {
    nome: col("Nome Fantasia"),
    contato: col("Contato"),
    telefone: col("Telefone"),
    email: col("E-mail"),
    segmento: col("Segmento"),
    asa: col("ASA"),
    captador: col("Captador"),
  };

  let imported = 0;
  for (const r of rows.slice(1)) {
    const nome = (r[idx.nome] ?? "").trim();
    const email = (r[idx.email] ?? "").trim();
    if (!nome && !email) continue;

    const captRaw = (r[idx.captador] ?? "").trim().toUpperCase();
    const captador = CAPTADORES.includes(captRaw) ? captRaw : null;

    await prisma.exhibitor.create({
      data: {
        nomeFantasia: nome || email,
        contato: (r[idx.contato] ?? "").trim() || null,
        telefone: (r[idx.telefone] ?? "").trim() || null,
        email: email || "sem-email@exemplo.com",
        segment: (r[idx.segmento] ?? "").trim() || null,
        captador,
      },
    });
    imported++;
  }

  console.log(`Importados ${imported} expositores.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

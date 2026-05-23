# Eventos FIEB — Plataforma de Reserva de Stands

Plataforma web para vender/reservar stands de eventos como um e-commerce: o expositor
seleciona stands num **mapa interativo**, cadastra a empresa, **gera o contrato**, assina
eletronicamente e recebe o **link de pagamento**. A organização acompanha tudo por uma
**área administrativa** com dashboards, pipeline de negociações, metas e convites.

---

## Sumário

- [Stack](#stack)
- [Como rodar](#como-rodar)
- [Credenciais e dados de exemplo](#credenciais-e-dados-de-exemplo)
- [O que já foi feito](#o-que-já-foi-feito)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Decisões importantes](#decisões-importantes)
- [Como plugar provedores reais](#como-plugar-provedores-reais)
- [Próximos passos](#próximos-passos)

---

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Prisma 6** + **SQLite** (banco local/mock — ver [Decisões](#decisões-importantes))
- **Tailwind CSS v4** (componentes de UI próprios em `components/ui`)
- **Auth.js (NextAuth v5)** para login do admin
- **Recharts** para os gráficos do dashboard
- **Zod** para validação (inclui validação de CNPJ)

## Como rodar

Pré-requisitos: Node.js 20+ e npm.

```bash
# 1. Instalar dependências
npm install

# 2. Criar o banco (SQLite) + aplicar migrations + popular com dados de exemplo
npm run db:migrate     # cria prisma/dev.db e roda o seed automaticamente
# (ou, se o banco já existe:  npm run db:seed)

# 3. Subir o servidor de desenvolvimento (porta 3100)
npm run dev
```

Acesse:

- Loja do expositor: <http://localhost:3100>
- Painel administrativo: <http://localhost:3100/admin>

### Scripts disponíveis

| Script | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento (porta 3100) |
| `npm run build` / `npm start` | Build e execução em produção |
| `npm run db:migrate` | Cria/atualiza o banco e roda o seed |
| `npm run db:seed` | Repopula o banco com dados de exemplo |
| `npm run db:reset` | Zera o banco e recria do zero |
| `npm run db:studio` | Abre o Prisma Studio (inspeção do banco) |
| `npm run db:import -- caminho.csv` | Importa expositores de um CSV da planilha |

## Credenciais e dados de exemplo

O seed (`prisma/seed.ts`) cria:

- **Admin:** `admin@fieb.org.br` / `admin123`
- **Evento:** "Feira FIEB 2026" com **48 stands** em 3 setores (Alimentos e Bebidas,
  Agroindústria, Institucional) e a planta em SVG
- **Pedidos de exemplo** em várias etapas (reservado, contrato, pago) e **metas**

## O que já foi feito

### Loja do expositor (público)
- **Landing** com identidade visual do evento e indicadores
- **Mapa SVG interativo** (`/mapa`): stands coloridos por status, tooltip com
  código/metragem/valor, seleção por clique e carrinho lateral
- **Checkout** (`/checkout`): dados da empresa (CNPJ com máscara/validação), responsável
  técnico e upload de marca; cria o pedido e **reserva os stands** (com trava anti-corrida)
- **Contrato** gerado automaticamente; página imprimível em `/contrato/[token]`
  (botão "Salvar PDF")
- **Assinatura** e **link de pagamento** (adaptadores manuais); acompanhamento por link
  em `/acompanhar/[token]` com a linha do tempo das etapas

### Painel administrativo (`/admin`, com login)
- **Dashboard**: KPIs (expositores, stands vendidos, receita, pipeline), donut de
  distribuição de stands, gráfico de etapas das negociações e progresso de metas
- **Pedidos**: lista + detalhe com ações (marcar assinado, confirmar pagamento, cancelar)
- **Stands**: CRUD completo (código, segmento, setor, metragem, **preço**, status)
- **Editor do mapa**: pré-visualização, edição do SVG da planta e vínculo forma↔stand
- **Expositores**, **Metas** (CRUD) e **Convites** em lote por e-mail

> Todos os fluxos foram verificados ponta a ponta no navegador.

## Estrutura do projeto

```
app/
  (public)/          # landing, mapa, checkout, acompanhamento
  (admin)/admin/     # dashboard, pedidos, stands, mapa, expositores, metas, convites
  api/files/[name]/  # serve arquivos enviados (marca)
  contrato/[token]/  # contrato em HTML imprimível (PDF)
  convite/[token]/   # redireciona o convite para o mapa
components/
  ui/                # botões, inputs, card, badge...
  map/               # InteractiveMap (mapa SVG), legenda
  cart/              # contexto e resumo do carrinho
  admin/             # cards e gráficos do dashboard, formulário de stand
lib/
  db.ts              # cliente Prisma
  auth.ts / auth-helpers.ts
  enums.ts           # "enums" em TypeScript (colunas String no banco)
  labels.ts          # rótulos e cores de status (pt-BR)
  contract.ts        # gerador do HTML do contrato
  sample-map.ts      # gerador da planta SVG de exemplo
  providers/         # payment, signature, email, storage (interfaces + adaptadores)
prisma/
  schema.prisma, seed.ts
scripts/import-planilha.ts
docker-compose.yml   # Postgres pronto para a migração futura
```

## Decisões importantes

- **Banco local (mock) com SQLite:** por escolha de "começar com banco mock e configurar
  depois". Como o SQLite não suporta enums no Prisma, os "enums" viraram colunas `String`
  e os tipos vivem em `lib/enums.ts`. Há `docker-compose.yml` com Postgres e a URL
  comentada no `.env` para a migração futura.
- **Pagamento e assinatura abstraídos:** interfaces em `lib/providers/` com adaptador
  **manual** (links internos + confirmação manual). O provedor real (Asaas/Mercado Pago
  para pagamento; ZapSign/Clicksign para assinatura) **ainda será escolhido**.
- **E-mail/armazenamento:** adaptadores `console` (loga no servidor) e `local` (disco).
- **Mapa em SVG:** hoje há um SVG de exemplo; o SVG definitivo do designer (cada stand com
  `data-code="CÓDIGO"`) é colado no **Editor do mapa** do admin.
- **Acesso do expositor:** checkout sem conta + link de acompanhamento (sem senha).

## Como plugar provedores reais

As integrações estão isoladas — basta criar um novo adaptador e selecioná-lo:

- **Pagamento:** implemente `PaymentProvider` em `lib/providers/payment.ts` (ex.: Asaas) e
  troque o `getPaymentProvider()`. Crie a rota de webhook para confirmar pagamento.
- **Assinatura:** implemente `SignatureProvider` em `lib/providers/signature.ts`
  (ex.: ZapSign) e a rota de webhook de "assinado".
- **E-mail/Storage:** implemente `EmailProvider` / `StorageProvider` (SMTP/Resend, S3).
- **Postgres:** troque `provider = "sqlite"` por `postgresql` em `prisma/schema.prisma`,
  use a `DATABASE_URL` do Postgres no `.env`, suba `docker compose up -d` e rode
  `npm run db:migrate`.

## Próximos passos

- [ ] Escolher e integrar o **provedor de pagamento** (PIX/boleto/cartão) + webhook
- [ ] Escolher e integrar o **provedor de assinatura eletrônica** + webhook
- [ ] Migrar do SQLite para **PostgreSQL**
- [ ] Configurar **envio real de e-mail** (SMTP/Resend) e **armazenamento** (S3)
- [ ] Substituir o SVG de exemplo pela **planta oficial** do evento
- [ ] Identificar o expositor a partir do **link de convite** (pré-preencher o cadastro)
- [ ] Expiração automática das **reservas** (holds) vencidas
```

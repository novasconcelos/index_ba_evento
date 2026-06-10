# Arquitetura do sistema — Plataforma de Stands FIEB

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 App Router (Server Components + Server Actions) |
| ORM / banco | Prisma 6 + SQLite (dev) |
| Auth | NextAuth v5 — dois providers Credentials (`kind="admin"` / `kind="exhibitor"`) |
| Estilo | Tailwind CSS + shadcn/ui |
| Storage | Provider abstrato em `lib/providers/storage.ts` (local em dev, S3-compatível em prod) |

## Estrutura de rotas

```
app/
├── (public)/
│   ├── mapa/            → mapa público de stands (seleção + carrinho)
│   ├── checkout/        → formulário de reserva
│   ├── acompanhar/[token]/ → portal do expositor (acompanhamento de pedido)
│   └── expositor/       → área logada do expositor
├── (admin)/
│   └── admin/
│       ├── dashboard/   → KPIs, metas, funil de vendas
│       ├── stands/      → CRUD de stands
│       ├── expositores/ → CRUD + funil CRM
│       ├── pedidos/     → listagem e gestão de pedidos
│       ├── mapa/        → editor WYSIWYG do mapa (hotspots)
│       └── config/      → configurações do evento, opções de stands
└── api/
    └── auth/            → NextAuth handlers
```

## Modelo de dados principal

```
Event       1──* Stand      (cada evento tem N stands)
Event       1──* Lead       (leads capturados no mapa)
Stand       *──* Order      (via OrderItem)
Order       1──1 Exhibitor  (pedido pertence a um expositor)
Order       0──1 Contract   (contrato gerado após reserva)
Order       0──1 Payment    (pagamento vinculado ao pedido)
Exhibitor   1──* Order
AdminUser               (usuários do painel admin)
StandOption             (listas configuráveis: Tipo, ASA, Localização)
Goal                    (metas por evento: receita, stands vendidos)
```

## Status de um stand

```
AVAILABLE → RESERVED → SOLD → SPONSOR
                      ↑
                   (hold temporário com holdExpiresAt para concorrência)
```

## Modos de mapa

| Condição | Modo | Componente |
|---|---|---|
| `event.mapImageUrl != null` | Raster (imagem + hotspots HTML) | `InteractiveImageMap` |
| `event.mapSvg != null` | SVG colado (legado) | `InteractiveMap` |
| ambos `null` (padrão) | Vetor embutido do pavilhão | `InteractiveImageMap imageUrl={null}` |

O modo vetorial renderiza a cena `PavilionScene` de `lib/venue/index-pavilion.tsx` dentro
do mesmo `<svg>`, com `StandBlock` por stand usando o `hotspot` normalizado (0..1).

## Posicionamento de stands

`Stand.hotspot` é um JSON `{x, y, w, h}` com coordenadas normalizadas (0..1) relativas
ao viewport do mapa. Em modo vetorial o viewport é o SVG `1600×760`; em modo raster é
a imagem carregada. O seed gera hotspots automaticamente por grid (`lib/sample-map.ts`).

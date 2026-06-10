# Mapa isométrico 2.5D — implementação

## O que foi construído

Redesign completo do mapa: de um JPEG borrado com hotspots HTML translúcidos para um
pavilhão vetorial isométrico 2.5D nítido em qualquer zoom — sem nenhuma mudança de schema.

### Arquivos criados

**`lib/venue/index-pavilion.tsx`** — cena-base do pavilhão
- Exporta `VIEW_W=1600`, `VIEW_H=760`, `WING_SLOPE_PX=0.177`, `slopeFor()`, `shade()`, `POIS[]`
- `PavilionScene`: componente SVG server-safe (sem hooks), desenha as duas asas em V,
  foyer, paredes com extrusão, gradiente de piso, sombra, estruturas decorativas,
  marcador ENTRADA e 6 POIs numerados
- `slopeFor(sector, cx)`: `+0.177` para ASA A, `-0.177` para B, `0` para FOYER
- `shade(hex, f)`: clareia/escurece hex para faces de extrusão

**`components/map/stand-block.tsx`** — bloco isométrico de stand
- `<g>` SVG com face frontal (extrusão escurecida), top face (paralelogramo com slope),
  label do código
- Props: `code, status, x, y, w, h, slope, selected, focused, onClick, ...`
- Cores por status via `standStatusColor` de `lib/labels.ts`
- Selecionado = navy + stroke lime; indisponível = `cursor: not-allowed`

### Arquivos modificados

**`components/map/interactive-image-map.tsx`**
- `imageUrl: string | null` (era `string`)
- `null` → renderiza `<svg>` único com `PavilionScene` + `StandBlock` por stand
- Overlay de legenda de status no canto inferior do mapa
- Card "Pontos de interesse" com lista numerada dos POIs
- Detecção de clique corrigida para SVG: `(e.target as Element).closest?.("[data-stand]")`

**`components/admin/hotspot-editor.tsx`**
- Fundo: `imageUrl` → `<img>` (raster); `null` → `<svg>` com `PavilionScene` + blocos
- Caixas de interação transparentes sempre no topo (drag/resize sobre os blocos visuais)
- WYSIWYG: o que o admin posiciona é exatamente o que o visitante vê

**`app/(admin)/admin/mapa/page.tsx`**
- Editor sempre visível (não depende mais de upload de imagem)
- Nova seção "Imagem personalizada (opcional)" com upload + "Remover imagem"
- SVG legado movido para seção "Avançado (legado)" no fim

**`app/(admin)/admin/mapa/actions.ts`**
- `clearMapImage()`: seta `mapImageUrl = null`, revalida `/admin/mapa` e `/mapa`

**`app/(public)/mapa/page.tsx`**
- Erro só quando `!event` (sem evento); sem mapa = usa vetor embutido automaticamente

**`lib/sample-map.ts`**
- `ASA_REGIONS` recalibradas para a geometria do pavilhão: A (cols=8, rows=4), B (cols=8, rows=2), FOYER (cols=4, rows=2)
- `buildSampleMap()` retorna `StandSpec[]` diretamente (sem geração de SVG)

**`prisma/seed.ts`**
- Evento com `mapSvg: null, mapImageUrl: null` → força modo vetorial

### Arquivos removidos

- `public/mapa-index.jpg` (substituído pelo vetor embutido)

## Geometria do pavilhão

```
viewBox: 1600 × 760
WING_SLOPE_PX: 0.177  (px/px no viewBox)
Slope normalizado (sample-map): 0.11

ASA A (esquerda):  x0=0.135, x1=0.43,  y0=0.20, y1=0.56, cols=8, rows=4, slope=+0.11
ASA B (direita):   x0=0.58,  x1=0.865, y0=0.36, y1=0.56, cols=8, rows=2, slope=-0.11
FOYER (centro):    x0=0.445, x1=0.555, y0=0.50, y1=0.63, cols=4, rows=2, slope=0
```

## POIs fixos

| # | Nome | Posição (viewBox) |
|---|---|---|
| 1 | Credenciamento | 800, 478 |
| 2 | Auditório Principal | 129, 118 |
| 3 | Cozinha Show | 1471, 148 |
| 4 | Lounge INDEX | 800, 230 |
| 5 | Arena de Negócios | 480, 198 |
| 6 | Praça de Alimentação | 1248, 478 |

## Princípio zero migration

Toda a implementação reutilizou `Stand.hotspot` JSON `{x,y,w,h}` normalizado 0..1
sem alterar `prisma/schema.prisma`. O `sector` field (`"A"` | `"B"` | `"FOYER"`) já
existia e drive o slope de cada bloco.

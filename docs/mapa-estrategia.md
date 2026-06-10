# Estratégia do mapa — gestão em escala

## Problema

Com 300+ expositores, o mapa precisa de estratégias diferentes para:
1. **Venda**: como o expositor escolhe/compra um stand
2. **Cadastro**: como o admin gerencia 300 posições sem trabalho manual excessivo
3. **Visual**: qual tipo de imagem/render suporta essa escala com qualidade

---

## Modelos de dados / venda

### A. Cota por tipo (seções com quantidade)
Não existe "stand H31". Existe "Estande 20m² Padrão — 10 disponíveis".
- **Prós**: cadastro trivial, escala infinita, ótimo para pré-venda antes da planta fechar.
- **Contras**: perde "escolha seu lugar", difícil precificar por localização (esquina vs. corredor).
- **Bom para**: início de vendas, eventos onde posição não importa.

### B. Espelho exato (digital twin)
Cada posição física é um polígono clicável fiel à planta real ("H31" é aquele retângulo específico).
- **Prós**: UX premium, cliente vê vizinhos e corredor, suporta preço por localização.
- **Contras**: pesado de montar e manter — toda mudança de layout é trabalho real, precisa da planta.
- **Bom para**: feiras com planta consolidada, diferencial competitivo.

### C. Híbrido (recomendado)
O dado base é a **posição real** (B), mas o sistema expõe uma **visão agregada por tipo/seção**
("20m²: 10 livres") para gestão e pré-venda. As cotas são *derivadas* das posições (um `count()`),
não uma tabela paralela — evitando divergência entre o número solto e as posições reais.

**Implementação atual**: `Stand` já tem `tipo`, `sector`, `status` — a agregação é uma query,
não um campo extra.

---

## Estratégias de cadastro em escala

| Estratégia | Impacto | Como fazer |
|---|---|---|
| **Blocos/fileiras no admin** | Alto | Admin define "Bloco H: 8×4, 20m², ASA A" → sistema gera 32 stands com hotspots automáticos. Base já existe em `lib/sample-map.ts` com `ASA_REGIONS` + grid + slope. |
| **Snap-to-grid no editor** | Médio | Posições "encaixam" numa grade — fileiras ficam alinhadas sem ajuste fino manual. |
| **Import/export CSV** | Alto | Organizadores vivem com planilha. A `BASE_GERAL` da FIEB já é CSV — importar diretamente. |
| **Operações em massa** | Alto | Mudar status, preço ou tipo de um setor inteiro de uma vez. |
| **Lista + filtros (não só mapa)** | Alto | A 300 stands ninguém acha "o de 18m² na ASA B" varrendo visualmente. Tabela com filtro é obrigatória. |
| **Versão por edição** | Médio | Cada `Event` tem seu conjunto de stands. Oferecer "duplicar planta da edição anterior" como ponto de partida. |
| **Reserva temporária (hold)** | Alto | `holdExpiresAt` já implementado — garante que dois compradores simultâneos não peguem o mesmo stand. |

---

## Tipo de imagem ideal

### Ranking para produção

1. **SVG derivado do CAD/planta 2D** (melhor)
   - O pavilhão ou organizador quase sempre tem a planta em DWG/DXF ou PDF vetorial.
   - Converte para SVG com cada estande como forma rotulada (`data-code="H31"`).
   - Nítido em qualquer zoom, cada booth já é clicável, manutenção vem da própria planta.
   - O sistema já suporta esse modo (campo `svgShapeId` + upload de SVG no admin).

2. **PNG/JPG 2D top-down de alta resolução** (aceitável)
   - Funciona como fundo + hotspots por cima (modo raster atual).
   - Manutenção 100% manual (arrastar caixas) — não escala bem a 300 stands.

3. **Render isométrico 3D** (evitar como fonte de verdade)
   - Bonito para marketing, péssimo para precisão e manutenção.
   - A 300 booths os blocos se ocultam e labels colidem.

### Isométrico vs. 2D top-down por escala

| Stands | Recomendação visual |
|---|---|
| Até ~80 | Isométrico 2.5D (atual) — diferencial visual, blocos legíveis |
| 80–300 | 2D top-down limpo (planta baixa) — densidade alta sem sobreposição |
| 300+ | 2D top-down + sistema de zoom/filtros por setor |

### Por que a diferença parece pequena com poucos stands?

Essa dúvida é legítima: com 48 stands o pavilhão está esparso, então as duas visões
ficam quase iguais. O problema do isométrico só aparece sob **densidade**. Três motivos
concretos:

1. **Sobreposição.** O bloco isométrico tem *altura* (face de extrusão). Espaçado, cabe.
   Empacotado, essa altura cobre o stand de trás — fileiras do fundo somem atrás das da
   frente. Você não consegue clicar no que não vê. No 2D não existe altura: cada stand é
   um retângulo que encaixa como ladrilho, **nenhum esconde o outro**.

2. **A grade entorta.** A perspectiva inclina as fileiras pelo slope das asas. Com muitas
   colunas, seguir "fileira H, coluna 12" vira adivinhação. No 2D a grade é ortogonal —
   lê como a planta real ou uma planilha.

3. **Pixels desperdiçados.** O iso gasta área com paredes, sombra e a altura dos blocos.
   Com 300 stands você quer cada pixel = piso vendável. O 2D usa quase 100% da tela para
   área útil.

A diferença "liga" quando a densidade passa ao ponto em que os blocos se tocam.
Para o INDEX (~300 stands) isso é determinante; para edições menores (dezenas de stands)
o isométrico continua funcionando bem.

**Conclusão**: manter o isométrico para a capa/marketing e vitrine do evento.
Para o mapa operacional de venda com 300 stands, migrar para 2D top-down SVG derivado da planta real.

> **Protótipo comparativo**: a planta 2D top-down está disponível em `/mapa2`
> (variant `flat` do `InteractiveImageMap` — mesma lógica de interação, lead capture
> e carrinho do `/mapa`; só trocam a cena de fundo e o bloco de stand).
> O ganho real do 2D aparece de fato quando vier da **planta CAD do pavilhão**
> (cada stand como forma com a metragem certa), refletindo a realidade exata do piso.

---

## Próximos passos sugeridos (prioridade)

1. **Painel de disponibilidade por tipo/ASA** — rápido (agregação do que já existe), resolve a
   visão de "cotas" para o admin sem novo campo no banco.
2. **Cadastro por blocos no admin** — maior ganho de gestão: gera + posiciona N stands de uma vez.
3. **Import CSV** — para quando a planta vier da planilha BASE_GERAL.
4. **2D top-down SVG** — implementar suporte a SVG da planta real quando o layout consolidar.

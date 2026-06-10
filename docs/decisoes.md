# Decisões de produto e técnicas

## Mapa

### Por que isométrico 2.5D e não 3D real ou 2D flat?
O venue INDEX tem a forma em V (duas asas), o que fica muito mais legível em perspectiva
isométrica do que flat. 3D real (WebGL) seria overkill — lento, sem acessibilidade,
difícil de manter. O SVG isométrico dá o mesmo impacto visual sem nenhuma dependência extra.

### Por que o mapa vetorial como padrão (não exigir upload)?
Antes o site mostrava "configure o mapa" se nenhuma imagem fosse enviada. Com o pavilhão
vetorial embutido, o sistema funciona out-of-the-box após o seed — zero atrito para demo
ou evento novo. Upload de imagem personalizada continua disponível como modo alternativo.

### Por que não mudar o schema para o redesign do mapa?
`Stand.hotspot` JSON `{x,y,w,h}` normalizado 0..1 já funciona para qualquer viewport
(raster ou vetorial). Mudar o schema exigiria migration + re-seed e não acrescentaria
nada — o mesmo dado serve os dois modos.

### POIs fixos no código (não CRUD)?
Para o INDEX 2027, os POIs são fixos (Auditório, Cozinha Show, etc.). CRUD de POIs
adicionaria complexidade (novo model, página admin, seed) sem benefício imediato.
Se o venue mudar entre edições, editar `POIS[]` em `lib/venue/index-pavilion.tsx` é trivial.

## Auth

### Por que dois providers Credentials no mesmo NextAuth em vez de papéis no mesmo model?
Admins e expositores têm fluxos de login radicalmente diferentes: admin usa email/senha
simples, expositor usa magic link + opcionalmente senha. Dois providers deixam cada fluxo
independente e evita `if role === "ADMIN"` espalhado pela auth logic.

## Dados

### Por que `StandOption` para Tipo/ASA/Localização e não enum no schema?
Enums no Prisma/SQLite exigem migration a cada novo valor. A FIEB muda os tipos de stand
toda edição (Cervejaria, Tech, Restaurante…). `StandOption` com `kind` + `value` permite
o admin adicionar/remover opções sem nenhum deploy.

### Por que `holdExpiresAt` em vez de uma tabela de reservas temporárias?
Manter o hold como campo no próprio `Stand` evita joins e simplifica a query de
"está disponível?". A limpeza de holds expirados é feita na query de listagem
(`status = AVAILABLE OR holdExpiresAt < now`).

## Modelo de venda

### Por que híbrido (posição real + visão de cota derivada)?
Ver `docs/mapa-estrategia.md`. Resumo: posição real como fonte única evita divergência
entre "10 disponíveis no sistema" e "mas esse stand específico está ocupado". A cota
é derivada de um `count()` — um dado, duas visões.

## Proposta comercial

### Módulos da proposta (INDEX 2027)
A proposta gerada em `gerar_proposta.py` cobre 6 módulos:
1. Gestão de stands e plantas
2. Portal do expositor
3. CRM e captação
4. Contratos e assinaturas
5. Pagamentos
6. Relatórios e metas

O diferencial apresentado é o mapa interativo WYSIWYG (admin vê o que o visitante vê)
e o funil completo de venda — do lead até o pagamento, sem planilha no meio.

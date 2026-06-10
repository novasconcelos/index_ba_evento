# Fluxos principais do sistema

## Fluxo do visitante (captura de lead + reserva)

```
1. /mapa → visualiza o mapa isométrico
2. Clica num stand AVAILABLE
   → se não há lead na sessionStorage: abre modal de captura (email + whatsapp)
   → Lead salvo no banco (Lead.status = "NEW")
3. Stand entra no carrinho (sessionStorage["fieb-cart"])
4. Pode continuar selecionando mais stands
5. /checkout → preenche dados da empresa
   → campos pré-preenchidos com dados do lead (email/whatsapp)
6. Submit → cria Exhibitor + Order + OrderItems + TechResponsible
   → Stand.status = "RESERVED" + holdExpiresAt
7. Expositor recebe email com link de acompanhamento (/acompanhar/[token])
```

## Fluxo de venda (admin)

```
RESERVED → CONTRACT_PENDING → SIGNED → PAYMENT_PENDING → PAID
   ↑
(admin move manualmente ou por integração)

Cada etapa cria/atualiza registros em Contract e Payment.
```

## Fluxo do expositor logado

```
/expositor/login → NextAuth Credentials (kind="exhibitor")
/expositor/dashboard → resumo do pedido, status do contrato/pagamento
/expositor/documentos → upload de brand assets (logo, manual etc.)
/expositor/dados → editar dados cadastrais
```

## Fluxo admin — cadastro de stands

```
/admin/stands → lista com filtros (ASA, tipo, status, preço)
→ "Novo stand" ou "Importar CSV" (planejado)
→ Editar individualmente
/admin/mapa → posicionar hotspot no mapa (drag + resize)
→ "Auto-distribuir" por bloco/região (planejado)
```

## Autenticação

Dois providers NextAuth distintos no mesmo `auth.ts`:
- `kind="admin"` → verifica `AdminUser` com `bcrypt`, retorna `role: "ADMIN"`
- `kind="exhibitor"` → verifica `Exhibitor` com `bcrypt`, retorna `role: "EXHIBITOR"`

Rotas admin protegidas por `requireAdmin()` em `lib/auth-helpers.ts`.
Rotas expositor protegidas por `requireExhibitor()`.

## Reserva temporária (concorrência)

Quando o expositor entra no checkout, o stand fica com `holdExpiresAt = now + 15min`.
Outro visitante que selecionar o mesmo stand vê status "RESERVADO" até o hold expirar.
Ao confirmar o checkout, o stand passa para `RESERVED` permanente (sem holdExpiresAt).

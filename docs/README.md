# Documentação — Plataforma de Stands FIEB

## Índice

| Arquivo | Conteúdo |
|---|---|
| [arquitetura.md](arquitetura.md) | Stack, estrutura de rotas, modelo de dados, modos de mapa |
| [fluxos.md](fluxos.md) | Fluxos do visitante, admin, expositor logado e autenticação |
| [mapa-implementacao.md](mapa-implementacao.md) | O que foi construído no redesign isométrico 2.5D (arquivos, geometria, POIs) |
| [mapa-estrategia.md](mapa-estrategia.md) | Estratégia para 300+ expositores: modelos de dado, cadastro em escala, tipo de imagem ideal |
| [decisoes.md](decisoes.md) | Decisões de produto e técnicas — o porquê de cada escolha |

## Setup rápido

```bash
npm install
npm run db:seed      # cria o banco SQLite com dados de exemplo
npm run dev          # inicia em http://localhost:3000
```

Credenciais de acesso após o seed:
- Admin: `admin@fieb.org.br` / `admin123`
- Expositor: qualquer email dos pedidos de exemplo / `expositor123`

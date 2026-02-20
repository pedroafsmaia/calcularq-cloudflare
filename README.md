# calcularq

SaaS de calculadora para precificação de projetos de arquitetura.

Este repositório está **consolidado para Cloudflare**:
- **Frontend**: Cloudflare Pages (Vite/React)
- **Backend/API**: Cloudflare Pages Functions (Workers runtime)
- **Banco**: Cloudflare D1 (SQLite)

## Documentação
Veja:
- `docs/CLOUDFLARE_DEPLOY_GUIDE.md` — deploy passo a passo
- `docs/README_CLOUDFLARE.md` — visão geral do setup Cloudflare

## Observações
- **Não** commite arquivos `.env` ou segredos.
- Pastas como `node_modules/` e `dist/` não fazem parte do repositório (são geradas no build).

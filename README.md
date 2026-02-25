# Calcularq

Calculadora de precificacao por complexidade para projetos de arquitetura.

A Calcularq cruza hora tecnica, fatores de complexidade, horas estimadas e composicao final do preco para gerar um valor de venda com base em dados do escritorio e do projeto.

**Producao (Pages):** https://calcularq-cloudflare.pages.dev

---

## Visao geral

### Principais recursos
- Cadastro/login com sessao via cookie HttpOnly
- Recuperacao de senha por e-mail (Brevo)
- Pagamento unico via Stripe (Checkout + Webhook)
- Calculadora em 4 etapas (fatores antes da calibragem de pesos)
- Historico de calculos por usuario
- Manual integrado com navegacao por etapas

### Stack
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Animacoes: Framer Motion (presets centralizados em `src/lib/motion.ts`)
- Backend: Cloudflare Pages Functions
- Banco: Cloudflare D1 (SQLite)
- Pagamento: Stripe
- E-mail: Brevo

---

## Estrutura do projeto

```text
src/
  components/        Componentes reutilizaveis de UI e calculadora
  contexts/          AuthContext / sessao do usuario
  lib/               API client, motion presets e helpers
  pages/             Home, Calculadora, Manual, Auth, Payment, etc.
  types/             Tipos compartilhados (budget/draft)
  utils/             Helpers gerais

functions/
  api/
    auth/            Login, registro, logout, recovery/reset
    budgets/         CRUD dos calculos salvos
    stripe/          Checkout + webhook
    user/            Status de pagamento
    _utils.js        Sessao, validacoes, respostas, hardening

migrations/
  0001_init.sql
  0002_security_hardening.sql

docs/
  QA_SECURITY_CHECKLIST.md
  ARCHITECTURE.md
  MAINTENANCE_GUIDE.md
```

---

## Desenvolvimento local

### Requisitos
- Node.js 20+
- npm 10+
- Wrangler (via `npx` ja atende)

### Rodar frontend

```bash
npm install
npm run dev
```

### Build de producao (check principal)

```bash
npm run build
```

### Preview local

```bash
npm run preview
```

---

## Cloudflare Pages / Deploy

### Deploy automatico
Todo push em `main` dispara deploy no Cloudflare Pages.

### Deploy manual

```bash
npm run build
npx wrangler pages deploy dist --project-name calcularq-cloudflare
```

### Variaveis publicas (`wrangler.toml`)

```toml
[vars]
FRONTEND_URL = "https://calcularq-cloudflare.pages.dev"
STRIPE_SUCCESS_PATH = "/payment/close"
STRIPE_CANCEL_PATH = "/payment"
DEBUG_EMAIL_TOKENS = "0"
```

### Secrets (Cloudflare Pages)
Secrets sensiveis nao ficam versionados. Configure via dashboard ou Wrangler:

```bash
npx wrangler pages secret put NOME_DA_VARIAVEL --project-name calcularq-cloudflare
```

#### Secrets obrigatorios
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`

### Toggle de paywall (`REQUIRE_PAYMENT`)
Configurado como secret no Cloudflare Pages:
- `"1"` = paywall ativo
- `"0"` = paywall desativado (teste)

```bash
# Desativar paywall (teste)
echo 0 | npx wrangler pages secret put REQUIRE_PAYMENT --project-name calcularq-cloudflare

# Ativar paywall
echo 1 | npx wrangler pages secret put REQUIRE_PAYMENT --project-name calcularq-cloudflare
```

> Apos alterar o secret, rode um redeploy no Cloudflare Pages para aplicar imediatamente.

---

## Banco de dados (D1)

### Tabelas principais
- `users`
- `budgets`
- `reset_tokens`
- `request_rate_limits` (hardening)
- `stripe_webhook_events` (idempotencia)

### Rodar migrations (remoto)

```bash
npx wrangler d1 execute calcularq --remote --file=migrations/0001_init.sql
npx wrangler d1 execute calcularq --remote --file=migrations/0002_security_hardening.sql
```

---

## Seguranca (resumo)

Ja implementado no backend:
- Sessao JWT em cookie HttpOnly (`SameSite=Lax`, `Secure` em producao)
- Validacao de origem (`Origin`) em endpoints mutaveis
- Validacao de e-mail e senha minima (8 chars)
- Cooldown em `forgot-password`
- Hardening de payload/limites em budgets
- Idempotencia no webhook Stripe por `event.id`

Checklist de revisao:
- `docs/QA_SECURITY_CHECKLIST.md`

---

## Documentacao do projeto

- `docs/ARCHITECTURE.md` -> arquitetura, fluxos e responsabilidades por camada
- `docs/MAINTENANCE_GUIDE.md` -> convencoes, hotspots e roadmap de refatoracao
- `docs/QA_SECURITY_CHECKLIST.md` -> check/fix de bugs, UX e seguranca

---

## Comandos uteis (D1 / operacao)

### Listar usuarios
```bash
npx wrangler d1 execute calcularq --remote --command "SELECT id, email, has_paid FROM users;"
```

### Liberar acesso manualmente
```bash
npx wrangler d1 execute calcularq --remote --command "UPDATE users SET has_paid = 1, payment_date = datetime('now') WHERE email = 'email@exemplo.com';"
```

### Revogar acesso
```bash
npx wrangler d1 execute calcularq --remote --command "UPDATE users SET has_paid = 0 WHERE email = 'email@exemplo.com';"
```

---

## Observacoes de manutencao

- `npm run build` e o check minimo antes de commit/push.
- O arquivo mais sensivel do projeto hoje e `src/pages/Calculator.tsx` (fluxo, importacao por etapa, draft, reset, resultados, dialogs).
- As proximas melhorias estruturais recomendadas estao descritas em `docs/MAINTENANCE_GUIDE.md`.

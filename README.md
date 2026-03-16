# Calcularq

Calculadora de precificação por complexidade para projetos de arquitetura.

A aplicação cruza hora técnica mínima, fatores de complexidade, estimativa de horas e ajustes comerciais para chegar ao preço final do projeto. O produto inclui calculadora, manual metodológico, histórico de cálculos e área administrativa.

**Produção (Pages):** https://calcularq-cloudflare.pages.dev

---

## Visão geral

### Principais recursos
- Cadastro e login com sessão via cookie `HttpOnly`
- Login social com Google (OAuth / Google Identity Services)
- Recuperação de senha por e-mail com Brevo
- Pagamento único via Stripe (`Checkout` + `Webhook`)
- Calculadora em 3 etapas
- Rascunho local com autosave
- Importação de etapa a partir de cálculo salvo
- Histórico de cálculos por usuário
- Manual integrado ao método
- Dashboard administrativo com analytics e calibração

### Stack
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Animações: Framer Motion
- Roteamento: `react-router-dom` com `BrowserRouter`
- Backend: Cloudflare Pages Functions
- Autenticação Google: `jose` (verificação de ID token via JWKS)
- Banco: Cloudflare D1 (SQLite)
- Pagamentos: Stripe
- E-mail: Brevo

---

## Fluxo da calculadora

### Etapas atuais
1. Hora técnica
2. Fatores de complexidade
3. Preço e ajustes

### Comportamentos relevantes
- autosave local com restauração de rascunho
- importação da etapa atual a partir de outro cálculo salvo
- reset de etapa ou do cálculo inteiro
- proteção contra saída com alterações não salvas
- cálculo final com cenário conservador ou otimista

### Núcleo técnico
- Orquestração principal: [src/pages/Calculator.tsx](C:/Users/pedro/OneDrive/Área%20de%20Trabalho/SaaS/calcularq-cloudflare/src/pages/Calculator.tsx)
- Motor metodológico principal: [src/components/pricing/PricingEngineMethod12.ts](C:/Users/pedro/OneDrive/Área%20de%20Trabalho/SaaS/calcularq-cloudflare/src/components/pricing/PricingEngineMethod12.ts)
- Hooks de suporte da calculadora:
  - [src/hooks/calculator/useCalculatorDraftSync.ts](C:/Users/pedro/OneDrive/Área%20de%20Trabalho/SaaS/calcularq-cloudflare/src/hooks/calculator/useCalculatorDraftSync.ts)
  - [src/hooks/calculator/useCalculatorBudgetData.ts](C:/Users/pedro/OneDrive/Área%20de%20Trabalho/SaaS/calcularq-cloudflare/src/hooks/calculator/useCalculatorBudgetData.ts)
  - [src/hooks/calculator/useCalculatorDerivedValues.ts](C:/Users/pedro/OneDrive/Área%20de%20Trabalho/SaaS/calcularq-cloudflare/src/hooks/calculator/useCalculatorDerivedValues.ts)
  - [src/hooks/calculator/useCalculatorExitGuard.ts](C:/Users/pedro/OneDrive/Área%20de%20Trabalho/SaaS/calcularq-cloudflare/src/hooks/calculator/useCalculatorExitGuard.ts)
  - [src/hooks/calculator/useCalculatorStepNavigation.ts](C:/Users/pedro/OneDrive/Área%20de%20Trabalho/SaaS/calcularq-cloudflare/src/hooks/calculator/useCalculatorStepNavigation.ts)
  - [src/hooks/calculator/useCalculatorStepImport.ts](C:/Users/pedro/OneDrive/Área%20de%20Trabalho/SaaS/calcularq-cloudflare/src/hooks/calculator/useCalculatorStepImport.ts)
  - [src/hooks/calculator/useCalculatorReset.ts](C:/Users/pedro/OneDrive/Área%20de%20Trabalho/SaaS/calcularq-cloudflare/src/hooks/calculator/useCalculatorReset.ts)

---

## Estrutura do projeto

```text
src/
  components/
    budgets/         Componentes de "Meus cálculos"
    calculator/      Blocos da calculadora, resultados e salvamento
    manual/          Componentes do manual
    pricing/         Motores de cálculo e testes do método
    ui/              Base de UI reutilizável
  contexts/          Contextos globais, incluindo autenticação
  hooks/
    calculator/      Hooks de fluxo e orquestração da calculadora
  lib/               API client, helpers, parsing, motion e calibração
  pages/             Home, Calculator, Manual, Login, Payment, Admin etc.
  types/             Tipos compartilhados (incluindo Google Identity Services)
  utils/             Helpers gerais

functions/
  api/
    _utils.js        Sessão, validações, respostas e hardening
    auth/            Login, registro, logout, recovery/reset/me, Google OAuth
    admin/           Endpoints do dashboard admin
    budgets/         CRUD dos cálculos salvos
    stripe/          Checkout e webhook
    user/            Status de pagamento

migrations/
  0001_init.sql
  0002_security_hardening.sql
  0003_budget_feedback_fields.sql
  0004_method_1_0.sql
  0005_method_1_1.sql
  0006_method_1_2.sql
  0007_admin_rbac.sql
  0008_google_oauth.sql

docs/
  ARCHITECTURE.md
  CLOUDFLARE_DEPLOY_GUIDE.md
  COMMIT_STRATEGY.md
  MAINTENANCE_GUIDE.md
  METODO_1_2_IMPLEMENTACAO.md
  METODO_V3_1_1_IMPLEMENTACAO.md
  QA_SECURITY_CHECKLIST.md
  README_CLOUDFLARE.md
  VISUAL_IDENTITY_CHECKLIST.md
```

---

## Desenvolvimento local

### Requisitos
- Node.js 20+
- npm 10+
- Wrangler via `npx`

### Rodar o frontend

```bash
npm install
npm run dev
```

### Build de produção

```bash
npm run build
```

### Rodar frontend + Functions localmente

```bash
npm run build
npm run cf:dev
```

### Qualidade

```bash
npm run lint
npm run test:run
npm run build
```

### Preview local

```bash
npm run preview
```

### Hooks de repositório e Repomix

Instalar hooks uma vez:

```bash
npm run hooks:install
```

Gerar manualmente:

```bash
npm run repomix:full
```

Regra atual:
- o hook `pre-push` gera `repomix-calcularq-full.md`
- o arquivo anterior é substituído
- `dist/`, `backups/` e `node_modules/` ficam fora do pacote

---

## Cloudflare Pages e deploy

### Deploy automático
Todo push em `main` dispara deploy no Cloudflare Pages.

### Deploy manual

```bash
npm run build
npx wrangler pages deploy dist --project-name calcularq-cloudflare
```

### Variáveis públicas (`wrangler.toml`)

```toml
[vars]
FRONTEND_URL = "https://calcularq-cloudflare.pages.dev"
DEBUG_EMAIL_TOKENS = "0"
ADMIN_EMAIL = "pedroafsmaia@gmail.com"
```

- `ADMIN_EMAIL`: fallback de administrador por e-mail
- RBAC principal: `users.is_admin = 1`

Variáveis opcionais:
- `STRIPE_SUCCESS_PATH` (padrão: `/payment/close`)
- `STRIPE_CANCEL_PATH` (padrão: `/payment`)

### Secrets do Cloudflare Pages

```bash
npx wrangler pages secret put NOME_DA_VARIAVEL --project-name calcularq-cloudflare
```

Obrigatórios:
- `JWT_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`

Observação:
- Os secrets de produção estão salvos no Bitwarden. Não versionar valores reais no repositório.

Opcionais (Google OAuth):
- `GOOGLE_CLIENT_ID` — ID do cliente OAuth para verificação server-side do token
- `VITE_GOOGLE_CLIENT_ID` — mesmo valor, exposto ao frontend via Vite para renderizar o botão Google

### Toggle de paywall
Secret `REQUIRE_PAYMENT`:
- `1`: paywall ativo
- `0`: paywall desativado

```bash
echo 0 | npx wrangler pages secret put REQUIRE_PAYMENT --project-name calcularq-cloudflare
echo 1 | npx wrangler pages secret put REQUIRE_PAYMENT --project-name calcularq-cloudflare
```

### Toggle de cadastro
Secret `DISABLE_REGISTRATION`:
- `1`: bloqueia novos cadastros por e-mail e o primeiro acesso via Google
- `0`: libera novos cadastros

```bash
echo 1 | npx wrangler pages secret put DISABLE_REGISTRATION --project-name calcularq-cloudflare
echo 0 | npx wrangler pages secret put DISABLE_REGISTRATION --project-name calcularq-cloudflare
```

Após alterar um secret, faça redeploy.

---

## Banco de dados

### Tabelas principais
- `users`
- `budgets`
- `reset_tokens`
- `request_rate_limits`
- `stripe_webhook_events`

### Rodar migrations remotamente

```bash
npx wrangler d1 execute calcularq --remote --file=migrations/0001_init.sql
npx wrangler d1 execute calcularq --remote --file=migrations/0002_security_hardening.sql
npx wrangler d1 execute calcularq --remote --file=migrations/0003_budget_feedback_fields.sql
npx wrangler d1 execute calcularq --remote --file=migrations/0004_method_1_0.sql
npx wrangler d1 execute calcularq --remote --file=migrations/0005_method_1_1.sql
npx wrangler d1 execute calcularq --remote --file=migrations/0006_method_1_2.sql
npx wrangler d1 execute calcularq --remote --file=migrations/0007_admin_rbac.sql
npx wrangler d1 execute calcularq --remote --file=migrations/0008_google_oauth.sql
```

---

## CI

Pipeline em `.github/workflows/ci.yml`.

Checks atuais:
- `npm run lint`
- `npm run test:run`
- `npm run build`

---

## Segurança

Já implementado no backend:
- sessão JWT em cookie `HttpOnly`
- `SameSite=Lax`
- `Secure` em produção
- validação de `Origin` em endpoints mutáveis
- validação de e-mail e senha mínima
- cooldown em recuperação de senha
- hardening de payload em budgets
- idempotência no webhook Stripe
- controle de acesso admin via `users.is_admin` com fallback `ADMIN_EMAIL`
- login Google OAuth com verificação server-side de ID token via JWKS

Checklist:
- `docs/QA_SECURITY_CHECKLIST.md`

---

## Documentação

- `docs/ARCHITECTURE.md`
- `docs/CLOUDFLARE_DEPLOY_GUIDE.md`
- `docs/README_CLOUDFLARE.md`
- `docs/MAINTENANCE_GUIDE.md`
- `docs/METODO_1_2_IMPLEMENTACAO.md`
- `docs/METODO_V3_1_1_IMPLEMENTACAO.md`
- `docs/COMMIT_STRATEGY.md`
- `docs/QA_SECURITY_CHECKLIST.md`
- `docs/VISUAL_IDENTITY_CHECKLIST.md`

---

## Comandos úteis

### Listar usuários

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

## Observações de manutenção

- Check mínimo antes de push: `npm run lint`, `npm run test:run` e `npm run build`
- O fluxo mais sensível do produto continua na calculadora
- A página principal da calculadora foi desacoplada em hooks, mas ainda é um hotspot de manutenção
- O motor do método `1.2` já tem testes dedicados em `src/components/pricing/PricingEngineMethod12.test.ts`

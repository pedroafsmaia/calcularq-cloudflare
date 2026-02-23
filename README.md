# Calcularq

Calculadora de precificação por complexidade para projetos de arquitetura.  
O arquiteto informa suas despesas, configura os fatores de complexidade do projeto e recebe o preço de venda ideal como resultado.

**Acesso:**  
https://calcularq-cloudflare.pages.dev

---

## O que o sistema faz

- Cadastro e login de usuários com JWT seguro (via cookie HttpOnly)
- Recuperação de senha por email (Brevo)
- Pagamento único via Stripe (R$19,90) para liberar acesso
- Webhook Stripe com validação de assinatura
- Calculadora com 6 fatores de complexidade configuráveis
- Histórico de cálculos salvos por usuário
- Paywall controlado por variável de ambiente

---

## Tecnologias usadas

| Parte | Tecnologia |
|---|---|
| Interface (frontend) | React + TypeScript + Tailwind CSS |
| Servidor (backend) | Cloudflare Pages Functions |
| Banco de dados | Cloudflare D1 (SQLite) |
| Pagamentos | Stripe (Checkout + Webhook) |
| Emails | Brevo (SMTP API) |
| Deploy | Cloudflare Pages |

---

## Estrutura do projeto

```
src/
  pages/          → Telas do app (Home, Login, Calculator, Payment, etc.)
  components/     → Componentes reutilizáveis
  contexts/       → Gerenciamento de sessão (AuthContext)
  lib/            → Cliente da API
  utils/          → Funções auxiliares

functions/
  api/
    auth/         → Login, registro, logout, recuperação de senha
    stripe/       → Checkout session + webhook
    user/         → Status de pagamento
    budgets/      → CRUD dos cálculos

migrations/
  0001_init.sql   → Estrutura inicial do banco
```

---

## Variáveis de ambiente

As variáveis sensíveis **nunca ficam no código**.  
São configuradas como *secrets* no Cloudflare:

```bash
npx wrangler pages secret put NOME_DA_VARIAVEL --project-name calcularq-cloudflare
```

### Secrets obrigatórios

| Variável | O que é |
|---|---|
| `JWT_SECRET` | Chave para assinar tokens de sessão |
| `STRIPE_SECRET_KEY` | Chave secreta da Stripe (`sk_test_...` ou `sk_live_...`) |
| `STRIPE_PRICE_ID` | ID do produto na Stripe (`price_...`) |
| `STRIPE_WEBHOOK_SECRET` | Chave do webhook Stripe (`whsec_...`) |
| `BREVO_API_KEY` | API Key do Brevo |
| `BREVO_SENDER_EMAIL` | Email remetente do Brevo |
| `BREVO_SENDER_NAME` | Nome do remetente |

---

### Variáveis públicas (wrangler.toml)

```toml
[vars]
FRONTEND_URL = "https://calcularq-cloudflare.pages.dev"
STRIPE_SUCCESS_PATH = "/payment/close"
STRIPE_CANCEL_PATH = "/payment"
DEBUG_EMAIL_TOKENS = "0"
```

> ⚠️ Nunca use `DEBUG_EMAIL_TOKENS = "1"` em produção.

### Toggle de paywall (`REQUIRE_PAYMENT`)

O paywall da calculadora é controlado pela variável `REQUIRE_PAYMENT` no Cloudflare Pages (configurada como secret), para permitir testes sem `commit/push`.

- `REQUIRE_PAYMENT = "1"`: paywall ativo
- `REQUIRE_PAYMENT = "0"`: paywall desativado (teste)

Configurar com Wrangler:

```bash
# Desativar paywall (teste)
echo 0 | npx wrangler pages secret put REQUIRE_PAYMENT --project-name calcularq-cloudflare

# Ativar paywall novamente
echo 1 | npx wrangler pages secret put REQUIRE_PAYMENT --project-name calcularq-cloudflare
```

> Após alterar a variável, faça um redeploy no Cloudflare Pages para aplicar imediatamente.

---

## Fluxo de Pagamento (Stripe)

1. Usuário cria conta
2. Sistema bloqueia acesso se `has_paid = 0`
3. Checkout Stripe é aberto
4. Stripe envia evento para `/api/stripe/webhook`
5. Backend valida assinatura (`STRIPE_WEBHOOK_SECRET`)
6. Banco é atualizado (`has_paid = 1`)
7. Frontend libera acesso automaticamente

### Eventos escutados:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

---

## Recuperação de senha (Brevo)

Fluxo:

1. Usuário solicita redefinição
2. Token é gerado e salvo como hash no banco
3. Email é enviado via Brevo
4. Token expira em 1 hora
5. Após uso, token é removido

O remetente é configurável via:

- `BREVO_SENDER_EMAIL`
- `BREVO_SENDER_NAME`

---

## Banco de dados (D1)

### Tabelas

- `users`
- `budgets`
- `reset_tokens`

Rodar migration:

```bash
npx wrangler d1 execute calcularq --remote --file=migrations/0001_init.sql
```

---

## Comandos úteis (produção)

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

## Deploy

Todo push para `main` dispara deploy automático.

Manual:

```bash
npm run build
npx wrangler pages deploy dist --project-name calcularq-cloudflare
```

---

## Segurança

- JWT armazenado em cookie HttpOnly
- Assinatura de webhook validada
- Tokens de reset armazenados como hash (SHA-256)
- Secrets nunca versionados
- Normalização de URLs de redirect do Stripe

---

## Gerenciamento de Chaves

Todas as chaves de produção estão armazenadas no **Bitwarden**  
Entrada: **"Calcularq - Produção"**

---

## Boas práticas

- Nunca commitar chaves
- Sempre testar no Stripe Test Mode antes de usar `sk_live`
- Fazer backup periódico do D1
- Validar logs do Cloudflare após mudanças no webhook

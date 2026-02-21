# Calcularq

Calculadora de precificação por complexidade para projetos de arquitetura. O arquiteto informa suas despesas, configura os fatores de complexidade do projeto e recebe o preço de venda ideal como resultado.

**Acesso:** [calcularq-cloudflare.pages.dev](https://calcularq-cloudflare.pages.dev)

---

## O que o sistema faz

- Cadastro e login de usuários
- Recuperação de senha por email
- Pagamento único via Stripe (R$19,90) para liberar o acesso
- Calculadora com 6 fatores de complexidade configuráveis
- Histórico de cálculos salvos por usuário

---

## Tecnologias usadas

| Parte | Tecnologia |
|---|---|
| Interface (frontend) | React + TypeScript + Tailwind CSS |
| Servidor (backend) | Cloudflare Pages Functions |
| Banco de dados | Cloudflare D1 (SQLite) |
| Pagamentos | Stripe |
| Emails | Brevo |
| Deploy | Cloudflare Pages |

---

## Estrutura do projeto

```
src/
  pages/          → Telas do app (Home, Login, Calculator, etc.)
  components/     → Componentes reutilizáveis
  contexts/       → Gerenciamento de sessão do usuário (AuthContext)
  lib/            → Clientes de API e banco de dados local
  utils/          → Funções auxiliares

functions/
  api/
    auth/         → Login, registro, logout, recuperação de senha
    stripe/       → Criação de sessão de pagamento e webhook
    user/         → Status de pagamento do usuário
    budgets/      → Salvar, listar e excluir cálculos

migrations/
  0001_init.sql   → Estrutura do banco de dados
```

---

## Variáveis de ambiente

As variáveis sensíveis (senhas, chaves de API) **nunca** ficam no código. Elas são configuradas como secrets no Cloudflare via terminal:

```bash
npx wrangler pages secret put NOME_DA_VARIAVEL --project-name calcularq-cloudflare
```

| Variável | O que é |
|---|---|
| `JWT_SECRET` | Chave para assinar os tokens de sessão (qualquer texto longo e aleatório) |
| `STRIPE_SECRET_KEY` | Chave secreta da Stripe (`sk_live_...`) |
| `STRIPE_PRICE_ID` | ID do produto na Stripe (`price_...`) |
| `STRIPE_WEBHOOK_SECRET` | Chave do webhook da Stripe (`whsec_...`) |
| `BREVO_API_KEY` | Chave da API do Brevo para envio de emails |

As variáveis não-sensíveis ficam no `wrangler.toml`:

```toml
[vars]
FRONTEND_URL = "https://calcularq-cloudflare.pages.dev"
REQUIRE_PAYMENT = "1"
STRIPE_SUCCESS_PATH = "/payment/close"
STRIPE_CANCEL_PATH = "/payment"
DEBUG_EMAIL_TOKENS = "0"
```

> ⚠️ Nunca mude `DEBUG_EMAIL_TOKENS` para `"1"` em produção — isso expõe links de redefinição de senha na resposta da API.

---

## Como rodar localmente

### Pré-requisitos
- [Node.js](https://nodejs.org) instalado
- Conta no Cloudflare com o projeto criado

### Passo a passo

1. Clone o repositório e instale as dependências:
```bash
npm install
```

2. Faça login no Cloudflare pelo terminal:
```bash
npx wrangler login
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O app abre em `http://localhost:5173`. As funções de backend rodam automaticamente junto.

---

## Como fazer deploy

Todo push para o branch `main` dispara um deploy automático no Cloudflare Pages.

Para fazer deploy manual pelo terminal:
```bash
npm run build
npx wrangler pages deploy dist --project-name calcularq-cloudflare
```

---

## Banco de dados

O banco usa Cloudflare D1 (SQLite). Para rodar a migration e criar as tabelas:

```bash
# Em produção (remoto)
npx wrangler d1 execute calcularq --remote --file=migrations/0001_init.sql

# Local (desenvolvimento)
npx wrangler d1 execute calcularq --local --file=migrations/0001_init.sql
```

### Tabelas

- **users** — dados dos usuários, status de pagamento e ID do cliente Stripe
- **budgets** — cálculos salvos por usuário
- **reset_tokens** — tokens temporários para redefinição de senha (expiram em 1 hora)

---

## Serviços externos

### Stripe
Configurado para pagamento único. O webhook em `/api/stripe/webhook` recebe a confirmação do pagamento e atualiza o usuário no banco automaticamente.

Eventos escutados:
- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`

### Brevo
Usado para enviar o email de recuperação de senha. O remetente configurado é `atendimento@calcularq.com.br`.

---


---

## Comandos úteis de suporte

Todos os comandos abaixo consultam ou alteram o banco de dados em produção. Execute pelo terminal na pasta do projeto.

> 💡 Substitua `calcularq` pelo nome do seu banco configurado no `wrangler.toml` se for diferente.

---

### Usuários

**Buscar um usuário pelo email:**
```bash
npx wrangler d1 execute calcularq --remote --command "SELECT id, name, email, has_paid, payment_date, stripe_customer_id, created_at FROM users WHERE email = 'email@exemplo.com';"
```

**Listar todos os usuários:**
```bash
npx wrangler d1 execute calcularq --remote --command "SELECT id, name, email, has_paid, created_at FROM users ORDER BY created_at DESC;"
```

**Contar total de usuários cadastrados:**
```bash
npx wrangler d1 execute calcularq --remote --command "SELECT COUNT(*) as total FROM users;"
```

**Contar usuários que já pagaram:**
```bash
npx wrangler d1 execute calcularq --remote --command "SELECT COUNT(*) as pagantes FROM users WHERE has_paid = 1;"
```

---

### Pagamentos

**Liberar acesso manualmente para um usuário** (quando o pagamento foi confirmado fora do Stripe, por exemplo):
```bash
npx wrangler d1 execute calcularq --remote --command "UPDATE users SET has_paid = 1, payment_date = datetime('now') WHERE email = 'email@exemplo.com';"
```

**Revogar acesso de um usuário:**
```bash
npx wrangler d1 execute calcularq --remote --command "UPDATE users SET has_paid = 0, payment_date = NULL WHERE email = 'email@exemplo.com';"
```

**Verificar se um usuário específico pagou:**
```bash
npx wrangler d1 execute calcularq --remote --command "SELECT email, has_paid, payment_date FROM users WHERE email = 'email@exemplo.com';"
```

---

### Cálculos salvos

**Ver todos os cálculos de um usuário:**
```bash
npx wrangler d1 execute calcularq --remote --command "SELECT b.id, b.name, b.client_name, b.updated_at FROM budgets b JOIN users u ON b.user_id = u.id WHERE u.email = 'email@exemplo.com' ORDER BY b.updated_at DESC;"
```

**Contar quantos cálculos um usuário tem salvos:**
```bash
npx wrangler d1 execute calcularq --remote --command "SELECT COUNT(*) as total FROM budgets b JOIN users u ON b.user_id = u.id WHERE u.email = 'email@exemplo.com';"
```

**Excluir todos os cálculos de um usuário:**
```bash
npx wrangler d1 execute calcularq --remote --command "DELETE FROM budgets WHERE user_id = (SELECT id FROM users WHERE email = 'email@exemplo.com');"
```

---

### Reembolso

O prazo legal de reembolso é de 7 dias corridos a partir da data da compra, conforme o Código de Defesa do Consumidor.

**Passo a passo:**

1. Acesse o painel da Stripe em [dashboard.stripe.com](https://dashboard.stripe.com)
2. Vá em **Payments** e localize o pagamento pelo email do cliente
3. Clique no pagamento e depois em **Refund**
4. Confirme o valor e o motivo

O reembolso cai automaticamente no cartão do cliente em até 5 dias úteis. Após processar, revogue o acesso do usuário no banco:

```bash
npx wrangler d1 execute calcularq --remote --command "UPDATE users SET has_paid = 0, payment_date = NULL WHERE email = 'email@exemplo.com';"
```

### Redefinição de senha

**Ver tokens de redefinição de senha ativos:**
```bash
npx wrangler d1 execute calcularq --remote --command "SELECT u.email, rt.expires_at, rt.created_at FROM reset_tokens rt JOIN users u ON rt.user_id = u.id ORDER BY rt.created_at DESC;"
```

**Limpar tokens de senha expirados** (boa prática fazer periodicamente):
```bash
npx wrangler d1 execute calcularq --remote --command "DELETE FROM reset_tokens WHERE expires_at < datetime('now');"
```

**Forçar redefinição de senha de um usuário** (apaga a senha atual — o usuário precisará usar o fluxo de "esqueci minha senha"):
```bash
npx wrangler d1 execute calcularq --remote --command "UPDATE users SET password_hash = '' WHERE email = 'email@exemplo.com';"
```

---

### Excluir conta

**Excluir um usuário e todos os seus dados** (cálculos são apagados automaticamente por cascade):
```bash
npx wrangler d1 execute calcularq --remote --command "DELETE FROM users WHERE email = 'email@exemplo.com';"
```

---

### Banco de dados

**Ver o tamanho total do banco:**
```bash
npx wrangler d1 info calcularq --remote
```

**Fazer backup do banco de dados:**
```bash
npx wrangler d1 export calcularq --remote --output=backup-$(date +%Y%m%d).sql
```

## Boas práticas para este repositório

- **Nunca commite** chaves de API, senhas ou qualquer dado sensível
- **Nunca suba** as pastas `node_modules/` ou `dist/` (já estão no `.gitignore`)
- Sempre teste localmente antes de fazer push para `main`

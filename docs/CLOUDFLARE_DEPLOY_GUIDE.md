# Deploy no Cloudflare Pages + Pages Functions + D1 (Banco)

Este projeto foi adaptado para:
- **Frontend** (React/Vite) em **Cloudflare Pages**
- **Backend** (API) em **Cloudflare Pages Functions** (runtime Workers)
- **Banco** em **Cloudflare D1** (SQLite)

## 1) Criar o banco D1
1. Instale o Wrangler (ferramenta Cloudflare):
   - `npm i -g wrangler`
2. Faça login:
   - `wrangler login`
3. Crie o banco:
   - `wrangler d1 create calcularq`

Ele vai mostrar um `database_id`. Cole esse valor em `wrangler.toml` em:
`database_id = "..."`

## 2) Aplicar o schema (tabelas)
Rode:
- `wrangler d1 execute calcularq --file=./migrations/0001_init.sql`

## 3) Configurar variáveis/segredos (JWT)
No Cloudflare (ou via CLI), defina o segredo do JWT:
- `wrangler secret put JWT_SECRET`

Sugestão: use uma string grande (40+ caracteres).

## 4) Deploy no Pages
1. Suba este projeto para um repositório no GitHub (privado é ok).
2. Cloudflare Dashboard → **Pages** → **Create a project** → conecte seu GitHub repo.
3. Configure:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`

4. Em **Settings → Functions → D1 database bindings**
   - Binding name: `DB`
   - Selecione o banco `calcularq`

5. Em **Settings → Environment variables**
   - `JWT_SECRET` (se não usou `wrangler secret put`, pode colocar aqui)
   - (Opcional depois) Stripe/email

## 5) Teste
- Abra a URL do Pages
- Cadastre usuário
- Faça login
- Salve um cálculo e confira no histórico (agora é no banco)

## Observações importantes
- No runtime Workers não existe `bcrypt`. Por isso a senha é armazenada com **PBKDF2 (WebCrypto)**.
- Para facilitar os testes, o usuário novo nasce com `has_paid = 1` (sem paywall). Depois você pode mudar isso para 0 e integrar Stripe.

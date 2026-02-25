# Arquitetura da Calcularq

## 1. Visao geral

A aplicacao e dividida em duas partes principais:

- **Frontend (`src/`)**: interface React (Home, Calculadora, Manual, Auth, Payment, Meus calculos)
- **Backend (`functions/`)**: Cloudflare Pages Functions com auth, budgets, Stripe e recovery

Fluxo principal:
1. Usuario cria conta / faz login
2. Sessao e mantida por cookie HttpOnly
3. Paywall verifica `has_paid`
4. Usuario usa a calculadora em 4 etapas
5. Calculo pode ser salvo em `budgets`
6. Stripe webhook libera acesso em pagamento confirmado

---

## 2. Frontend (camadas)

### `src/pages`
Paginas de rota. Tendem a concentrar orquestracao de estado e layout.

Hotspots atuais:
- `src/pages/Calculator.tsx` (maior ponto de complexidade)
- `src/pages/Manual.tsx`
- `src/pages/BudgetsHistory.tsx`

### `src/components`
Componentes visuais e widgets reutilizaveis.

Destaques:
- `src/components/ui/AppDialog.tsx` -> padrao de dialog/modal
- `src/components/ui/Tooltip.tsx` -> tooltips responsivos com tones (`info`, `warning`)
- `src/components/calculator/*` -> componentes por etapa da calculadora

### `src/lib`
Infra de frontend:
- `api.ts` -> cliente da API
- `motion.ts` -> presets de animacao
- utilitarios de integracao e copy/behavior de support

### `src/types`
Tipos compartilhados (ex.: `BudgetData`, `CalculatorDraft`).

---

## 3. Backend (Cloudflare Pages Functions)

### Auth (`functions/api/auth/*`)
- login/register/logout
- forgot-password/reset-password
- sessoes e validacoes de origem
- cooldown / hardening basico

### Budgets (`functions/api/budgets/*`)
- CRUD dos calculos salvos por usuario
- ownership checks
- validacoes e limites de payload

### Stripe (`functions/api/stripe/*`)
- cria checkout session
- processa webhook com validacao de assinatura e idempotencia por evento

### Utils (`functions/api/_utils.js`)
- respostas JSON
- sessao JWT/cookie
- validacoes comuns
- helpers de seguranca

---

## 4. Fluxos importantes (frontend)

### Calculadora
- Draft local (`localStorage`) para uso em andamento
- Apos salvar calculo, draft pode ser limpo ao sair/recarregar
- Importacao por etapa a partir de calculo salvo
- Reset da etapa / reset do calculo (sem apagar budget salvo)

### Meus calculos
- Grid com busca/ordenacao
- Modal de detalhes (edicao de metadados + resumo de resultados)
- Abertura do calculo salvo pela calculadora via `?budget=`

### Manual
- Navegacao por etapas (stepper sticky desktop + sumario sticky mobile)
- Scroll sincronizado com progresso

---

## 5. Convencoes visuais e de UX

### Cores semanticas
- **Azul claro**: observacao / contexto / explicacao
- **Cinza (slate)**: resumo neutro / informativo
- **Ambar**: atencao / referencia que requer cautela

### Dialogs
Todos os popups novos devem preferir `AppDialog` para padronizacao de:
- overlay
- largura
- header/footer
- lock de scroll
- comportamento mobile/desktop

### Tooltips
- `tone="info" | "warning"`
- texto responsivo e sem overflow horizontal
- copy consistente com Manual

---

## 6. Riscos e hotspots atuais

1. `src/pages/Calculator.tsx` concentra muita logica e copy
2. Paginas longas (`Manual`, `Meus calculos`) ainda misturam estado + layout + copy
3. Ainda nao ha `lint`/`test` no fluxo padrao
4. Encoding/copy precisa de vigilancia (historico de mojibake)

---

## 7. Proxima refatoracao recomendada

### Curto prazo
- Extrair hooks de calculadora (`draft`, `import`, `progress`, `reset`)
- Extrair painel de resultados em container/componente separado
- Reduzir tamanho de `Calculator.tsx`

### Medio prazo
- Componentizar `Manual.tsx` e `BudgetsHistory.tsx`
- Adicionar ESLint + testes de smoke (Vitest)

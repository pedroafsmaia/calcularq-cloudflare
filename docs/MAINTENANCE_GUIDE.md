# Guia de Manutencao

## Objetivo

Este guia reduz regressao em um projeto que evoluiu rapido (muitas melhorias de UX, copy, dialogs, manual, stepper e seguranca) e hoje tem alguns hotspots grandes.

---

## 1. Checklist antes de editar

1. Rodar `git status`
2. Identificar se a mudanca toca `Calculator`, `Manual`, `BudgetsHistory` ou `Auth`
3. Entender impacto em:
   - mobile e desktop
   - tooltips/manual (copy)
   - dialogs
   - draft/import/reset da calculadora
4. Ao finalizar:
   - `npm run build`
   - backup pre-commit dos arquivos alterados
   - commit + push
5. Mensagens de commit devem seguir `type(scope): resumo` (ver `docs/COMMIT_STRATEGY.md`)

---

## 2. Hotspots (maior risco)

### `src/pages/Calculator.tsx`
Concentra:
- estado das 4 etapas
- draft local
- importacao por etapa
- reset/limpeza
- calculos de exibicao
- painel de resultados
- tooltips/copy
- dialogs

### `src/pages/Manual.tsx`
Concentra:
- conteudo longo
- navegacao sticky desktop/mobile
- progresso por scroll
- accordions
- copy e caixas semanticas

### `src/pages/BudgetsHistory.tsx`
Concentra:
- busca/ordenacao
- cards
- modal de detalhes
- edicao de metadados
- navegacao para calculadora

---

## 3. Regras praticas (UX / identidade visual)

### Dialogs e popups
- Preferir `AppDialog`
- Nao criar modal custom se nao for estritamente necessario
- Conferir comportamento mobile com barra inferior do navegador

### Tooltips e Manual
- Mudancas de copy em tooltip de referencia devem ser refletidas no Manual (etapa 4)
- `% do valor da obra` e `preco/m2` sao comparativos, nao foco do metodo
- Usar semantica de cor correta:
  - observacao = azul claro
  - resumo = slate
  - atencao = ambar

### Steppers (Calculadora / Manual)
- Nomes das etapas devem permanecer alinhados entre paginas
- Validar comportamento no desktop e mobile
- No Manual mobile, checar offset para nao cobrir o titulo da secao

---

## 4. Qualidade tecnica (recomendado)

### Proximo passo de organizacao (alto retorno)
1. Extrair tipos da calculadora (`BudgetData`, `CalculatorDraft`, payloads por etapa)
2. Extrair hooks:
   - `useCalculatorDraft`
   - `useCalculatorProgress`
   - `useCalculatorStepImport`
   - `useCalculatorReset`
3. Extrair `CalculatorResultsPanel`

### Testes de smoke (Vitest) sugeridos
- importacao por etapa (ordem atual 2/3 invertida)
- resetar etapa vs resetar calculo
- regressao do stepper ao limpar dados
- parse/restore de draft

### Lint
Adicionar `eslint` + script `npm run lint` para evitar regressao de:
- imports
- `any`
- padroes de hooks
- strings/formatacao basica

---

## 5. Seguranca / operacao

### Ja implementado
- origin checks em endpoints mutaveis
- validacao de email e senha minima
- cooldown em forgot-password
- validacoes/limites de budgets
- idempotencia de webhook Stripe

### Ainda recomendado
- rate limiting por IP/endpoint (Cloudflare WAF/KV/D1)
- observabilidade simples (logs padronizados e reduzidos em producao)
- revisao periodica de `npm audit` (separar `dev` vs runtime)

---

## 6. Checklist de release (curto)

1. `npm run build`
2. Conferir flows principais:
   - login
   - calculadora (4 etapas)
   - salvar calculo
   - meus calculos (detalhes)
   - manual (stepper/sumario)
3. Conferir mobile real (Android/iPhone) para dialogs e tooltips
4. Deploy Cloudflare e revisar log final (`Success: Your site was deployed!`)

---

## 7. Organizacao de commits (a partir de agora)

- Nao reescrever historico antigo de `main`.
- Organizar commits por tema em novas entregas.
- Separar `fix` de `style` quando o risco for diferente.
- Usar scopes previsiveis (`calculator`, `manual`, `home`, `auth`, `history`, `results`, `api`).

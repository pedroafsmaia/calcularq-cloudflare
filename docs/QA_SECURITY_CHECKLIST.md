# Check & Fix: Bugs e Segurança

Checklist prático para revisão contínua da Calcularq (QA visual/funcional + hardening de segurança).

## Como usar

- Marque itens como `OK`, `Pendente` ou `N/A`
- Registre links de issues/commits ao lado de cada item
- Priorize primeiro os blocos `Alto`

---

## 1. Bugs / UX / Funcionalidade

### Prioridade alta

- [ ] **Modal "Detalhes do cálculo" no mobile**
  - Check: sem corte no footer e sem conflito com barra inferior do navegador (Chrome/Brave/Safari)
  - Check: sem scroll estranho/duplo
  - Arquivos: `src/components/ui/AppDialog.tsx`, `src/pages/BudgetsHistory.tsx`

- [ ] **Sumário do Manual (mobile)**
  - Check: ao clicar em uma etapa, o sumário fecha automaticamente
  - Check: a seção abre com o topo do card visível (sem cobrir título/ícone)
  - Arquivo: `src/pages/Manual.tsx`

- [ ] **Tooltips de referência (calculadora)**
  - Check: `% do valor da obra`, `Preço/m²`, `Lucro estimado`, `Horas estimadas`
  - Check: comportamento em desktop e mobile, sem corte/overflow
  - Check: copy consistente com o Manual
  - Arquivos: `src/pages/Calculator.tsx`, `src/components/ui/Tooltip.tsx`, `src/pages/Manual.tsx`

### Prioridade média

- [ ] **Stepper Manual / Calculadora**
  - Check: etapa ativa atualiza no momento certo durante scroll/navegação
  - Check: sem atraso visual
  - Arquivos: `src/pages/Manual.tsx`, `src/pages/Calculator.tsx`

- [ ] **Popups / dialogs**
  - Check: overlay cobre a viewport inteira
  - Check: largura, header, footer e espaçamento seguem padrão visual
  - Check: `Esc` fecha e scroll do `body` fica travado ao abrir
  - Arquivos: `src/components/ui/AppDialog.tsx`, `src/components/LegalModal.tsx`, `src/pages/BudgetsHistory.tsx`, `src/components/calculator/SaveBudgetButton.tsx`

- [ ] **Meus cálculos (detalhes)**
  - Check: editar nome/cliente/descrição salva corretamente
  - Check: resumo no modal condiz com dados salvos
  - Arquivo: `src/pages/BudgetsHistory.tsx`

- [ ] **Calculadora: limpeza de dados**
  - Check: `Limpar dados da etapa` limpa apenas a etapa atual
  - Check: `Limpar todo o cálculo` reseta tudo + stepper + rascunho (`localStorage`)
  - Arquivo: `src/pages/Calculator.tsx`

### Prioridade baixa / polish

- [ ] **Estados de feedback**
  - Check: evitar `alert()`/`confirm()` nativos em fluxos principais
  - Sugestão: padronizar com dialogs/toasts do sistema
  - Arquivos: múltiplos (`src/pages/BudgetsHistory.tsx`, `src/pages/Calculator.tsx`, `src/pages/Payment.tsx`)

---

## 2. Segurança (backend / auth / dados)

### Prioridade alta

- [ ] **Rate limiting**
  - Aplicar em login, registro e recuperação de senha
  - Proteger contra brute force e abuso
  - Backend: `functions/api/auth/*`

- [ ] **Validação de payload (budgets)**
  - Validar tamanho e formato de `name`, `clientName`, `description`
  - Limitar arrays de despesas / tamanho total do payload
  - Backend: endpoints de budgets em `functions/api/*`

- [ ] **Controle de ownership nos budgets**
  - Garantir que o usuário só lê/edita/deleta cálculos próprios
  - Backend: endpoints de budgets

- [ ] **Forgot password (enumeração / spam)**
  - Resposta neutra (sem revelar se email existe)
  - Rate limit / cooldown por IP/email
  - Backend: `functions/api/auth/*`

### Prioridade média

- [ ] **Política de senha**
  - Revisar mínimo de caracteres (frontend e backend)
  - Considerar regra mínima mais forte (ex.: 8+)
  - Front: `src/pages/Login.tsx`, `src/pages/ResetPassword.tsx`
  - Back: auth endpoints

- [ ] **CSRF / proteção de endpoints mutáveis**
  - Verificar estratégia atual com cookie + `SameSite=Lax`
  - Considerar validação de `Origin` em endpoints críticos
  - Backend: auth/session + endpoints mutáveis

- [ ] **Logs sensíveis**
  - Revisar logs em produção para evitar exposição de dados pessoais/tokens
  - Front e back (especialmente fluxos de auth/pagamento)

### Prioridade baixa (higiene)

- [ ] **LocalStorage**
  - Confirmar que só dados não sensíveis são persistidos (drafts e "lembrar e-mail")
  - Verificar ausência de tokens/sessão no localStorage
  - Front: `src/pages/Calculator.tsx`, `src/pages/Login.tsx`

---

## 3. Rotina sugerida de revisão

### QA rápido (30 min)

- [ ] Desktop (normal + janela achatada)
- [ ] Mobile real (Android/iPhone)
- [ ] Modais principais
- [ ] Manual (stepper/sumário)
- [ ] Calculadora (tooltips / limpar etapa / limpar tudo)
- [ ] Meus cálculos (detalhes + edição)

### Hardening (bloco técnico separado)

- [ ] Rate limit
- [ ] Validação de payload
- [ ] Ownership
- [ ] Forgot password
- [ ] Revisão de logs

---

## 4. Observações

- Alertas do `npm audit` no deploy **não bloqueiam** o deploy, mas devem ser triados:
  - rodar `npm audit`
  - rodar `npm audit --omit=dev`
  - avaliar se o risco é runtime ou apenas tooling
- Evite `npm audit fix --force` sem revisão de impacto.


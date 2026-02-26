# Visual Identity Checklist

Guia rapido para revisar mudancas de UI sem quebrar a identidade visual do Calcularq.

## Objetivo

Garantir consistencia de:
- cores
- tipografia
- espacamentos
- bordas/arredondamento
- componentes (dialogs, toasts, buttons, headers)
- feedback visual (notas, avisos, estados vazios)

Use este checklist antes de concluir alteracoes visuais.

---

## 1. Paleta (regra geral)

### Cores principais
- `calcularq-blue` = cor principal da marca (`#001C57`)
- `calcularq-orange` = cor secundaria de CTA/pontos especificos

### Tons neutros (base do sistema)
- `slate-200/300` = bordas e campos
- `slate-500/600/700` = textos secundarios e corpo
- `slate-900` = titulos escuros / alta hierarquia

### Feedbacks (uso contextual)
- `blue-*` = informacao, observacao, referencia tecnica
- `red-*` = erro ou acao destrutiva
- `emerald-*` = sucesso (principalmente toasts)
- `amber-*` = warning forte (usar com moderacao)

### Regra importante (estado atual do produto)
- Referencias tecnicas da calculadora (ex.: `% do valor da obra`, `preco/m2`) usam **azul**, nao amber, para manter tom tecnico e coerencia visual.

---

## 2. Componentes obrigatorios (reusar antes de criar)

### Dialogs / Modais
- Reutilizar `AppDialog` (`src/components/ui/AppDialog.tsx`)
- Nao criar modal custom sem necessidade

Checklist:
- [ ] Overlay cobre viewport inteira
- [ ] Header, body e footer seguem mesmo spacing
- [ ] Scroll interno apenas quando necessario
- [ ] Mobile respeita safe areas

### Toasts
- Reutilizar `ToastProvider` (`src/components/ui/ToastProvider.tsx`)
- Tons suportados:
  - `success`
  - `error`
  - `info`

### Buttons
- Reutilizar `Button` (`src/components/ui/button.tsx`)
- Preferir variantes existentes:
  - `default`
  - `outline`
  - `ghost`

### Headers de secao (calculadora/manual)
- Reutilizar `SectionHeader`
- Reutilizar `ManualCard` / `NoteBox` no manual

---

## 3. Bordas, raio e sombra

### Cards principais
- `rounded-2xl border border-slate-200 bg-white shadow-sm`

### Inputs / selects / textareas
- `rounded-lg border border-slate-300`

### Buttons e chips
- `rounded-md` (ou `rounded-lg` quando contextual)

### Hover
- Evitar hover agressivo
- Preferir:
  - `hover:border-slate-300`
  - `hover:shadow-md` (nao exagerar)

---

## 4. Espacamento (padrao)

### Cards
- `p-5 sm:p-6` (padrao mais comum)

### Gaps
- `gap-3` = padrao entre elementos
- `gap-2` = elementos menores / linhas compactas

### Margens
- `mb-4` = separacao principal entre blocos
- `mb-2` = label -> campo

### Regra de layout
- Desktop e mobile podem ter composicoes diferentes, mas devem manter:
  - mesma tipografia base
  - mesma semantica de cor
  - mesma linguagem de borda/raio/sombra

---

## 5. Tipografia (hierarquia)

### Pagina / H1
- `text-2xl sm:text-3xl lg:text-4xl font-bold text-calcularq-blue`

### Secao / H2
- `text-xl sm:text-2xl font-bold text-calcularq-blue`

### Subtitulo / H3
- `text-base font-semibold text-slate-900`

### Corpo
- `text-sm sm:text-base text-slate-700 leading-relaxed`

### Pequeno / metadata
- `text-xs text-slate-500`

### Mobile (legibilidade)
- Evitar texto de leitura abaixo de `text-sm`
- `text-xs` apenas para badges, metadata e microcopy nao essencial

---

## 6. Notes / avisos / observacoes

### Resumo rapido (manual)
- Tom neutro (`slate`)

### Observacao (manual)
- Tom azul claro
- Ex.: `border-blue-200 bg-blue-50/70 text-blue-800`

### Aviso real (erro/destrutivo)
- Vermelho

### Referencia tecnica (calculadora)
- Preferir azul (nao amber), para manter tom tecnico

---

## 7. Animacao e interacao (resumo)

### Motion
- Usar presets de `src/lib/motion.ts`
- Preferir fade-only / transicoes suaves
- Evitar movimentos grandes na tela

### Hover
- Preferir `transition-colors`, `transition-shadow`
- Evitar `transition-all` quando possivel

### Focus
- Manter focus ring padronizado (`calcularq-blue/20`)

---

## 8. Checklist final antes de merge

- [ ] Usei componentes existentes (`AppDialog`, `Button`, `ToastProvider`, etc.)
- [ ] Cores respeitam a paleta do projeto
- [ ] Titulos e textos seguem a hierarquia tipografica
- [ ] Espacamentos seguem `p-5 sm:p-6`, `gap-3`, `mb-4` (ou variacao consistente)
- [ ] Mobile esta legivel (sem textos pequenos demais)
- [ ] Hover/focus/active estao consistentes
- [ ] Animacoes usam o padrao do projeto (suaves, sem deslocamentos fortes)

---

## Nota

Se houver conflito entre uma sugestao externa e este checklist, priorize:
1. componentes e padroes ja adotados no projeto
2. consistencia com Home + Calculadora + Manual
3. legibilidade em mobile

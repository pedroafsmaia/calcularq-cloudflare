# Feedback e Calibração V3.1.1 (DEMO)

## O que foi implementado
- Fluxo de pós-projeto em `Meus cálculos` para orçamentos da DEMO (`methodVersion` iniciando com `v3_demo`).
- Ação por card: `Finalizar projeto / Registrar horas reais`.
- Modal de fechamento com:
  - horas totais reais (obrigatório),
  - horas por etapa (opcional: briefing, EP, AP, EX, compatibilização, obra),
  - status de escopo (`as_planned`, `moderate`, `major`).
- Persistência via endpoint `PATCH /api/budgets/:id/close`.
- Ao fechar, o card passa a exibir `Finalizado em ...`.

## Campos novos no budget (JSON `data`)
- `methodVersion?: string`
- `suggestedH50?: number`
- `suggestedH80?: number`
- `actualHoursTotal?: number`
- `actualHoursByPhase?: { briefing?, ep?, ap?, ex?, compat?, obra? }`
- `scopeChange?: "as_planned" | "moderate" | "major"`
- `closedAt?: string` (ISO)
- `hasPhaseMismatch?: boolean`

## Backend e validações
- Novo endpoint: `functions/api/budgets/[id]/close.js`.
- Regras:
  - `actualHoursTotal > 0`.
  - `scopeChange` obrigatório e válido.
  - `actualHoursByPhase` opcional, com valores numéricos não negativos.
  - Se soma por etapa sair de `0.8x` a `1.2x` de `actualHoursTotal`, mantém salvamento e marca `hasPhaseMismatch=true`.
- Migração: `migrations/0003_budget_feedback_fields.sql` adiciona `closed_at` e índice por usuário.

## Calibração individual (`kUser`) da DEMO
- Apenas para cálculos DEMO finalizados (`closedAt`) e com `scopeChange != "major"`.
- Para cada cálculo elegível:
  - `ratio = actualHoursTotal / suggestedH50`.
- `kUser` é média ponderada por recência (projetos mais recentes têm maior peso).
- Aplicação no motor DEMO:
  - `H50_calibrado = H50 * kUser`
  - `H80_calibrado = H80 * kUser`
- Persistência inicial:
  - `localStorage`, chave por usuário: `calcularq_demo_k_user_<userId>`.

## Limitações atuais
- Calibração é local por navegador/dispositivo (ainda não centralizada em backend).
- Cálculos com `scopeChange = "major"` são excluídos da calibração.
- O fluxo não altera a calculadora clássica (`Calculator.tsx` + `PricingEngine.ts`).

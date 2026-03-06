# Implementacao Metodo 1.2

## Arquivos alterados

- `src/components/pricing/PricingEngineMethod10.ts`
- `src/components/pricing/PricingEngineMethod10.test.ts`
- `migrations/0006_method_1_2.sql`

## O que mudou

- Versionamento do motor atualizado para `1.2.0`.
- Parametros do metodo centralizados em `METHOD_12_PARAMS`.
- Novo componente fixo adicionado:
  - `H_fix = (18 * E_etapa) / (1 + (area / 15)^1.8)`.
- Nucleo de horas do projeto passou a ser hibrido:
  - `h_var = area * r(a) * M_det * T_tipologia * V_volumetria * E_etapa`
  - `h_fix = calcularComponenteFixa(area, e_etapa)`
  - `h_projeto = h_var + h_fix`
- Horas de obra preservadas e mantidas separadas, agora baseadas em `H_executivo` hibrido com `etapa = 0.85`.
- Incerteza, premio tecnico (A), `ht_aj`, arredondamento de horas e calculo de preco permanecem inalterados.
- Breakdown ampliado com `h_var` e `h_fix`, mantendo `h_projeto` e `h_obra`.
- Migration nova adicionada sem sobrescrever versoes anteriores em `method_versions`.

## Como validar

1. Rodar testes:
   - `npm test -- --run`
2. Rodar build:
   - `npm run build`
3. Conferir migration:
   - aplicar `migrations/0006_method_1_2.sql`
   - validar registro `version = '1.2.0'` em `method_versions`.


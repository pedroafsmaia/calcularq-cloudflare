# Método V3.1.1 na Calculadora DEMO

Este documento resume a implementação do método V3.1.1 aplicada **somente** à calculadora DEMO.

## Escopo da implementação

- Arquivos-alvo:
  - `src/components/pricing/PricingEngineDemo.ts`
  - `src/pages/CalculatorDemo.tsx`
  - `src/components/calculator/AreaFactorCard.tsx` (apenas props opcionais retrocompatíveis)
- A calculadora clássica (`Calculator.tsx` + `PricingEngine.ts`) não teve o comportamento alterado.

## Regras principais implementadas

1. **Área real (m²) como entrada principal**
- Na DEMO, o usuário informa apenas a área em m².
- O nível de área (F1) é classificado internamente por `calculateAreaLevel(area, intervals)`.
- A régua de intervalos da DEMO fica em modo somente leitura.

2. **Taxa ajustada (HT_aj) sem F3/F5**
- Fórmula aplicada:
  - `c_tech = (F4 - 1) / 4`
  - `HT_aj = HT_min * (1 + m0 + A * c_tech)`
- Parâmetro:
  - `A = 0.35`

3. **Horas-base até Executivo (H50_ateEX)**
- Produtividade por F1 (`r(F1)`):
  - F1=1: 1.80
  - F1=2: 1.30
  - F1=3: 1.15
  - F1=4: 1.10
  - F1=5: 1.00
- Multiplicador de detalhamento (`M_det(F3)`):
  - F3=1: 0.85
  - F3=2: 0.95
  - F3=3: 1.00
  - F3=4: 1.10
  - F3=5: 1.25
- Fórmula:
  - `H50_ateEX = area_m2 * r(F1) * M_det(F3)`

4. **Frações internas por etapa (até EX)**
- `briefing = 0.0385`
- `EP = 0.1346`
- `AP = 0.3462`
- `EX = 0.4808`

5. **Compatibilização (pós-Executivo)**
- Aplicada no stage 5.
- Fórmula:
  - `k_compat(F4) = 0.12 + 0.08 * ((F4 - 1) / 4)`
  - `H_compat,50 = k_compat(F4) * H_EX,50`

6. **Obra (F6) como módulo aditivo**
- Não multiplica o projeto inteiro.
- Fórmula:
  - `H_obra,50 = max(piso(F6,F1), t(F6) * H_EX,50)`
- `t(F6)`:
  - 1: 0.00
  - 2: 0.05
  - 3: 0.10
  - 4: 0.20
  - 5: 0.35
- `piso(F6,F1)`:
  - F6=1: `0h`
  - F6=2: `8h * (0.8 + 0.1*F1)`
  - F6=3: `16h * (0.8 + 0.1*F1)`
  - F6=4: `32h * (0.8 + 0.1*F1)`
  - F6=5: `60h * (0.8 + 0.1*F1)`

7. **Incerteza e cenário conservador**
- Fórmula:
  - `U = 0.20 + 0.05*((F4-1)/4) + 0.25*((F5-1)/4)`
- Resultado:
  - `H50` (estimativa central)
  - `H80 = round(H50 * (1 + U))` (conservador típico)

## Atualizações de UI na DEMO

- A etapa final passa a mostrar:
  - **Estimativa central (H50)**
  - **Conservador típico (H80)**
- `estimatedHours` pode receber autofill com H50 quando ainda não foi editado manualmente.
- Após edição manual, o campo não é sobrescrito automaticamente.

## Nota de compatibilidade

- O motor clássico permanece inalterado.
- `AreaFactorCard` recebeu props opcionais para suportar modo somente leitura sem quebrar telas existentes:
  - `allowEditIntervals` (default `true`)
  - `showIntervals` (default `true`)
  - `showAutoLevelBadge` (default `true`)

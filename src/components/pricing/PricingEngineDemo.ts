// PricingEngineDemo.ts
// Motor de cálculo do Calcularq Demo
// NÃO modificar PricingEngine.ts - este arquivo é independente

export const DEMO_PARAM_A = 0.35;
export const DEMO_PARAM_W3 = 0.5;

export const DEMO_PROFIT_PROFILES = {
  portfolio: { label: "Portfólio", m0: 0.1 },
  estabelecido: { label: "Estabelecido", m0: 0.15 },
  referencia: { label: "Referência", m0: 0.2 },
} as const;

export type DemoProfitProfileKey = keyof typeof DEMO_PROFIT_PROFILES;

export const DEMO_BASE_HOURS: Record<number, Record<number, [number, number]>> = {
  1: { 1: [4, 8], 2: [8, 20], 3: [15, 35], 4: [30, 70], 5: [20, 40] },
  2: { 1: [6, 12], 2: [15, 30], 3: [30, 70], 4: [60, 130], 5: [40, 80] },
  3: { 1: [8, 16], 2: [25, 50], 3: [60, 120], 4: [120, 260], 5: [80, 160] },
  4: { 1: [10, 20], 2: [40, 80], 3: [100, 180], 4: [220, 460], 5: [160, 300] },
  5: { 1: [16, 30], 2: [60, 120], 3: [150, 280], 4: [350, 700], 5: [280, 500] },
};

export const DEMO_F6_ADJUSTMENTS: Record<number, number> = {
  1: 1.0,
  2: 1.1,
  3: 1.25,
  4: 1.45,
  5: 1.7,
};

export const DEMO_F3_ADJUSTMENTS: Record<number, number> = {
  1: 0.85,
  2: 1.0,
  3: 1.15,
  4: 1.3,
  5: 1.5,
};

export function calculateCexp(l3: number, l4: number, l5: number): number {
  const w3 = DEMO_PARAM_W3;
  const w4 = 1.0;
  const w5 = 1.0;
  return (l3 * w3 + l4 * w4 + l5 * w5) / (w3 + w4 + w5);
}

export function normalizeCexp(cExp: number): number {
  return (cExp - 1) / 4;
}

export function calculateHTaj(htMin: number, m0: number, cExpNorm: number): number {
  return htMin * (1 + m0 + DEMO_PARAM_A * cExpNorm);
}

export function calculateHourSuggestion(
  areaLevel: number,
  stageLevel: number,
  f6Level: number,
  f3Level: number
): [number, number] | null {
  const base = DEMO_BASE_HOURS[areaLevel]?.[stageLevel];
  if (!base) return null;

  const adjF6 = DEMO_F6_ADJUSTMENTS[f6Level] ?? 1.0;
  const adjF3 = DEMO_F3_ADJUSTMENTS[f3Level] ?? 1.0;

  return [
    Math.round(base[0] * adjF6 * adjF3),
    Math.round(base[1] * adjF6 * adjF3),
  ];
}

export function calculateDemoProjectValue(
  htMin: number,
  m0: number,
  l3: number,
  l4: number,
  l5: number,
  estimatedHours: number,
  variableExpenses: number = 0,
  commercialDiscount: number = 0
): {
  cExp: number;
  cExpNorm: number;
  htAj: number;
  projectPrice: number;
  discountAmount: number;
  projectPriceWithDiscount: number;
  finalSalePrice: number;
  profit: number;
} {
  const cExp = calculateCexp(l3, l4, l5);
  const cExpNorm = normalizeCexp(cExp);
  const htAj = calculateHTaj(htMin, m0, cExpNorm);
  const projectPrice = htAj * estimatedHours;
  const discountAmount = projectPrice * (commercialDiscount / 100);
  const projectPriceWithDiscount = projectPrice - discountAmount;
  const finalSalePrice = projectPriceWithDiscount + variableExpenses;
  const profit = (htAj - htMin) * estimatedHours;

  return {
    cExp: Number(cExp.toFixed(2)),
    cExpNorm: Number(cExpNorm.toFixed(3)),
    htAj: Number(htAj.toFixed(2)),
    projectPrice: Number(projectPrice.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
    projectPriceWithDiscount: Number(projectPriceWithDiscount.toFixed(2)),
    finalSalePrice: Number(finalSalePrice.toFixed(2)),
    profit: Number(profit.toFixed(2)),
  };
}

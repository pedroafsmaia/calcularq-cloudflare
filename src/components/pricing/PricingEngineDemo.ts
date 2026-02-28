import { DEFAULT_AREA_INTERVALS, calculateAreaLevel, type AreaInterval } from "./PricingEngine";

export const DEMO_PARAM_A = 0.35;
export const DEMO_PARAM_W3 = 0.5;

export const DEMO_PROFIT_PROFILES = {
  portfolio: { label: "Portfólio", m0: 0.1 },
  estabelecido: { label: "Estabelecido", m0: 0.15 },
  referencia: { label: "Referência", m0: 0.2 },
} as const;

export type DemoProfitProfileKey = keyof typeof DEMO_PROFIT_PROFILES;

const AREA_PRODUCTIVITY_BY_LEVEL: Record<number, number> = {
  1: 1.8,
  2: 1.3,
  3: 1.15,
  4: 1.1,
  5: 1.0,
};

const DETAIL_MULTIPLIER_BY_LEVEL: Record<number, number> = {
  1: 0.85,
  2: 0.95,
  3: 1.0,
  4: 1.1,
  5: 1.25,
};

const STAGE_FRACTIONS = {
  briefing: 0.0385,
  ep: 0.1346,
  ap: 0.3462,
  ex: 0.4808,
} as const;

const WORKSITE_MULTIPLIER_BY_LEVEL: Record<number, number> = {
  1: 0.0,
  2: 0.05,
  3: 0.1,
  4: 0.2,
  5: 0.35,
};

const WORKSITE_FLOOR_BASE_BY_LEVEL: Record<number, number> = {
  1: 0,
  2: 8,
  3: 16,
  4: 32,
  5: 60,
};

const clampLevel = (value: number | null | undefined) => {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(5, Math.round(Number(value))));
};

const normalizeByFiveLevels = (level: number) => (clampLevel(level) - 1) / 4;

export type DemoHourSuggestionInput = {
  areaM2: number;
  areaLevel?: number;
  areaIntervals?: AreaInterval[];
  stageLevel: number;
  f3Level: number;
  f4Level: number;
  f5Level: number;
  f6Level: number;
};

export type DemoHourSuggestionBreakdown = {
  areaLevel: number;
  stageLevel: number;
  briefing: number;
  ep: number;
  ap: number;
  ex: number;
  compat: number;
  obra: number;
  h50AteEx: number;
  h50Etapa: number;
  uncertainty: number;
};

export type DemoHourSuggestionResult = {
  h50: number;
  h80: number;
  breakdown: DemoHourSuggestionBreakdown;
};

// Mantido para exibição histórica de "Complexidade Global" no painel.
export function calculateCexp(l3: number, l4: number, l5: number): number {
  const w3 = DEMO_PARAM_W3;
  const w4 = 1.0;
  const w5 = 1.0;
  return (l3 * w3 + l4 * w4 + l5 * w5) / (w3 + w4 + w5);
}

export function normalizeCexp(cExp: number): number {
  return (cExp - 1) / 4;
}

// V3.1.1: taxa ajustada depende apenas de HT_min, m0 e F4 (técnica).
export function calculateHTaj(htMin: number, m0: number, technicalLevel: number): number {
  const cTech = normalizeByFiveLevels(technicalLevel);
  return htMin * (1 + m0 + DEMO_PARAM_A * cTech);
}

const calculateCompatHours = (f4Level: number, hEx50: number) => {
  const kCompat = 0.12 + 0.08 * normalizeByFiveLevels(f4Level);
  return kCompat * hEx50;
};

const calculateWorksiteHours = (f6Level: number, f1Level: number, hEx50: number) => {
  const normalizedF1 = 0.8 + 0.1 * clampLevel(f1Level);
  const floorHours = (WORKSITE_FLOOR_BASE_BY_LEVEL[clampLevel(f6Level)] ?? 0) * normalizedF1;
  const proportionalHours = (WORKSITE_MULTIPLIER_BY_LEVEL[clampLevel(f6Level)] ?? 0) * hEx50;
  return Math.max(floorHours, proportionalHours);
};

const calculateUncertainty = (f4Level: number, f5Level: number) =>
  0.2 + 0.05 * normalizeByFiveLevels(f4Level) + 0.25 * normalizeByFiveLevels(f5Level);

export function calculateHourSuggestionV31(input: DemoHourSuggestionInput): DemoHourSuggestionResult | null {
  const areaM2 = Number(input.areaM2);
  if (!Number.isFinite(areaM2) || areaM2 <= 0) return null;

  const stageLevel = clampLevel(input.stageLevel);
  const f1Level =
    input.areaLevel && input.areaLevel > 0
      ? clampLevel(input.areaLevel)
      : calculateAreaLevel(areaM2, input.areaIntervals ?? DEFAULT_AREA_INTERVALS);

  const f3Level = clampLevel(input.f3Level);
  const f4Level = clampLevel(input.f4Level);
  const f5Level = clampLevel(input.f5Level);
  const f6Level = clampLevel(input.f6Level);

  const productivity = AREA_PRODUCTIVITY_BY_LEVEL[f1Level] ?? AREA_PRODUCTIVITY_BY_LEVEL[3];
  const detailMultiplier = DETAIL_MULTIPLIER_BY_LEVEL[f3Level] ?? DETAIL_MULTIPLIER_BY_LEVEL[3];
  const h50AteEx = areaM2 * productivity * detailMultiplier;

  const briefing = h50AteEx * STAGE_FRACTIONS.briefing;
  const ep = h50AteEx * STAGE_FRACTIONS.ep;
  const ap = h50AteEx * STAGE_FRACTIONS.ap;
  const ex = h50AteEx * STAGE_FRACTIONS.ex;

  const hStage1 = briefing;
  const hStage2 = briefing + ep;
  const hStage3 = briefing + ep + ap;
  const hStage4 = briefing + ep + ap + ex;

  const compat = calculateCompatHours(f4Level, ex);
  const hStage5 = hStage4 + compat;

  const hEtapaBase =
    stageLevel === 1 ? hStage1
      : stageLevel === 2 ? hStage2
        : stageLevel === 3 ? hStage3
          : stageLevel === 4 ? hStage4
            : hStage5;

  // Obra é módulo aditivo (não multiplicador global).
  const obra = stageLevel >= 4 ? calculateWorksiteHours(f6Level, f1Level, ex) : 0;
  const h50Etapa = hEtapaBase + obra;

  const uncertainty = calculateUncertainty(f4Level, f5Level);
  const h50 = Math.max(0, Math.round(h50Etapa));
  const h80 = Math.max(h50, Math.round(h50Etapa * (1 + uncertainty)));

  return {
    h50,
    h80,
    breakdown: {
      areaLevel: f1Level,
      stageLevel,
      briefing: Number(briefing.toFixed(2)),
      ep: Number(ep.toFixed(2)),
      ap: Number(ap.toFixed(2)),
      ex: Number(ex.toFixed(2)),
      compat: Number(compat.toFixed(2)),
      obra: Number(obra.toFixed(2)),
      h50AteEx: Number(h50AteEx.toFixed(2)),
      h50Etapa: Number(h50Etapa.toFixed(2)),
      uncertainty: Number(uncertainty.toFixed(4)),
    },
  };
}

// Compatibilidade com chamadas antigas (retorna [H50, H80]).
export function calculateHourSuggestion(
  areaLevel: number,
  stageLevel: number,
  f6Level: number,
  f3Level: number
): [number, number] | null {
  const baseAreaForLevel: Record<number, number> = {
    1: 30,
    2: 100,
    3: 300,
    4: 700,
    5: 1300,
  };

  const simulated = calculateHourSuggestionV31({
    areaM2: baseAreaForLevel[clampLevel(areaLevel)] ?? 300,
    areaLevel,
    stageLevel,
    f3Level,
    f4Level: 3,
    f5Level: 3,
    f6Level,
  });
  if (!simulated) return null;
  return [simulated.h50, simulated.h80];
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
  const safeEstimatedHours = Number.isFinite(estimatedHours) ? Math.max(0, estimatedHours) : 0;
  const safeVariableExpenses = Number.isFinite(variableExpenses) ? Math.max(0, variableExpenses) : 0;
  const safeDiscount = Number.isFinite(commercialDiscount)
    ? Math.max(0, Math.min(100, commercialDiscount))
    : 0;

  // cExp fica disponível para leitura histórica no painel.
  const cExp = calculateCexp(l3, l4, l5);
  const cExpNorm = normalizeCexp(cExp);
  const htAj = calculateHTaj(htMin, m0, l4);
  const projectPrice = htAj * safeEstimatedHours;
  const discountAmount = projectPrice * (safeDiscount / 100);
  const projectPriceWithDiscount = projectPrice - discountAmount;
  const finalSalePrice = projectPriceWithDiscount + safeVariableExpenses;
  const profit = (htAj - htMin) * safeEstimatedHours;

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

// Sanity check opcional para depuração local.
export function runDemoV31SanityChecks(): { monotonicArea: boolean; smoothBoundary: boolean } {
  const stageLevel = 4;
  const f3Level = 3;
  const f4Level = 3;
  const f5Level = 3;
  const f6Level = 3;
  const intervals = DEFAULT_AREA_INTERVALS;

  const h149 = calculateHourSuggestionV31({
    areaM2: 149,
    areaIntervals: intervals,
    stageLevel,
    f3Level,
    f4Level,
    f5Level,
    f6Level,
  });
  const h150 = calculateHourSuggestionV31({
    areaM2: 150,
    areaIntervals: intervals,
    stageLevel,
    f3Level,
    f4Level,
    f5Level,
    f6Level,
  });
  const h151 = calculateHourSuggestionV31({
    areaM2: 151,
    areaIntervals: intervals,
    stageLevel,
    f3Level,
    f4Level,
    f5Level,
    f6Level,
  });

  const monotonicArea =
    !!h149 && !!h150 && !!h151 && h150.h50 >= h149.h50 && h151.h50 >= h150.h50;
  const smoothBoundary =
    !!h149 &&
    !!h150 &&
    Math.abs(h150.h50 - h149.h50) <= Math.max(20, Math.round(h149.h50 * 0.2));

  return { monotonicArea, smoothBoundary };
}

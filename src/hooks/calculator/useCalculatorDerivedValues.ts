import { useEffect, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { ExpenseItem } from "@/types/budget";
import type { CenarioMethod10 } from "@/components/pricing/PricingEngineMethod12";
import { calcularMethod10, reformFromLevel, tipologiaFromLevel } from "@/components/pricing/PricingEngineMethod12";
import { calculateGlobalComplexity, type AreaInterval, type Factor } from "@/components/pricing/PricingEngine";

type CalculatorDisplayValues = {
  totalVariableExpenses: number;
  adjustedHourlyRate: number;
  projectPrice: number;
  projectPriceWithDiscount: number;
  discountAmount: number;
  finalSalePrice: number;
  profit: number | null;
};

type Params = {
  minHourlyRate: number | null;
  profitMargin: number;
  technicalPremium: number;
  factors: Factor[];
  areaIntervals: AreaInterval[];
  area: number | null;
  selections: Record<string, number>;
  cenarioEscolhido: CenarioMethod10;
  horasManuais: number | null;
  commercialDiscount: number;
  variableExpenses: ExpenseItem[];
  setEstimatedHours: Dispatch<SetStateAction<number>>;
};

const REQUIRED_SELECTION_IDS = [
  "area",
  "tipology",
  "volumetry",
  "stage",
  "monitoring",
  "detail",
  "technical",
  "bureaucratic",
] as const;

export function useCalculatorDerivedValues({
  minHourlyRate,
  profitMargin,
  technicalPremium,
  factors,
  areaIntervals,
  area,
  selections,
  cenarioEscolhido,
  horasManuais,
  commercialDiscount,
  variableExpenses,
  setEstimatedHours,
}: Params) {
  const hasComplexitySelections = REQUIRED_SELECTION_IDS.every((id) => Number(selections[id]) > 0);
  const totalFactors = REQUIRED_SELECTION_IDS.length;
  const selectedFactorsCount = REQUIRED_SELECTION_IDS.filter((id) => Number(selections[id]) > 0).length;

  const methodInputs = useMemo(() => {
    if (!minHourlyRate || minHourlyRate <= 0 || !area || area <= 0) return null;
    if (!hasComplexitySelections) return null;

    return {
      ht_min: minHourlyRate,
      margem_lucro: profitMargin,
      area,
      etapa: Number(selections.stage ?? 1),
      tipologia: tipologiaFromLevel(Number(selections.tipology ?? 1)),
      volumetria: Number(selections.volumetry ?? 1),
      reforma: reformFromLevel(Number(selections.reform ?? 1)),
      f3_detalhamento: Number(selections.detail ?? 1),
      f4_tecnica: Number(selections.technical ?? 1),
      f5_burocracia: Number(selections.bureaucratic ?? 1),
      f6_obra: Number(selections.monitoring ?? 1),
      cenario: cenarioEscolhido,
      A: technicalPremium,
    } as const;
  }, [area, cenarioEscolhido, hasComplexitySelections, minHourlyRate, profitMargin, selections, technicalPremium]);

  const methodOutputSuggested = useMemo(() => {
    if (!methodInputs) return null;

    try {
      return calcularMethod10(methodInputs);
    } catch {
      return null;
    }
  }, [methodInputs]);

  const methodOutput = useMemo(() => {
    if (!methodInputs) return null;

    try {
      return calcularMethod10({
        ...methodInputs,
        h_usuario_manual: horasManuais ?? undefined,
      });
    } catch {
      return null;
    }
  }, [horasManuais, methodInputs]);

  useEffect(() => {
    if (!methodOutput) return;
    setEstimatedHours(methodOutput.h_final);
  }, [methodOutput, setEstimatedHours]);

  const complexityScore = useMemo(() => {
    if (methodOutput) return methodOutput.score_complexidade;
    const legacyComplexity = calculateGlobalComplexity(factors, selections);
    if (!Number.isFinite(legacyComplexity) || legacyComplexity <= 0) return 0;
    return Math.round((legacyComplexity / 5) * 100);
  }, [factors, methodOutput, selections]);

  const displayValues = useMemo<CalculatorDisplayValues>(() => {
    if (!methodOutput || !minHourlyRate || minHourlyRate <= 0) {
      return {
        totalVariableExpenses: 0,
        adjustedHourlyRate: 0,
        projectPrice: 0,
        projectPriceWithDiscount: 0,
        discountAmount: 0,
        finalSalePrice: 0,
        profit: null,
      };
    }

    const adjustedHourlyRate = methodOutput.ht_aj;
    const projectPrice = methodOutput.preco_final;
    const totalVariableExpenses = variableExpenses.reduce((sum, expense) => sum + (Number(expense.value) || 0), 0);
    const sanitizedCommercialDiscount = Math.min(100, Math.max(0, Number(commercialDiscount) || 0));
    const discountAmount = projectPrice * (sanitizedCommercialDiscount / 100);
    const projectPriceWithDiscount = projectPrice - discountAmount;
    const finalSalePrice = projectPriceWithDiscount + totalVariableExpenses;
    const profit = ((adjustedHourlyRate - minHourlyRate) * methodOutput.h_final) - discountAmount;

    return {
      totalVariableExpenses,
      adjustedHourlyRate,
      projectPrice,
      projectPriceWithDiscount,
      discountAmount,
      finalSalePrice,
      profit: Number(profit.toFixed(2)),
    };
  }, [commercialDiscount, methodOutput, minHourlyRate, variableExpenses]);

  const effectiveAreaForCub = useMemo(() => {
    if (typeof area === "number" && Number.isFinite(area) && area > 0) return area;

    const selectedAreaLevel = Number(selections.area);
    if (!Number.isFinite(selectedAreaLevel) || selectedAreaLevel <= 0) return null;

    const interval = areaIntervals.find((item) => item.level === selectedAreaLevel);
    if (!interval) return null;

    if (typeof interval.max === "number" && interval.max > interval.min) {
      return (interval.min + interval.max) / 2;
    }

    return interval.min > 0 ? interval.min : null;
  }, [area, areaIntervals, selections.area]);

  const pricePerSqm = useMemo(() => {
    if (!effectiveAreaForCub || effectiveAreaForCub <= 0 || displayValues.finalSalePrice <= 0) return null;
    return displayValues.finalSalePrice / effectiveAreaForCub;
  }, [displayValues.finalSalePrice, effectiveAreaForCub]);

  return {
    hasComplexitySelections,
    totalFactors,
    selectedFactorsCount,
    methodOutputSuggested,
    methodOutput,
    complexityScore,
    displayValues,
    pricePerSqm,
  };
}

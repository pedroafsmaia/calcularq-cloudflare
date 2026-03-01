import { useEffect, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

type UseCalculatorProgressParams = {
  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  setMaxStepReached: Dispatch<SetStateAction<number>>;
  minHourlyRate: number | null;
  hasComplexitySelections: boolean;
  finalSalePrice: number;
  includeWeightStep?: boolean;
};

export function getMaxStepReachedFromState(params: {
  minHourlyRate: number | null;
  hasComplexitySelections: boolean;
  includeWeightStep?: boolean;
}) {
  const includeWeightStep = params.includeWeightStep ?? true;
  const hasMinHour = !!(params.minHourlyRate && params.minHourlyRate > 0);
  if (!hasMinHour) return 1;
  if (!params.hasComplexitySelections) return 2;
  return includeWeightStep ? 4 : 3;
}

export function useCalculatorProgress({
  currentStep,
  setCurrentStep,
  setMaxStepReached,
  minHourlyRate,
  hasComplexitySelections,
  finalSalePrice,
  includeWeightStep = true,
}: UseCalculatorProgressParams) {
  const stepComplete = useMemo(
    () => (n: number) => {
      if (n === 1) return !!(minHourlyRate && minHourlyRate > 0);
      if (n === 2) return hasComplexitySelections;
      if (includeWeightStep && n === 3) return true;
      return finalSalePrice > 0;
    },
    [finalSalePrice, hasComplexitySelections, includeWeightStep, minHourlyRate]
  );

  useEffect(() => {
    const nextMaxStepReached = getMaxStepReachedFromState({
      minHourlyRate,
      hasComplexitySelections,
      includeWeightStep,
    });

    setMaxStepReached((prev) => (prev === nextMaxStepReached ? prev : nextMaxStepReached));

    if (currentStep > nextMaxStepReached) {
      setCurrentStep(nextMaxStepReached);
    }
  }, [
    currentStep,
    hasComplexitySelections,
    includeWeightStep,
    minHourlyRate,
    setCurrentStep,
    setMaxStepReached,
  ]);

  const canAdvance = stepComplete(currentStep);
  const stepVisualDone = (n: number, maxStepReached: number) => maxStepReached > n;

  return { stepComplete, canAdvance, stepVisualDone };
}

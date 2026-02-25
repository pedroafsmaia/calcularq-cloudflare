import { useEffect, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";

type UseCalculatorProgressParams = {
  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  setMaxStepReached: Dispatch<SetStateAction<number>>;
  minHourlyRate: number | null;
  hasComplexitySelections: boolean;
  finalSalePrice: number;
};

export function useCalculatorProgress({
  currentStep,
  setCurrentStep,
  setMaxStepReached,
  minHourlyRate,
  hasComplexitySelections,
  finalSalePrice,
}: UseCalculatorProgressParams) {
  const stepComplete = useMemo(
    () => (n: number) => {
      if (n === 1) return !!(minHourlyRate && minHourlyRate > 0);
      if (n === 2) return hasComplexitySelections;
      if (n === 3) return true; // opcional
      return finalSalePrice > 0;
    },
    [finalSalePrice, hasComplexitySelections, minHourlyRate]
  );

  useEffect(() => {
    // A etapa 3 é opcional; a etapa 4 pode ser acessada após concluir a etapa 2.
    const nextMaxStepReached = !stepComplete(1) ? 1 : stepComplete(2) ? 4 : 2;

    setMaxStepReached((prev) => (prev === nextMaxStepReached ? prev : nextMaxStepReached));

    if (currentStep > nextMaxStepReached) {
      setCurrentStep(nextMaxStepReached);
    }
  }, [currentStep, setCurrentStep, setMaxStepReached, stepComplete]);

  const canAdvance = stepComplete(currentStep);
  const stepVisualDone = (n: number, maxStepReached: number) => maxStepReached > n;

  return { stepComplete, canAdvance, stepVisualDone };
}

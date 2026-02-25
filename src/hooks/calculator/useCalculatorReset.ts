import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { ExpenseItem } from "@/types/budget";
import type { Factor, AreaInterval } from "@/components/pricing/PricingEngine";
import { clearCalculatorDraft } from "@/lib/calculatorDraft";

type Params = {
  currentStep: number;
  defaultFactors: Factor[];
  defaultAreaIntervals: AreaInterval[];
  setConfirmClearStepOpen: Dispatch<SetStateAction<boolean>>;
  setConfirmClearAllOpen: Dispatch<SetStateAction<boolean>>;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  setMaxStepReached: Dispatch<SetStateAction<number>>;
  setMinHourlyRate: Dispatch<SetStateAction<number | null>>;
  setUseManualMinHourlyRate: Dispatch<SetStateAction<boolean>>;
  setFixedExpenses: Dispatch<SetStateAction<ExpenseItem[]>>;
  setPersonalExpenses: Dispatch<SetStateAction<ExpenseItem[]>>;
  setProLabore: Dispatch<SetStateAction<number>>;
  setProductiveHours: Dispatch<SetStateAction<number>>;
  setFactors: Dispatch<SetStateAction<Factor[]>>;
  setAreaIntervals: Dispatch<SetStateAction<AreaInterval[]>>;
  setArea: Dispatch<SetStateAction<number | null>>;
  setSelections: Dispatch<SetStateAction<Record<string, number>>>;
  setEstimatedHours: Dispatch<SetStateAction<number>>;
  setCommercialDiscount: Dispatch<SetStateAction<number>>;
  setVariableExpenses: Dispatch<SetStateAction<ExpenseItem[]>>;
};

export function useCalculatorReset({
  currentStep,
  defaultFactors,
  defaultAreaIntervals,
  setConfirmClearStepOpen,
  setConfirmClearAllOpen,
  setCurrentStep,
  setMaxStepReached,
  setMinHourlyRate,
  setUseManualMinHourlyRate,
  setFixedExpenses,
  setPersonalExpenses,
  setProLabore,
  setProductiveHours,
  setFactors,
  setAreaIntervals,
  setArea,
  setSelections,
  setEstimatedHours,
  setCommercialDiscount,
  setVariableExpenses,
}: Params) {
  const handleConfirmClearCurrentStep = useCallback(() => {
    if (currentStep === 1) {
      setMinHourlyRate(null);
      setUseManualMinHourlyRate(false);
      setFixedExpenses([]);
      setPersonalExpenses([]);
      setProLabore(0);
      setProductiveHours(0);
      return;
    }

    if (currentStep === 2) {
      setArea(null);
      setSelections({});
      setAreaIntervals(defaultAreaIntervals);
      return;
    }

    if (currentStep === 3) {
      setFactors(defaultFactors);
      return;
    }

    if (currentStep === 4) {
      setEstimatedHours(0);
      setCommercialDiscount(0);
      setVariableExpenses([]);
    }
  }, [
    currentStep,
    defaultAreaIntervals,
    defaultFactors,
    setArea,
    setAreaIntervals,
    setCommercialDiscount,
    setEstimatedHours,
    setFactors,
    setFixedExpenses,
    setMinHourlyRate,
    setPersonalExpenses,
    setProLabore,
    setProductiveHours,
    setSelections,
    setUseManualMinHourlyRate,
    setVariableExpenses,
  ]);

  const handleClearCurrentStep = useCallback(() => {
    setConfirmClearStepOpen(true);
  }, [setConfirmClearStepOpen]);

  const handleConfirmResetCalculation = useCallback(() => {
    setMinHourlyRate(null);
    setUseManualMinHourlyRate(false);
    setFixedExpenses([]);
    setPersonalExpenses([]);
    setProLabore(0);
    setProductiveHours(0);

    setFactors(defaultFactors);
    setAreaIntervals(defaultAreaIntervals);
    setArea(null);
    setSelections({});

    setEstimatedHours(0);
    setCommercialDiscount(0);
    setVariableExpenses([]);

    setCurrentStep(1);
    setMaxStepReached(1);

    clearCalculatorDraft();
  }, [
    defaultAreaIntervals,
    defaultFactors,
    setArea,
    setAreaIntervals,
    setCommercialDiscount,
    setCurrentStep,
    setEstimatedHours,
    setFactors,
    setFixedExpenses,
    setMaxStepReached,
    setMinHourlyRate,
    setPersonalExpenses,
    setProLabore,
    setProductiveHours,
    setSelections,
    setUseManualMinHourlyRate,
    setVariableExpenses,
  ]);

  const handleResetCalculation = useCallback(() => {
    setConfirmClearAllOpen(true);
  }, [setConfirmClearAllOpen]);

  return {
    handleConfirmClearCurrentStep,
    handleClearCurrentStep,
    handleConfirmResetCalculation,
    handleResetCalculation,
  };
}

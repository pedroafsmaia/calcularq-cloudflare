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
  setProfitMargin?: Dispatch<SetStateAction<number>>;
  setFixedExpenses: Dispatch<SetStateAction<ExpenseItem[]>>;
  setPersonalExpenses: Dispatch<SetStateAction<ExpenseItem[]>>;
  setProLabore: Dispatch<SetStateAction<number>>;
  setProductiveHours: Dispatch<SetStateAction<number>>;
  setProfitProfile?: Dispatch<SetStateAction<"portfolio" | "estabelecido" | "referencia">>;
  setFactors: Dispatch<SetStateAction<Factor[]>>;
  setAreaIntervals: Dispatch<SetStateAction<AreaInterval[]>>;
  setArea: Dispatch<SetStateAction<number | null>>;
  setSelections: Dispatch<SetStateAction<Record<string, number>>>;
  setEstimatedHours: Dispatch<SetStateAction<number>>;
  setCenarioEscolhido?: Dispatch<SetStateAction<"conservador" | "otimista">>;
  setHorasManuais?: Dispatch<SetStateAction<number | null>>;
  setCommercialDiscount: Dispatch<SetStateAction<number>>;
  setVariableExpenses: Dispatch<SetStateAction<ExpenseItem[]>>;
  hasWeightStep?: boolean;
  finalStepNumber?: number;
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
  setProfitMargin,
  setFixedExpenses,
  setPersonalExpenses,
  setProLabore,
  setProductiveHours,
  setProfitProfile,
  setFactors,
  setAreaIntervals,
  setArea,
  setSelections,
  setEstimatedHours,
  setCenarioEscolhido,
  setHorasManuais,
  setCommercialDiscount,
  setVariableExpenses,
  hasWeightStep = true,
  finalStepNumber = 4,
}: Params) {
  const handleConfirmClearCurrentStep = useCallback(() => {
    if (currentStep === 1) {
      setMinHourlyRate(null);
      setUseManualMinHourlyRate(false);
      if (setProfitMargin) setProfitMargin(0.15);
      setFixedExpenses([]);
      setPersonalExpenses([]);
      setProLabore(0);
      setProductiveHours(0);
      if (setProfitProfile) setProfitProfile("estabelecido");
      return;
    }

    if (currentStep === 2) {
      setArea(null);
      setSelections({});
      setAreaIntervals(defaultAreaIntervals);
      return;
    }

    if (hasWeightStep && currentStep === 3) {
      setFactors(defaultFactors);
      return;
    }

    if (currentStep === finalStepNumber) {
      setEstimatedHours(0);
      if (setCenarioEscolhido) setCenarioEscolhido("conservador");
      if (setHorasManuais) setHorasManuais(null);
      setCommercialDiscount(0);
      setVariableExpenses([]);
    }
  }, [
    currentStep,
    defaultAreaIntervals,
    defaultFactors,
    finalStepNumber,
    hasWeightStep,
    setArea,
    setAreaIntervals,
    setCenarioEscolhido,
    setCommercialDiscount,
    setEstimatedHours,
    setFactors,
    setFixedExpenses,
    setHorasManuais,
    setMinHourlyRate,
    setPersonalExpenses,
    setProLabore,
    setProductiveHours,
    setProfitMargin,
    setProfitProfile,
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
    if (setProfitMargin) setProfitMargin(0.15);
    setFixedExpenses([]);
    setPersonalExpenses([]);
    setProLabore(0);
    setProductiveHours(0);
    if (setProfitProfile) setProfitProfile("estabelecido");

    setFactors(defaultFactors);
    setAreaIntervals(defaultAreaIntervals);
    setArea(null);
    setSelections({});

    setEstimatedHours(0);
    if (setCenarioEscolhido) setCenarioEscolhido("conservador");
    if (setHorasManuais) setHorasManuais(null);
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
    setCenarioEscolhido,
    setCommercialDiscount,
    setCurrentStep,
    setEstimatedHours,
    setFactors,
    setFixedExpenses,
    setHorasManuais,
    setMaxStepReached,
    setMinHourlyRate,
    setPersonalExpenses,
    setProLabore,
    setProductiveHours,
    setProfitMargin,
    setProfitProfile,
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

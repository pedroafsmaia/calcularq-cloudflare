import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Budget } from "@/lib/api";
import type { BudgetData, ExpenseItem } from "@/types/budget";
import type { Factor, AreaInterval } from "@/components/pricing/PricingEngine";

type Params = {
  currentStep: number;
  savedBudgets: Budget[];
  selectedImportBudgetId: string;
  setSelectedImportBudgetId: Dispatch<SetStateAction<string>>;
  setImportStepDialogOpen: Dispatch<SetStateAction<boolean>>;
  areaIntervals: AreaInterval[];
  defaultFactors: Factor[];
  setMinHourlyRate: Dispatch<SetStateAction<number | null>>;
  setUseManualMinHourlyRate: Dispatch<SetStateAction<boolean>>;
  setFixedExpenses: Dispatch<SetStateAction<ExpenseItem[]>>;
  setPersonalExpenses: Dispatch<SetStateAction<ExpenseItem[]>>;
  setProLabore: Dispatch<SetStateAction<number>>;
  setProductiveHours: Dispatch<SetStateAction<number>>;
  setAreaIntervals: Dispatch<SetStateAction<AreaInterval[]>>;
  setSelections: Dispatch<SetStateAction<Record<string, number>>>;
  setArea: Dispatch<SetStateAction<number | null>>;
  setFactors: Dispatch<SetStateAction<Factor[]>>;
  setEstimatedHours: Dispatch<SetStateAction<number>>;
  setCommercialDiscount: Dispatch<SetStateAction<number>>;
  setVariableExpenses: Dispatch<SetStateAction<ExpenseItem[]>>;
};

export function useCalculatorStepImport({
  currentStep,
  savedBudgets,
  selectedImportBudgetId,
  setSelectedImportBudgetId,
  setImportStepDialogOpen,
  areaIntervals,
  defaultFactors,
  setMinHourlyRate,
  setUseManualMinHourlyRate,
  setFixedExpenses,
  setPersonalExpenses,
  setProLabore,
  setProductiveHours,
  setAreaIntervals,
  setSelections,
  setArea,
  setFactors,
  setEstimatedHours,
  setCommercialDiscount,
  setVariableExpenses,
}: Params) {
  const applyCurrentStepFromBudgetData = useCallback(
    (sourceData: BudgetData) => {
      if (!sourceData) return;

      if (currentStep === 1) {
        setMinHourlyRate(sourceData.minHourlyRate ?? null);
        setUseManualMinHourlyRate(Boolean(sourceData.useManualMinHourlyRate));
        setFixedExpenses(Array.isArray(sourceData.fixedExpenses) ? sourceData.fixedExpenses : []);
        setPersonalExpenses(Array.isArray(sourceData.personalExpenses) ? sourceData.personalExpenses : []);
        setProLabore(typeof sourceData.proLabore === "number" ? sourceData.proLabore : 0);
        setProductiveHours(typeof sourceData.productiveHours === "number" ? sourceData.productiveHours : 0);
        return;
      }

      if (currentStep === 2) {
        if (Array.isArray(sourceData.areaIntervals)) setAreaIntervals(sourceData.areaIntervals);
        if (sourceData.selections) setSelections(sourceData.selections);

        if (typeof sourceData.area === "number" && Number.isFinite(sourceData.area)) {
          setArea(sourceData.area);
        } else {
          const areaLevel = Number(sourceData.selections?.area ?? sourceData.factors?.find?.((f) => f.id === "area")?.level);
          const sourceIntervals = Array.isArray(sourceData.areaIntervals) ? sourceData.areaIntervals : areaIntervals;
          const interval = sourceIntervals.find((i) => i.level === areaLevel);
          if (interval) {
            const max = typeof interval.max === "number" ? interval.max : interval.min;
            setArea((interval.min + max) / 2);
          } else {
            setArea(null);
          }
        }
        return;
      }

      if (currentStep === 3) {
        if (Array.isArray(sourceData.factors)) {
          setFactors(
            defaultFactors.map((df) => {
              const saved = sourceData.factors.find((f) => f.id === df.id);
              return saved ? { ...df, weight: saved.weight } : df;
            })
          );
        }
        return;
      }

      if (currentStep === 4) {
        setEstimatedHours(typeof sourceData.estimatedHours === "number" ? sourceData.estimatedHours : 0);
        setCommercialDiscount(typeof sourceData.commercialDiscount === "number" ? sourceData.commercialDiscount : 0);
        setVariableExpenses(Array.isArray(sourceData.variableExpenses) ? sourceData.variableExpenses : []);
      }
    },
    [
      areaIntervals,
      currentStep,
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
    ]
  );

  const handleImportCurrentStepFromSelectedBudget = useCallback(() => {
    if (!selectedImportBudgetId) return;
    const sourceBudget = savedBudgets.find((b) => b.id === selectedImportBudgetId);
    if (!sourceBudget?.data) return;
    applyCurrentStepFromBudgetData(sourceBudget.data);
    setImportStepDialogOpen(false);
  }, [applyCurrentStepFromBudgetData, savedBudgets, selectedImportBudgetId, setImportStepDialogOpen]);

  const handleOpenImportStepDialog = useCallback(() => {
    if (!savedBudgets.length) return;
    setSelectedImportBudgetId((prev) => prev || savedBudgets[0].id);
    setImportStepDialogOpen(true);
  }, [savedBudgets, setImportStepDialogOpen, setSelectedImportBudgetId]);

  return {
    applyCurrentStepFromBudgetData,
    handleImportCurrentStepFromSelectedBudget,
    handleOpenImportStepDialog,
  };
}

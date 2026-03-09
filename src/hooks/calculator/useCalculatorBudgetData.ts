import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import type { Budget } from "@/lib/api";
import { api } from "@/lib/api";
import type { ExpenseItem } from "@/types/budget";
import type { Factor, AreaInterval } from "@/components/pricing/PricingEngine";
import { resolveTechnicalPremium } from "@/lib/methodCalibration";
import type { CenarioMethod10 } from "@/components/pricing/PricingEngineMethod12";

type Params = {
  userId: string | null;
  budgetId: string | null;
  defaultFactors: Factor[];
  setSelectedImportBudgetId: Dispatch<SetStateAction<string>>;
  setHydrationComplete: Dispatch<SetStateAction<boolean>>;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  setMaxStepReached: Dispatch<SetStateAction<number>>;
  setMinHourlyRate: Dispatch<SetStateAction<number | null>>;
  setUseManualMinHourlyRate: Dispatch<SetStateAction<boolean>>;
  setProfitMargin: Dispatch<SetStateAction<number>>;
  setTechnicalPremium: Dispatch<SetStateAction<number>>;
  setFixedExpenses: Dispatch<SetStateAction<ExpenseItem[]>>;
  setPersonalExpenses: Dispatch<SetStateAction<ExpenseItem[]>>;
  setProLabore: Dispatch<SetStateAction<number>>;
  setProductiveHours: Dispatch<SetStateAction<number>>;
  setFactors: Dispatch<SetStateAction<Factor[]>>;
  setAreaIntervals: Dispatch<SetStateAction<AreaInterval[]>>;
  setArea: Dispatch<SetStateAction<number | null>>;
  setSelections: Dispatch<SetStateAction<Record<string, number>>>;
  setEstimatedHours: Dispatch<SetStateAction<number>>;
  setCenarioEscolhido: Dispatch<SetStateAction<CenarioMethod10>>;
  setHorasManuais: Dispatch<SetStateAction<number | null>>;
  setCommercialDiscount: Dispatch<SetStateAction<number>>;
  setVariableExpenses: Dispatch<SetStateAction<ExpenseItem[]>>;
};

export function useCalculatorBudgetData({
  userId,
  budgetId,
  defaultFactors,
  setSelectedImportBudgetId,
  setHydrationComplete,
  setCurrentStep,
  setMaxStepReached,
  setMinHourlyRate,
  setUseManualMinHourlyRate,
  setProfitMargin,
  setTechnicalPremium,
  setFixedExpenses,
  setPersonalExpenses,
  setProLabore,
  setProductiveHours,
  setFactors,
  setAreaIntervals,
  setArea,
  setSelections,
  setEstimatedHours,
  setCenarioEscolhido,
  setHorasManuais,
  setCommercialDiscount,
  setVariableExpenses,
}: Params) {
  const [savedBudgets, setSavedBudgets] = useState<Budget[]>([]);
  const [loadedBudgetName, setLoadedBudgetName] = useState<string | null>(null);
  const [loadedClientName, setLoadedClientName] = useState<string | null>(null);
  const [loadedProjectName, setLoadedProjectName] = useState<string | null>(null);
  const [loadedBudgetDescription, setLoadedBudgetDescription] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchLastBudget = async () => {
      if (!userId) return;
      try {
        const resp = await api.listBudgets();
        if (cancelled) return;
        const budgets = Array.isArray(resp.budgets) ? resp.budgets : [];
        setSavedBudgets(budgets);
        if (budgets.length > 0) {
          const last = budgets[0];
          setSelectedImportBudgetId((prev) => prev || last.id);
        } else {
          setSelectedImportBudgetId("");
        }
      } catch {
        if (!cancelled) setSavedBudgets([]);
      }
    };

    void fetchLastBudget();
    return () => {
      cancelled = true;
    };
  }, [setSelectedImportBudgetId, userId]);

  useEffect(() => {
    let cancelled = false;

    const loadBudget = async () => {
      if (!budgetId || !userId) return;
      try {
        const resp = await api.getBudget(budgetId);
        if (cancelled) return;
        const budget = resp.budget;

        setLoadedBudgetName(budget.name || null);
        setLoadedClientName(budget.clientName || null);
        setLoadedProjectName(budget.projectName || null);
        setLoadedBudgetDescription(typeof budget.data?.description === "string" ? budget.data.description : null);
        setMinHourlyRate(budget.data.minHourlyRate);
        setUseManualMinHourlyRate(Boolean(budget.data.useManualMinHourlyRate));

        if (typeof budget.data.margemLucro === "number" && Number.isFinite(budget.data.margemLucro)) {
          setProfitMargin(budget.data.margemLucro);
        } else if (budget.data.profitProfile === "portfolio") {
          setProfitMargin(0.1);
        } else if (budget.data.profitProfile === "referencia") {
          setProfitMargin(0.2);
        } else {
          setProfitMargin(0.15);
        }

        setTechnicalPremium(resolveTechnicalPremium(budget.data.aValue, budget.data.aTestGroup));
        setCenarioEscolhido(
          budget.data.cenarioEscolhido === "otimista" || budget.data.cenarioEscolhido === "conservador"
            ? budget.data.cenarioEscolhido
            : "conservador"
        );
        setHorasManuais(
          typeof budget.data.hUsuarioManual === "number" && Number.isFinite(budget.data.hUsuarioManual)
            ? budget.data.hUsuarioManual
            : null
        );

        setFactors(
          defaultFactors.map((defaultFactor) => {
            const saved = budget.data.factors.find((factor) => factor.id === defaultFactor.id);
            return saved ? { ...defaultFactor, weight: saved.weight } : defaultFactor;
          })
        );

        setAreaIntervals(budget.data.areaIntervals);

        const mergedSelections: Record<string, number> = {
          ...budget.data.selections,
        };
        for (const id of ["area", "tipology", "volumetry", "reform", "stage", "monitoring", "detail", "technical", "bureaucratic"]) {
          if (!Number.isFinite(mergedSelections[id]) || mergedSelections[id] <= 0) {
            mergedSelections[id] = 1;
          }
        }
        setSelections(mergedSelections);
        setEstimatedHours(budget.data.estimatedHours);
        setVariableExpenses(budget.data.variableExpenses || []);
        if (budget.data.commercialDiscount !== undefined) setCommercialDiscount(budget.data.commercialDiscount);
        if (budget.data.fixedExpenses) setFixedExpenses(budget.data.fixedExpenses);
        if (budget.data.personalExpenses) setPersonalExpenses(budget.data.personalExpenses);
        if (budget.data.proLabore !== undefined) setProLabore(budget.data.proLabore);
        if (budget.data.productiveHours !== undefined) setProductiveHours(budget.data.productiveHours);

        if (typeof budget.data.area === "number" && Number.isFinite(budget.data.area)) {
          setArea(budget.data.area);
        } else {
          const areaFactor = budget.data.factors.find((f) => f.id === "area");
          if (areaFactor) {
            const interval = budget.data.areaIntervals.find((i) => i.level === areaFactor.level);
            if (interval) {
              const max = interval.max ?? interval.min;
              setArea((interval.min + max) / 2);
            }
          }
        }
        setCurrentStep(3);
        setMaxStepReached(3);
      } catch (e) {
        console.error("Erro ao carregar cálculo:", e);
      } finally {
        if (!cancelled) setHydrationComplete(true);
      }
    };

    void loadBudget();
    return () => {
      cancelled = true;
    };
  }, [
    budgetId,
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
    setHydrationComplete,
    setMaxStepReached,
    setMinHourlyRate,
    setPersonalExpenses,
    setProductiveHours,
    setProfitMargin,
    setProLabore,
    setSelections,
    setTechnicalPremium,
    setUseManualMinHourlyRate,
    setVariableExpenses,
    userId,
  ]);

  return {
    savedBudgets,
    loadedBudgetName,
    loadedClientName,
    loadedProjectName,
    loadedBudgetDescription,
  };
}

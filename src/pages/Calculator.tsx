import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { BarChart2, ChevronRight, ChevronLeft, ChevronDown, PieChart, Download, RotateCcw, Trash2, MoreHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { ExpenseItem } from "@/types/budget";
import type { CalculatorDraft } from "@/types/budget";
import type { CenarioMethod10 } from "@/components/pricing/PricingEngineMethod12";

import MinimumHourCalculator from "../components/calculator/MinimumHourCalculator";
import AreaFactorCard from "../components/calculator/AreaFactorCard";
import FactorCard from "../components/pricing/FactorCard";
import FinalCalculation from "../components/calculator/FinalCalculation";
import SectionHeader from "../components/calculator/SectionHeader";
import CalculatorResultsPanel from "../components/calculator/CalculatorResultsPanel";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AppDialog from "@/components/ui/AppDialog";
import { useToast } from "@/components/ui/ToastProvider";

import {
  DEFAULT_FACTORS,
  DEFAULT_AREA_INTERVALS,
  calculateAreaLevel,
  Factor,
  AreaInterval,
} from "../components/pricing/PricingEngine";
import { reformFromLevel, tipologiaFromLevel } from "../components/pricing/PricingEngineMethod12";
import { createPageUrl } from "@/utils";
import { fadeUp, fadeOnly } from "@/lib/motion";
import { DEFAULT_METHOD_11_TECHNICAL_PREMIUM, resolveTechnicalPremium } from "@/lib/methodCalibration";
import { useCalculatorProgress } from "@/hooks/calculator/useCalculatorProgress";
import { useCalculatorReset } from "@/hooks/calculator/useCalculatorReset";
import { useCalculatorStepImport } from "@/hooks/calculator/useCalculatorStepImport";
import { useCalculatorDraftSync } from "@/hooks/calculator/useCalculatorDraftSync";
import { useCalculatorBudgetData } from "@/hooks/calculator/useCalculatorBudgetData";
import { useCalculatorStepNavigation } from "@/hooks/calculator/useCalculatorStepNavigation";
import { useCalculatorDerivedValues } from "@/hooks/calculator/useCalculatorDerivedValues";
import { useCalculatorExitGuard } from "@/hooks/calculator/useCalculatorExitGuard";

const STEPS = [
  { n: 1, label: "Hora técnica", line1: "Hora", line2: "técnica" },
  { n: 2, label: "Fatores de complexidade", line1: "Fatores de", line2: "complexidade" },
  { n: 3, label: "Preço e ajustes", line1: "Preço e", line2: "ajustes" },
];

export default function Calculator() {
  const prefersReducedMotion = !!useReducedMotion();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const budgetId = searchParams.get("budget");
  const [confirmClearStepOpen, setConfirmClearStepOpen] = useState(false);
  const [confirmClearAllOpen, setConfirmClearAllOpen] = useState(false);
  const [importStepDialogOpen, setImportStepDialogOpen] = useState(false);
  const [selectedImportBudgetId, setSelectedImportBudgetId] = useState<string>("");
  const [shouldClearDraftOnExit, setShouldClearDraftOnExit] = useState(false);
  const [lastCommittedHash, setLastCommittedHash] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);

  // Seção 1
  const [minHourlyRate, setMinHourlyRate] = useState<number | null>(null);
  const [useManualMinHourlyRate, setUseManualMinHourlyRate] = useState(false);
  const [profitMargin, setProfitMargin] = useState(0.15);
  const [technicalPremium, setTechnicalPremium] = useState<number>(DEFAULT_METHOD_11_TECHNICAL_PREMIUM);
  const [fixedExpenses, setFixedExpenses] = useState<ExpenseItem[]>([]);
  const [personalExpenses, setPersonalExpenses] = useState<ExpenseItem[]>([]);
  const [proLabore, setProLabore] = useState(0);
  const [productiveHours, setProductiveHours] = useState(0);

  // Seção 2
  const [factors, setFactors] = useState<Factor[]>(DEFAULT_FACTORS);
  const [areaIntervals, setAreaIntervals] = useState<AreaInterval[]>(DEFAULT_AREA_INTERVALS);

  // Seção 3
  const [area, setArea] = useState<number | null>(null);
  const [selections, setSelections] = useState<Record<string, number>>({});

  // Seção 4
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [cenarioEscolhido, setCenarioEscolhido] = useState<CenarioMethod10>("conservador");
  const [horasManuais, setHorasManuais] = useState<number | null>(null);
  const [commercialDiscount, setCommercialDiscount] = useState(0);
  const [variableExpenses, setVariableExpenses] = useState<ExpenseItem[]>([]);

  // Restaurar último cálculo

  const applyDraft = useCallback(
    (draft: CalculatorDraft) => {
      setMinHourlyRate(draft.minHourlyRate ?? null);
      setUseManualMinHourlyRate(Boolean(draft.useManualMinHourlyRate));
      if (typeof draft.profitMargin === "number" && Number.isFinite(draft.profitMargin)) {
        setProfitMargin(draft.profitMargin);
      }
      setTechnicalPremium(resolveTechnicalPremium(draft.technicalPremium, "B"));
      if (draft.fixedExpenses) setFixedExpenses(draft.fixedExpenses);
      if (draft.personalExpenses) setPersonalExpenses(draft.personalExpenses);
      if (draft.proLabore) setProLabore(draft.proLabore);
      if (draft.productiveHours) setProductiveHours(draft.productiveHours);
      if (draft.factors) {
        const draftFactors = draft.factors;
        setFactors(
          DEFAULT_FACTORS.map((df) => {
            const saved = draftFactors.find((f) => f.id === df.id);
            return saved ? { ...df, weight: saved.weight } : df;
          })
        );
      }
      if (draft.areaIntervals) setAreaIntervals(draft.areaIntervals);
      if (draft.area) setArea(draft.area);
      if (draft.selections) setSelections(draft.selections);
      if (draft.estimatedHours) setEstimatedHours(draft.estimatedHours);
      if (draft.cenarioEscolhido === "otimista" || draft.cenarioEscolhido === "conservador") {
        setCenarioEscolhido(draft.cenarioEscolhido);
      }
      if (typeof draft.hUsuarioManual === "number" && Number.isFinite(draft.hUsuarioManual)) {
        setHorasManuais(draft.hUsuarioManual);
      }
      if (draft.commercialDiscount !== undefined) setCommercialDiscount(draft.commercialDiscount);
      if (draft.variableExpenses) setVariableExpenses(draft.variableExpenses);
      if (draft.currentStep) setCurrentStep(draft.currentStep);
      if (draft.maxStepReached) setMaxStepReached(draft.maxStepReached);
    },
    []
  );

  const draftData = useMemo<CalculatorDraft>(
    () => ({
      minHourlyRate,
      useManualMinHourlyRate,
      profitMargin,
      technicalPremium,
      fixedExpenses,
      personalExpenses,
      proLabore,
      productiveHours,
      factors: factors.map((f) => ({ id: f.id, weight: f.weight })),
      areaIntervals,
      area,
      selections,
      estimatedHours,
      cenarioEscolhido,
      hUsuarioManual: horasManuais,
      commercialDiscount,
      variableExpenses,
      currentStep,
      maxStepReached,
    }),
    [
      area,
      areaIntervals,
      cenarioEscolhido,
      commercialDiscount,
      currentStep,
      estimatedHours,
      factors,
      fixedExpenses,
      horasManuais,
      maxStepReached,
      minHourlyRate,
      personalExpenses,
      proLabore,
      productiveHours,
      profitMargin,
      selections,
      technicalPremium,
      useManualMinHourlyRate,
      variableExpenses,
    ]
  );

  const {
    draftStatus,
    setDraftStatus,
    lastDraftSavedAt,
    hydrationComplete,
    setHydrationComplete,
  } = useCalculatorDraftSync({
    enabled: Boolean(user),
    budgetId,
    draftData,
    applyDraft,
  });

  const {
    savedBudgets,
    loadedBudgetName,
    loadedClientName,
    loadedProjectName,
    loadedBudgetDescription,
  } = useCalculatorBudgetData({
    userId: user?.id ?? null,
    budgetId,
    defaultFactors: DEFAULT_FACTORS,
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
  });


  // ── Handlers ──────────────────────────────────────────────────
  const handleMinHourRateCalculate = useCallback((rate: number) => {
    setMinHourlyRate(rate);
  }, []);

  const { handleImportCurrentStepFromSelectedBudget, handleOpenImportStepDialog } = useCalculatorStepImport({
    currentStep,
    savedBudgets,
    selectedImportBudgetId,
    setSelectedImportBudgetId,
    setImportStepDialogOpen,
    areaIntervals,
    defaultFactors: DEFAULT_FACTORS,
    setMinHourlyRate,
    setUseManualMinHourlyRate,
    setProfitMargin,
    setTechnicalPremium,
    setFixedExpenses,
    setPersonalExpenses,
    setProLabore,
    setProductiveHours,
    setAreaIntervals,
    setSelections,
    setArea,
    setFactors,
    setEstimatedHours,
    setCenarioEscolhido,
    setHorasManuais,
    setCommercialDiscount,
    setVariableExpenses,
    hasWeightStep: false,
    finalStepNumber: 3,
  });

  const {
    handleConfirmClearCurrentStep,
    handleClearCurrentStep,
    handleConfirmResetCalculation,
    handleResetCalculation,
  } = useCalculatorReset({
    currentStep,
    defaultFactors: DEFAULT_FACTORS,
    defaultAreaIntervals: DEFAULT_AREA_INTERVALS,
    setConfirmClearStepOpen,
    setConfirmClearAllOpen,
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
    hasWeightStep: false,
    finalStepNumber: 3,
  });

  const handleAreaChange = useCallback((newArea: number) => {
    setArea(newArea);
    if (newArea > 0) {
      const level = calculateAreaLevel(newArea, areaIntervals);
      setSelections(prev => ({ ...prev, area: level }));
    }
  }, [areaIntervals]);

  const handleAreaLevelChange = useCallback((level: number) => {
    setSelections(prev => ({ ...prev, area: level }));
  }, []);

  const handleSelectionChange = useCallback((factorId: string, value: number) => {
    setSelections((prev) => {
      const next = { ...prev, [factorId]: value };
      if (factorId === "tipology" && (!Number.isFinite(Number(next.reform)) || Number(next.reform) <= 0)) {
        next.reform = 1;
      }
      return next;
    });
  }, []);

  const handleReformChange = useCallback((checked: boolean) => {
    setSelections((prev) => ({ ...prev, reform: checked ? 2 : 1 }));
  }, []);

  const {
    hasComplexitySelections,
    totalFactors,
    selectedFactorsCount,
    methodOutputSuggested,
    methodOutput,
    complexityScore,
    displayValues,
    pricePerSqm,
  } = useCalculatorDerivedValues({
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
  });

  const calculatorStateHash = useMemo(
    () =>
      JSON.stringify({
        minHourlyRate,
        useManualMinHourlyRate,
        profitMargin,
        technicalPremium,
        fixedExpenses,
        personalExpenses,
        proLabore,
        productiveHours,
        factors: factors.map((factor) => ({ id: factor.id, weight: factor.weight })),
        areaIntervals,
        area,
        selections,
        estimatedHours,
        cenarioEscolhido,
        horasManuais,
        commercialDiscount,
        variableExpenses,
        currentStep,
      }),
    [
      area,
      areaIntervals,
      commercialDiscount,
      cenarioEscolhido,
      currentStep,
      estimatedHours,
      factors,
      fixedExpenses,
      horasManuais,
      minHourlyRate,
      personalExpenses,
      proLabore,
      productiveHours,
      profitMargin,
      selections,
      technicalPremium,
      useManualMinHourlyRate,
      variableExpenses,
    ]
  );

  const {
    hasUnsavedChanges,
    confirmLeaveOpen,
    setConfirmLeaveOpen,
    confirmPendingNavigation,
    cancelPendingNavigation,
    markCommitted,
    resetCommittedState,
  } = useCalculatorExitGuard({
    hydrationComplete,
    shouldClearDraftOnExit,
    setShouldClearDraftOnExit,
    lastCommittedHash,
    setLastCommittedHash,
    calculatorStateHash,
  });

  const areaFactor = factors.find(f => f.id === "area");
  const otherFactors = factors.filter(f => f.id !== "area" && f.id !== "volumetry" && f.id !== "reform");

  // ── Stepper ───────────────────────────────────────────────────
  const { stepComplete, canAdvance } = useCalculatorProgress({
    currentStep,
    setCurrentStep,
    setMaxStepReached,
    minHourlyRate,
    hasComplexitySelections,
    finalSalePrice: displayValues.finalSalePrice,
    includeWeightStep: false,
  });

  const canImportCurrentStep = savedBudgets.length > 0;
  const selectedImportBudget = useMemo(
    () => savedBudgets.find((budget) => budget.id === selectedImportBudgetId) ?? null,
    [savedBudgets, selectedImportBudgetId]
  );
  const {
    currentStepLabel,
    stepVisualDone,
    handleNext,
    handleBack,
    goToStep,
    mobileStepperRef,
    stepContentTopRef,
  } = useCalculatorStepNavigation({
    currentStep,
    maxStepReached,
    steps: STEPS,
    canAdvance,
    stepComplete,
    setCurrentStep,
    confirmClearAllOpen,
    confirmClearStepOpen,
    importStepDialogOpen,
    confirmLeaveOpen,
  });

  const handleBudgetSaved = useCallback(() => {
    markCommitted();
    setHydrationComplete(true);
    setDraftStatus("idle");
    toast({
      tone: "success",
      title: "Cálculo salvo",
      description: "Você pode sair da página; o rascunho local será limpo ao recarregar ou navegar.",
    });
  }, [markCommitted, setDraftStatus, setHydrationComplete, toast]);

  const handleImportCurrentStepWithFeedback = useCallback(() => {
    handleImportCurrentStepFromSelectedBudget();
    toast({
      tone: "success",
      title: "Etapa importada",
      description: "Somente os dados da etapa atual foram importados.",
    });
  }, [handleImportCurrentStepFromSelectedBudget, toast]);

  const handleConfirmClearCurrentStepWithFeedback = useCallback(() => {
    handleConfirmClearCurrentStep();
    toast({
      tone: "info",
      title: "Etapa reiniciada",
      description: `Os dados de ${currentStepLabel} foram reiniciados.`,
    });
  }, [currentStepLabel, handleConfirmClearCurrentStep, toast]);

  const handleConfirmResetCalculationWithFeedback = useCallback(() => {
    handleConfirmResetCalculation();
    resetCommittedState();
    setHydrationComplete(true);
    toast({
      tone: "info",
      title: "Cálculo reiniciado",
      description: "Os dados preenchidos foram reiniciados sem apagar o cálculo salvo.",
    });
  }, [handleConfirmResetCalculation, resetCommittedState, setHydrationComplete, toast]);



  // ── Painel de resultados (compartilhado desktop/mobile) ────────
  const ResultsPanel = () => (
    <CalculatorResultsPanel
      minHourlyRate={minHourlyRate}
      hasComplexitySelections={hasComplexitySelections}
      complexityScore={complexityScore}
      currentStep={currentStep}
      selectedFactorsCount={selectedFactorsCount}
      totalFactors={totalFactors}
      estimatedHours={estimatedHours}
      commercialDiscount={commercialDiscount}
      pricePerSqm={pricePerSqm}
      displayValues={displayValues}
      useManualMinHourlyRate={useManualMinHourlyRate}
      fixedExpensesTotal={fixedExpenses.reduce((sum, expense) => sum + (Number(expense.value) || 0), 0)}
      personalExpensesTotal={personalExpenses.reduce((sum, expense) => sum + (Number(expense.value) || 0), 0)}
      productiveHours={productiveHours}
    />
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        {/* Header */}
        <motion.div
          variants={fadeUp(prefersReducedMotion, 10)}
          initial="hidden"
          animate="show"
          className="mb-4 sm:mb-5 text-center"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-calcularq-blue mb-2">
            Calculadora de precificação
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Configure sua hora técnica, descreva o projeto e calcule um preço com base na complexidade real.
          </p>
        </motion.div>

        <div ref={stepContentTopRef} />

        {/* Stepper horizontal unificado (desktop/tablet) */}
        <div className="hidden sm:block mb-4 sm:mb-5 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
          <div className="flex min-w-full justify-center">
            <div className="flex w-max items-start gap-0">
            {STEPS.map((step, i) => {
              const done = stepVisualDone(step.n);
              const active = currentStep === step.n;
              return (
                <div key={step.n} className="flex items-start">
                  <div className="flex flex-col items-center w-[5.1rem] sm:w-[6.2rem] md:w-[7.8rem]">
                    <button
                      type="button"
                      onClick={() => goToStep(step.n)}
                      title={step.label}
                      className="relative"
                    >
                      <span
                        className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-bold transition-colors transition-shadow duration-150 border-2
                        ${done ? "bg-calcularq-blue border-calcularq-blue text-white shadow-md"
                          : active ? "bg-white border-calcularq-blue text-calcularq-blue shadow-sm"
                          : "bg-white border-slate-200 text-slate-400 cursor-default"}`}
                      >
                        {done ? "✓" : step.n}
                      </span>
                    </button>
                    <span
                      className={`mt-1.5 inline-flex flex-col text-[13px] sm:text-sm font-medium text-center leading-tight max-w-[12ch]
                      ${done || active ? "text-calcularq-blue" : "text-slate-400"}`}
                      style={{ textWrap: "balance" }}
                    >
                      <span>{step.line1}</span>
                      <span>{step.line2}</span>
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`mt-[1.35rem] sm:mt-6 h-0.5 sm:h-1 w-5 sm:w-7 md:w-11 shrink-0 rounded-full transition-colors duration-150 ${done ? "bg-calcularq-blue" : "bg-slate-200"}`}
                    />
                  )}
                </div>
              );
            })}
            </div>
          </div>
        </div>

            <motion.div
              variants={fadeUp(prefersReducedMotion, 8)}
              initial="hidden"
              animate="show"
              className="mb-3"
            >
              <div className="sm:flex sm:items-start sm:justify-between sm:gap-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    onClick={handleOpenImportStepDialog}
                    disabled={!canImportCurrentStep}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-slate-200/90 bg-transparent px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    title={`Importar dados para ${currentStepLabel} a partir de um cálculo salvo (sem alterar outras etapas)`}
                  >
                    <Download className="h-4 w-4" />
                    Importar etapa
                  </button>
                  <details className="relative w-full sm:w-auto group">
                    <summary className="list-none inline-flex w-full sm:w-auto cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200/90 bg-transparent px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-800">
                      <MoreHorizontal className="h-4 w-4" />
                      <span>Mais ações</span>
                    </summary>
                    <div className="mt-2 w-full sm:absolute sm:left-0 sm:top-full sm:mt-2 sm:min-w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-sm z-20">
                      <button
                        type="button"
                        onClick={(e) => {
                          handleClearCurrentStep();
                          (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
                        }}
                        className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50"
                        title={`Reiniciar dados da etapa ${currentStepLabel}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        Reiniciar etapa
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          handleResetCalculation();
                          (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
                        }}
                        className="inline-flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50"
                        title="Reiniciar todos os dados preenchidos do cálculo"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Reiniciar cálculo
                      </button>
                      <div className="hidden sm:block mt-1 border-t border-slate-100 px-3 pt-2 pb-1">
                        <p className="text-[11px] leading-relaxed text-slate-400">
                          Atalhos: Alt+← / Alt+→ / Alt+1-3
                        </p>
                      </div>
                    </div>
                  </details>
                </div>
                <div className="hidden sm:flex flex-wrap items-center justify-end gap-2 text-xs sm:max-w-[46%]">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 font-medium ${
                      draftStatus === "saving"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : draftStatus === "saved"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : hasUnsavedChanges
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-500"
                    }`}
                  >
                    {draftStatus === "saving"
                      ? "Salvando rascunho local..."
                      : draftStatus === "saved"
                        ? `Rascunho salvo${lastDraftSavedAt ? ` às ${new Date(lastDraftSavedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : ""}`
                        : hasUnsavedChanges
                          ? "Alterações não salvas"
                          : "Rascunho salvo automaticamente"}
                  </span>
                </div>
              </div>
              <div className="mt-2 min-h-5">
                <p className="hidden sm:block text-sm text-slate-500">
                  Etapa {currentStep} de {STEPS.length}.
                </p>
              </div>
            </motion.div>

        <div className="lg:hidden sticky top-20 z-10 mb-4">
          <details ref={mobileStepperRef} className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm">
            <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
              <div className="flex items-center justify-between gap-3 rounded-lg px-1 py-1.5 hover:bg-slate-50 transition-colors duration-150">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">Etapa {currentStep} de {STEPS.length}</p>
                  <p className="truncate text-sm font-semibold leading-tight text-calcularq-blue">
                    {STEPS[currentStep - 1]?.line1} {STEPS[currentStep - 1]?.line2}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </div>
              </div>
            </summary>
            <div className="mt-2 space-y-1.5 border-t border-slate-100 pt-2">
              {STEPS.map((step) => {
                const done = stepVisualDone(step.n);
                const active = currentStep === step.n;
                return (
                  <button
                    key={step.n}
                    type="button"
                    onClick={() => {
                      goToStep(step.n);
                      mobileStepperRef.current?.removeAttribute("open");
                    }}
                    className={[
                      "w-full rounded-lg px-2.5 py-2 text-left transition-colors duration-150",
                      active
                        ? "bg-calcularq-blue/5 text-calcularq-blue"
                        : done
                          ? "bg-calcularq-blue/[0.03] text-calcularq-blue"
                          : "text-slate-600 hover:bg-slate-50 hover:text-calcularq-blue",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={[
                          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                          done
                            ? "border-calcularq-blue bg-calcularq-blue text-white"
                            : active
                              ? "border-calcularq-blue bg-white text-calcularq-blue"
                              : "border-slate-200 bg-white text-slate-400",
                        ].join(" ")}
                      >
                        {done ? "✓" : step.n}
                      </span>
                      <span className={["truncate text-sm leading-snug", active ? "font-semibold" : ""].join(" ")}>
                        {step.line1} {step.line2}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2 border-t border-slate-100 pt-2">
              <p className="min-w-0 truncate text-xs text-slate-500">
                {draftStatus === "saving"
                  ? "Salvando rascunho..."
                  : draftStatus === "saved"
                    ? "Rascunho salvo"
                    : hasUnsavedChanges
                      ? "Alterações não salvas"
                      : "Rascunho salvo automaticamente"}
              </p>
            </div>
          </details>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
          {/* Coluna principal */}
          <div className="flex-1 min-w-0">

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: prefersReducedMotion ? 0.12 : 0.2 }}
              >
                {currentStep === 1 && (
                  <MinimumHourCalculator
                    onCalculate={handleMinHourRateCalculate}
                    initialMinHourRate={minHourlyRate || undefined}
                    initialUseManual={useManualMinHourlyRate}
                    onManualModeChange={setUseManualMinHourlyRate}
                    onFixedExpensesChange={setFixedExpenses}
                    onProductiveHoursChange={setProductiveHours}
                    onProLaboreChange={setProLabore}
                    onPersonalExpensesChange={setPersonalExpenses}
                    initialFixedExpenses={fixedExpenses}
                    initialPersonalExpenses={personalExpenses}
                    initialProductiveHours={productiveHours}
                    initialProLabore={proLabore}
                  />
                )}

                {currentStep === 2 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
                    <SectionHeader
                      title="Fatores de complexidade"
                      description="Preencha os campos da etapa para que o método calcule horas e preço com base na complexidade."
                      icon={<BarChart2 className="w-5 h-5 text-calcularq-blue" />}
                    />

                    <div className="mb-6 rounded-xl border-l-4 border-blue-500 bg-blue-50 px-4 py-3">
                      <p className="text-sm text-blue-700 [&_strong]:text-blue-900">
                        <strong>Precisa de apoio na classificação?</strong> Para entender os critérios técnicos e os exemplos práticos por trás de cada Fator e Valor,{" "}
                        <a href={createPageUrl("Manual")} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                          acesse o manual de instruções
                        </a>.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {areaFactor && (
                        <AreaFactorCard
                          area={area}
                          onAreaChange={handleAreaChange}
                          onLevelChange={handleAreaLevelChange}
                          volumetryLevel={Number(selections.volumetry || 0)}
                          onVolumetryChange={(level) => handleSelectionChange("volumetry", level)}
                          intervals={areaIntervals}
                        />
                      )}
                      {otherFactors.map((factor) => (
                        <FactorCard
                          key={factor.id}
                          factor={factor}
                          value={selections[factor.id]}
                          onChange={handleSelectionChange}
                          reformValue={factor.id === "tipology" ? Number(selections.reform ?? 1) > 1 : undefined}
                          onReformChange={factor.id === "tipology" ? handleReformChange : undefined}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 3 && minHourlyRate && minHourlyRate > 0 && area && area > 0 && methodOutput && methodOutputSuggested && (
                  <FinalCalculation
                    budgetId={budgetId || undefined}
                    initialBudgetName={loadedBudgetName || undefined}
                    initialClientName={loadedClientName || undefined}
                    initialProjectName={loadedProjectName || undefined}
                    initialDescription={loadedBudgetDescription || undefined}
                    minHourlyRate={minHourlyRate}
                    useManualMinHourlyRate={useManualMinHourlyRate}
                    fixedExpenses={fixedExpenses}
                    personalExpenses={personalExpenses}
                    proLabore={proLabore}
                    productiveHours={productiveHours}
                    area={area}
                    factors={factors}
                    areaIntervals={areaIntervals}
                    selections={selections}
                    margin={profitMargin}
                    onMarginChange={setProfitMargin}
                    tipologia={tipologiaFromLevel(Number(selections.tipology ?? 1))}
                    volumetria={Number(selections.volumetry ?? 1)}
                    reforma={reformFromLevel(Number(selections.reform ?? 1))}
                    cenario={cenarioEscolhido}
                    onCenarioChange={setCenarioEscolhido}
                    commercialDiscount={commercialDiscount}
                    onCommercialDiscountChange={setCommercialDiscount}
                    variableExpenses={variableExpenses}
                    onVariableExpensesChange={setVariableExpenses}
                    technicalPremium={technicalPremium}
                    onTechnicalPremiumChange={setTechnicalPremium}
                    horasManual={horasManuais}
                    onHorasManualChange={setHorasManuais}
                    h50={methodOutputSuggested.h50}
                    hCons={methodOutputSuggested.h_cons}
                    output={methodOutput}
                    onBudgetSaved={handleBudgetSaved}
                    mobileResultsPanel={
                      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6">
                        <SectionHeader
                          compact
                          title="Resultados"
                          description="Resumo do cálculo atual"
                          icon={<PieChart className="w-5 h-5 text-calcularq-blue" />}
                        />
                        <div className="rounded-xl border border-slate-200 bg-slate-50/80 shadow-sm p-2.5 sm:p-3 overflow-hidden">
                          <ResultsPanel />
                        </div>
                      </div>
                    }
                  />
                )}
                {currentStep === 3 && (!minHourlyRate || !methodOutput) && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
                    <p className="text-slate-500">Complete as etapas anteriores para chegar ao cálculo final.</p>
                    <button type="button" onClick={() => setCurrentStep(1)} className="mt-4 text-sm font-semibold text-calcularq-blue underline">
                      Voltar ao início
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="lg:hidden mt-4">
              {currentStep < 3 ? (
                <motion.div
                  variants={fadeOnly(prefersReducedMotion)}
                  initial="hidden"
                  animate="show"
                >
                  <details className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm">
                    <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
                      <div className="flex items-center justify-between gap-3 rounded-lg px-1 py-1.5 hover:bg-slate-50 transition-colors duration-150">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-calcularq-blue">Resultados</p>
                          <p className="text-xs text-slate-500">Resumo do cálculo atual</p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      </div>
                    </summary>
                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/80 shadow-sm p-2.5 sm:p-3 overflow-hidden">
                      <ResultsPanel />
                    </div>
                  </details>
                </motion.div>
              ) : null}
            </div>

          </div>

          {/* Painel lateral — desktop */}
          <div className="hidden lg:block w-80 xl:w-[22rem] shrink-0 self-start sticky top-24">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
              <SectionHeader
                compact
                title="Resultados"
                description="Resumo do cálculo atual"
                icon={<PieChart className="w-5 h-5 text-calcularq-blue" />}
                titleClassName="text-xl sm:text-xl"
                descriptionClassName="text-sm"
              />
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 shadow-sm p-2.5 sm:p-3 overflow-hidden">
                <ResultsPanel />
              </div>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-colors
              ${currentStep === 1 ? "text-slate-300 cursor-not-allowed" : "text-slate-600 hover:bg-slate-100"}`}
          >
            <ChevronLeft className="w-4 h-4" />
            Etapa anterior
          </button>

          <span className="text-xs text-slate-400 lg:hidden">{currentStep} de {STEPS.length}</span>

          <div className="flex flex-col items-end gap-1">
            {currentStep < STEPS.length ? (
              <>
                {!canAdvance ? (
                  <p className="hidden sm:block text-xs text-slate-500">Complete os campos obrigatórios para avançar.</p>
                ) : null}
                <button
                  onClick={handleNext}
                  disabled={!canAdvance}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors
                    ${canAdvance ? "bg-calcularq-blue text-white hover:bg-calcularq-blue/90 shadow-sm" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
                >
                  Próxima etapa
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="w-32" />
            )}
          </div>
        </div>

      </div>

      <ConfirmDialog
        open={confirmClearStepOpen}
        onOpenChange={setConfirmClearStepOpen}
        title="Reiniciar etapa"
        description={`Deseja reiniciar os dados preenchidos de "${currentStepLabel}"?`}
        confirmLabel="Reiniciar etapa"
        onConfirm={handleConfirmClearCurrentStepWithFeedback}
      />

      <ConfirmDialog
        open={confirmClearAllOpen}
        onOpenChange={setConfirmClearAllOpen}
        title="Reiniciar cálculo"
        description={
          budgetId
            ? "Deseja reiniciar este cálculo? O cálculo salvo permanecerá intacto."
            : "Deseja reiniciar este cálculo?"
        }
        confirmLabel="Reiniciar cálculo"
        onConfirm={handleConfirmResetCalculationWithFeedback}
      />

      <AppDialog
        open={importStepDialogOpen}
        onOpenChange={setImportStepDialogOpen}
        title="Importar dados da etapa"
        description={`Escolha de qual cálculo salvo você quer importar os dados para ${currentStepLabel}. Apenas a etapa atual será substituída.`}
        maxWidthClassName="max-w-xl"
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setImportStepDialogOpen(false)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleImportCurrentStepWithFeedback}
              disabled={!selectedImportBudget}
              className="inline-flex items-center justify-center rounded-lg bg-calcularq-blue px-4 py-2 text-sm font-semibold text-white hover:bg-calcularq-blue/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Importar etapa
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Cálculo salvo</label>
            <select
              value={selectedImportBudgetId}
              onChange={(e) => setSelectedImportBudgetId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-calcularq-blue focus:ring-2 focus:ring-calcularq-blue/20"
            >
              {savedBudgets.map((budget) => (
                <option key={budget.id} value={budget.id}>
                  {budget.name}{budget.clientName ? ` • ${budget.clientName}` : ""}
                </option>
              ))}
            </select>
          </div>

          {selectedImportBudget ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-600">
              <p className="font-medium text-slate-800">{selectedImportBudget.name}</p>
              {selectedImportBudget.clientName ? <p className="mt-1">Cliente: {selectedImportBudget.clientName}</p> : null}
              {selectedImportBudget.projectName ? <p className="mt-1">Projeto: {selectedImportBudget.projectName}</p> : null}
              <p className="mt-1 text-xs text-slate-500">
                Atualizado em {new Date(selectedImportBudget.updatedAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          ) : null}
        </div>
      </AppDialog>

      <ConfirmDialog
        open={confirmLeaveOpen}
        onOpenChange={(open) => {
          if (open) {
            setConfirmLeaveOpen(true);
            return;
          }
          cancelPendingNavigation();
        }}
        title="Sair sem salvar?"
        description="Há alterações não salvas neste cálculo. Se sair agora, você pode perder mudanças recentes."
        confirmLabel="Sair sem salvar"
        confirmVariant="danger"
        onConfirm={confirmPendingNavigation}
      />
    </div>
  );
}

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { BarChart2, ChevronRight, ChevronLeft, PieChart, Download, RotateCcw, Trash2, MoreHorizontal } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api, Budget } from "@/lib/api";
import type { ExpenseItem } from "@/types/budget";

import MinimumHourCalculator from "../components/calculator/MinimumHourCalculator";
import ComplexityConfig from "../components/calculator/ComplexityConfig";
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
  calculateGlobalComplexity,
  calculateProjectValue,
  calculateAreaLevel,
  Factor,
  AreaInterval,
} from "../components/pricing/PricingEngine";
import { createPageUrl } from "@/utils";
import { fadeUp } from "@/lib/motion";
import { clearCalculatorDraft, loadCalculatorDraft, saveCalculatorDraft } from "@/lib/calculatorDraft";
import { useCalculatorProgress } from "@/hooks/calculator/useCalculatorProgress";
import { useCalculatorReset } from "@/hooks/calculator/useCalculatorReset";
import { useCalculatorStepImport } from "@/hooks/calculator/useCalculatorStepImport";

const STEPS = [
  { n: 1, label: "Hora técnica mínima" },
  { n: 2, label: "Fatores de complexidade" },
  { n: 3, label: "Calibragem dos pesos" },
  { n: 4, label: "Composição final" },
];

export default function Calculator() {
  const prefersReducedMotion = !!useReducedMotion();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const budgetId = searchParams.get("budget");
  const [loadedBudgetName, setLoadedBudgetName] = useState<string | null>(null);
  const [loadedClientName, setLoadedClientName] = useState<string | null>(null);
  const [loadedProjectName, setLoadedProjectName] = useState<string | null>(null);
  const [loadedBudgetDescription, setLoadedBudgetDescription] = useState<string | null>(null);
  const [confirmClearStepOpen, setConfirmClearStepOpen] = useState(false);
  const [confirmClearAllOpen, setConfirmClearAllOpen] = useState(false);
  const [importStepDialogOpen, setImportStepDialogOpen] = useState(false);
  const [savedBudgets, setSavedBudgets] = useState<Budget[]>([]);
  const [selectedImportBudgetId, setSelectedImportBudgetId] = useState<string>("");
  const [shouldClearDraftOnExit, setShouldClearDraftOnExit] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastDraftSavedAt, setLastDraftSavedAt] = useState<number | null>(null);
  const [hydrationComplete, setHydrationComplete] = useState(false);
  const [lastCommittedHash, setLastCommittedHash] = useState<string | null>(null);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);

  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);

  // Seção 1
  const [minHourlyRate, setMinHourlyRate] = useState<number | null>(null);
  const [useManualMinHourlyRate, setUseManualMinHourlyRate] = useState(false);
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
  const [commercialDiscount, setCommercialDiscount] = useState(0);
  const [variableExpenses, setVariableExpenses] = useState<ExpenseItem[]>([]);

  // Restaurar último cálculo

  // ── Autosave em localStorage ──────────────────────────────────
  const draftSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftStatusResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user || budgetId) return;
    if (draftSaveRef.current) clearTimeout(draftSaveRef.current);
    setDraftStatus("saving");
    draftSaveRef.current = setTimeout(() => {
      saveCalculatorDraft({
        minHourlyRate, useManualMinHourlyRate, fixedExpenses, personalExpenses, proLabore, productiveHours,
        factors: factors.map(f => ({ id: f.id, weight: f.weight })),
        areaIntervals, area, selections,
        estimatedHours, commercialDiscount, variableExpenses,
        currentStep, maxStepReached,
        savedAt: Date.now(),
      });
      setLastDraftSavedAt(Date.now());
      setDraftStatus("saved");
      if (draftStatusResetRef.current) clearTimeout(draftStatusResetRef.current);
      draftStatusResetRef.current = setTimeout(() => setDraftStatus("idle"), 1500);
    }, 800);
  }, [
    budgetId,
    minHourlyRate, useManualMinHourlyRate, fixedExpenses, personalExpenses, proLabore, productiveHours,
    factors, areaIntervals, area, selections,
    estimatedHours, commercialDiscount, variableExpenses,
    currentStep, maxStepReached,
    user,
  ]);

  // ── Restaurar rascunho do localStorage ao montar ──────────────
  const draftRestoredRef = useRef(false);
  useEffect(() => {
    if (draftRestoredRef.current || budgetId || !user) return;
    draftRestoredRef.current = true;

    const draft = loadCalculatorDraft();
    if (!draft || !draft.minHourlyRate) {
      setHydrationComplete(true);
      return;
    }

    // Só restaura se o rascunho for recente (< 24h) e não vier de outro usuário
    const age = Date.now() - (draft.savedAt || 0);
    if (age > 24 * 60 * 60 * 1000) {
      setHydrationComplete(true);
      return;
    }

    setMinHourlyRate(draft.minHourlyRate ?? null);
    setUseManualMinHourlyRate(Boolean(draft.useManualMinHourlyRate));
    if (draft.fixedExpenses) setFixedExpenses(draft.fixedExpenses);
    if (draft.personalExpenses) setPersonalExpenses(draft.personalExpenses);
    if (draft.proLabore) setProLabore(draft.proLabore);
    if (draft.productiveHours) setProductiveHours(draft.productiveHours);
    if (draft.factors) {
      const draftFactors = draft.factors;
      setFactors(DEFAULT_FACTORS.map(df => {
        const saved = draftFactors.find((f) => f.id === df.id);
        return saved ? { ...df, weight: saved.weight } : df;
      }));
    }
    if (draft.areaIntervals) setAreaIntervals(draft.areaIntervals);
    if (draft.area) setArea(draft.area);
    if (draft.selections) setSelections(draft.selections);
    if (draft.estimatedHours) setEstimatedHours(draft.estimatedHours);
    if (draft.commercialDiscount !== undefined) setCommercialDiscount(draft.commercialDiscount);
    if (draft.variableExpenses) setVariableExpenses(draft.variableExpenses);
    if (draft.currentStep) setCurrentStep(draft.currentStep);
    if (draft.maxStepReached) setMaxStepReached(draft.maxStepReached);
    setLastDraftSavedAt(draft.savedAt ?? null);
    setDraftStatus("saved");
    setHydrationComplete(true);
  }, [user, budgetId]);

  // ── Buscar último budget para banner de restauração ───────────
  useEffect(() => {
    const fetchLastBudget = async () => {
      if (!user || budgetId) return;
      try {
        const resp = await api.listBudgets();
        const budgets = Array.isArray(resp.budgets) ? resp.budgets : [];
        setSavedBudgets(budgets);
        if (budgets.length > 0) {
          const last = budgets[0];          setSelectedImportBudgetId((prev) => prev || last.id);
        } else {          setSelectedImportBudgetId("");
        }
      } catch { /* silencioso */ }
    };
    fetchLastBudget();
  }, [user, budgetId]);

  // ── Carregar orçamento salvo via URL ──────────────────────────
  useEffect(() => {
    const loadBudget = async () => {
      if (!budgetId || !user) return;
      try {
        const resp = await api.getBudget(budgetId);
        const budget = resp.budget;

        setLoadedBudgetName(budget.name || null);
        setLoadedClientName(budget.clientName || null);
        setLoadedProjectName(budget.projectName || null);
        setLoadedBudgetDescription(typeof budget.data?.description === "string" ? budget.data.description : null);
        setMinHourlyRate(budget.data.minHourlyRate);
        setUseManualMinHourlyRate(Boolean(budget.data.useManualMinHourlyRate));

        setFactors(budget.data.factors.map((f) => {
          const defaultFactor = DEFAULT_FACTORS.find(df => df.id === f.id);
          return { ...defaultFactor!, weight: f.weight };
        }));

        setAreaIntervals(budget.data.areaIntervals);
        setSelections(budget.data.selections);
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
        setCurrentStep(4);
        setMaxStepReached(4);
      } catch (e) {
        console.error("Erro ao carregar cálculo:", e);
      } finally {
        setHydrationComplete(true);
      }
    };
    loadBudget();
  }, [budgetId, user]);


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
  });

  const handleFactorWeightChange = useCallback((factorId: string, weight: number) => {
    setFactors(prev => prev.map(f => f.id === factorId ? { ...f, weight } : f));
  }, []);

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
    setSelections(prev => ({ ...prev, [factorId]: value }));
  }, []);

  // ── Cálculos ──────────────────────────────────────────────────
  const globalComplexity = useMemo(() => calculateGlobalComplexity(factors, selections), [factors, selections]);

  const results = useMemo(() => {
    if (!minHourlyRate || minHourlyRate <= 0) return null;
    const totalVariableExpenses = variableExpenses.reduce((sum, exp) => sum + exp.value, 0);
    return calculateProjectValue(minHourlyRate, estimatedHours, globalComplexity, totalVariableExpenses);
  }, [minHourlyRate, estimatedHours, globalComplexity, variableExpenses]);

  const displayValues = useMemo(() => {
    const totalVariableExpenses = variableExpenses.reduce((sum, exp) => sum + exp.value, 0);
    const adjustedHourlyRate = minHourlyRate && minHourlyRate > 0 && globalComplexity > 0
      ? minHourlyRate * globalComplexity : 0;
    const projectPrice = adjustedHourlyRate > 0 && estimatedHours > 0
      ? adjustedHourlyRate * estimatedHours : 0;
    const projectPriceWithDiscount = projectPrice * (1 - commercialDiscount / 100);
    const discountAmount = projectPrice * (commercialDiscount / 100);
    const finalSalePrice = projectPriceWithDiscount + totalVariableExpenses;
    const profit = minHourlyRate && adjustedHourlyRate > 0 && estimatedHours > 0
      ? (adjustedHourlyRate - minHourlyRate) * estimatedHours
      : null;
    return {
      totalVariableExpenses, adjustedHourlyRate, projectPrice,
      projectPriceWithDiscount, discountAmount, finalSalePrice, profit,
    };
  }, [minHourlyRate, globalComplexity, estimatedHours, commercialDiscount, variableExpenses]);

  const CUB_MEDIO = 2800;
  const effectiveAreaForCub = useMemo(() => {
    if (typeof area === "number" && Number.isFinite(area) && area > 0) return area;

    const selectedAreaLevel = Number(selections.area);
    if (!Number.isFinite(selectedAreaLevel) || selectedAreaLevel <= 0) return null;

    const interval = areaIntervals.find((i) => i.level === selectedAreaLevel);
    if (!interval) return null;

    if (typeof interval.max === "number" && interval.max > interval.min) {
      return (interval.min + interval.max) / 2;
    }

    return interval.min > 0 ? interval.min : null;
  }, [area, selections.area, areaIntervals]);

  const cubPercentage = useMemo(() => {
    if (!effectiveAreaForCub || effectiveAreaForCub <= 0 || displayValues.finalSalePrice <= 0) return null;
    return (displayValues.finalSalePrice / (CUB_MEDIO * effectiveAreaForCub)) * 100;
  }, [effectiveAreaForCub, displayValues.finalSalePrice]);

  const pricePerSqm = useMemo(() => {
    if (!effectiveAreaForCub || effectiveAreaForCub <= 0 || displayValues.finalSalePrice <= 0) return null;
    return displayValues.finalSalePrice / effectiveAreaForCub;
  }, [effectiveAreaForCub, displayValues.finalSalePrice]);

  const calculatorStateHash = useMemo(
    () =>
      JSON.stringify({
        minHourlyRate,
        useManualMinHourlyRate,
        fixedExpenses,
        personalExpenses,
        proLabore,
        productiveHours,
        factors: factors.map((f) => ({ id: f.id, weight: f.weight })),
        areaIntervals,
        area,
        selections,
        estimatedHours,
        commercialDiscount,
        variableExpenses,
        currentStep,
      }),
    [
      area,
      areaIntervals,
      commercialDiscount,
      currentStep,
      estimatedHours,
      factors,
      fixedExpenses,
      minHourlyRate,
      personalExpenses,
      proLabore,
      productiveHours,
      selections,
      useManualMinHourlyRate,
      variableExpenses,
    ]
  );

  const hasUnsavedChanges = useMemo(() => {
    if (!hydrationComplete || !lastCommittedHash) return false;
    if (shouldClearDraftOnExit) return false;
    return calculatorStateHash !== lastCommittedHash;
  }, [calculatorStateHash, hydrationComplete, lastCommittedHash, shouldClearDraftOnExit]);

  useEffect(() => {
    if (!hydrationComplete || lastCommittedHash !== null) return;
    setLastCommittedHash(calculatorStateHash);
  }, [calculatorStateHash, hydrationComplete, lastCommittedHash]);

  useEffect(() => {
    const clearDraft = () => {
      if (!shouldClearDraftOnExit) return;
      clearCalculatorDraft();
    };

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = "";
      }
      clearDraft();
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      clearDraft();
    };
  }, [hasUnsavedChanges, shouldClearDraftOnExit]);

  const hasComplexitySelections = Object.keys(selections).length > 0;
  const totalFactors = factors.length; // inclui área
  const selectedFactorsCount = Object.keys(selections).length;
  const areaFactor = factors.find(f => f.id === "area");
  const otherFactors = factors.filter(f => f.id !== "area");

  const fixedExpensesTotal = fixedExpenses.reduce((sum, exp) => sum + (exp.value || 0), 0);
  const personalExpensesTotal = personalExpenses.reduce((sum, exp) => sum + (exp.value || 0), 0);
  const requiredComplexitySelections = otherFactors.length + 1; // + area

  const stepPending = useMemo(() => {
    const step1Missing: string[] = [];
    if (useManualMinHourlyRate) {
      if (!minHourlyRate || minHourlyRate <= 0) step1Missing.push("Hora mínima");
    } else {
      if (fixedExpensesTotal <= 0) step1Missing.push("Despesas operacionais");
      if (personalExpensesTotal <= 0) step1Missing.push("Despesas pessoais");
      if (productiveHours <= 0) step1Missing.push("Horas produtivas");
    }

    const step2MissingCount = Math.max(0, requiredComplexitySelections - selectedFactorsCount);
    const step2Missing =
      step2MissingCount > 0
        ? [`${step2MissingCount} fator${step2MissingCount > 1 ? "es" : ""}`]
        : [];

    const step4Missing: string[] = [];
    if (estimatedHours <= 0) step4Missing.push("Horas estimadas");

    return {
      1: { count: step1Missing.length, missing: step1Missing, optional: false },
      2: { count: step2MissingCount, missing: step2Missing, optional: false },
      3: { count: 0, missing: [], optional: true },
      4: { count: step4Missing.length, missing: step4Missing, optional: false },
    } as const;
  }, [
    estimatedHours,
    fixedExpensesTotal,
    minHourlyRate,
    personalExpensesTotal,
    productiveHours,
    requiredComplexitySelections,
    selectedFactorsCount,
    useManualMinHourlyRate,
  ]);

  // ── Stepper ───────────────────────────────────────────────────
  const { stepComplete, canAdvance } = useCalculatorProgress({
    currentStep,
    setCurrentStep,
    setMaxStepReached,
    minHourlyRate,
    hasComplexitySelections,
    finalSalePrice: displayValues.finalSalePrice,
  });

  const stepVisualDone = (n: number) => maxStepReached > n;
  const currentStepLabel = STEPS.find((s) => s.n === currentStep)?.label ?? `Etapa ${currentStep}`;
  const canImportCurrentStep = savedBudgets.length > 0;
  const selectedImportBudget = useMemo(
    () => savedBudgets.find((budget) => budget.id === selectedImportBudgetId) ?? null,
    [savedBudgets, selectedImportBudgetId]
  );

  const handleNext = () => {
    if (currentStep < 4 && canAdvance) {
      setCurrentStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  // `useBlocker` requires a Data Router. This app uses BrowserRouter, so using
  // it here can crash the calculator route at runtime (blank screen).
  // Keep the `beforeunload` warning and disable SPA route blocking for now.
  const navigationBlocker = useMemo(
    () => ({
      state: "unblocked" as "blocked" | "unblocked",
      reset: () => {},
      proceed: () => {},
    }),
    []
  );

  useEffect(() => {
    if (navigationBlocker.state !== "blocked") return;
    setConfirmLeaveOpen(true);
  }, [navigationBlocker.state]);

  useEffect(() => {
    if (!shouldClearDraftOnExit || !lastCommittedHash) return;
    if (calculatorStateHash !== lastCommittedHash) {
      setShouldClearDraftOnExit(false);
    }
  }, [calculatorStateHash, lastCommittedHash, shouldClearDraftOnExit]);

  const handleBudgetSaved = useCallback(() => {
    setShouldClearDraftOnExit(true);
    setLastCommittedHash(calculatorStateHash);
    setHydrationComplete(true);
    setDraftStatus("idle");
    toast({
      tone: "success",
      title: "Cálculo salvo",
      description: "Você pode sair da página; o rascunho local será limpo ao recarregar ou navegar.",
    });
  }, [calculatorStateHash, toast]);

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
    setLastCommittedHash(null);
    setHydrationComplete(true);
    setShouldClearDraftOnExit(false);
    toast({
      tone: "info",
      title: "Cálculo reiniciado",
      description: "Os dados preenchidos foram reiniciados sem apagar o cálculo salvo.",
    });
  }, [handleConfirmResetCalculation, toast]);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (confirmClearAllOpen || confirmClearStepOpen || importStepDialogOpen || confirmLeaveOpen) return;

      if (event.altKey && event.key === "ArrowRight") {
        event.preventDefault();
        if (currentStep < 4 && canAdvance) setCurrentStep((s) => s + 1);
        return;
      }
      if (event.altKey && event.key === "ArrowLeft") {
        event.preventDefault();
        if (currentStep > 1) setCurrentStep((s) => s - 1);
        return;
      }
      if (event.altKey && /^[1-4]$/.test(event.key)) {
        event.preventDefault();
        const targetStep = Number(event.key);
        const canGoToReached = targetStep <= maxStepReached;
        const canGoToNext = targetStep === maxStepReached + 1 && stepComplete(targetStep - 1);
        if (canGoToReached || canGoToNext) setCurrentStep(targetStep);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    canAdvance,
    confirmClearAllOpen,
    confirmClearStepOpen,
    confirmLeaveOpen,
    currentStep,
    importStepDialogOpen,
    maxStepReached,
    setCurrentStep,
    stepComplete,
  ]);



  // ── Painel de resultados (compartilhado desktop/mobile) ────────
  const ResultsPanel = () => (
    <CalculatorResultsPanel
      minHourlyRate={minHourlyRate}
      hasComplexitySelections={hasComplexitySelections}
      globalComplexity={globalComplexity}
      currentStep={currentStep}
      currentStepLabel={currentStepLabel}
      currentStepPendingCount={stepPending[currentStep as 1 | 2 | 3 | 4].count}
      currentStepPendingMissing={stepPending[currentStep as 1 | 2 | 3 | 4].missing}
      selectedFactorsCount={selectedFactorsCount}
      totalFactors={totalFactors}
      estimatedHours={estimatedHours}
      commercialDiscount={commercialDiscount}
      cubPercentage={cubPercentage}
      pricePerSqm={pricePerSqm}
      displayValues={displayValues}
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
          className="mb-7 sm:mb-8 text-center"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-calcularq-blue mb-2">
            Calculadora de Precificação
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Descubra sua hora técnica mínima, classifique a complexidade do projeto, ajuste os pesos (opcional) e finalize a composição do preço.
          </p>
        </motion.div>

        {/* Stepper horizontal unificado */}
        <div className="mb-7 sm:mb-8 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
          <div className="flex min-w-full justify-center">
            <div className="flex w-max items-start gap-0">
            {STEPS.map((step, i) => {
              const done = stepVisualDone(step.n);
              const active = currentStep === step.n;
              const handleClick = () => {
                const canGoToReached = step.n <= maxStepReached;
                const canGoToNext = step.n === maxStepReached + 1 && stepComplete(step.n - 1);
                if (canGoToReached || canGoToNext) setCurrentStep(step.n);
              };
              return (
                <div key={step.n} className="flex items-start">
                  <div className="flex flex-col items-center w-[5.1rem] sm:w-[6.2rem] md:w-[7.8rem]">
                    <button
                      type="button"
                      onClick={handleClick}
                      title={
                        stepPending[step.n as 1 | 2 | 3 | 4].count > 0
                          ? `Faltam ${stepPending[step.n as 1 | 2 | 3 | 4].missing.join(", ")}`
                          : stepPending[step.n as 1 | 2 | 3 | 4].optional
                            ? "Etapa opcional"
                            : step.label
                      }
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
                    {stepPending[step.n as 1 | 2 | 3 | 4].count > 0 && !done ? (
                        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-1 text-[10px] font-semibold leading-none text-blue-700">
                          {stepPending[step.n as 1 | 2 | 3 | 4].count}
                        </span>
                      ) : null}
                    </button>
                    <span
                      className={`mt-1.5 text-[13px] sm:text-sm font-medium text-center leading-tight max-w-[12ch]
                      ${done || active ? "text-calcularq-blue" : "text-slate-400"}`}
                      style={{ textWrap: "balance" }}
                    >
                      {step.label}
                    </span>
                    {active && stepPending[step.n as 1 | 2 | 3 | 4].count > 0 ? (
                      <span className="mt-1 text-[10px] sm:text-xs font-medium text-blue-700 text-center leading-tight max-w-[12ch]">
                        Faltam {stepPending[step.n as 1 | 2 | 3 | 4].count}
                      </span>
                    ) : stepPending[step.n as 1 | 2 | 3 | 4].optional ? (
                      <span className="mt-1 text-[10px] sm:text-xs font-medium text-slate-400 text-center">Opcional</span>
                    ) : null}
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
              className="mb-5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    onClick={handleOpenImportStepDialog}
                    disabled={!canImportCurrentStep}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs sm:text-sm font-semibold text-calcularq-blue hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                    title={`Importar dados para ${currentStepLabel} a partir de um cálculo salvo (sem alterar outras etapas)`}
                  >
                    <Download className="h-4 w-4" />
                    Importar dados da etapa
                  </button>
                  <details className="relative w-full sm:w-auto group">
                    <summary className="list-none inline-flex w-full sm:w-auto cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200/90 bg-transparent px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-800">
                      <MoreHorizontal className="h-4 w-4" />
                      Mais ações
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
                    </div>
                  </details>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
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
                <span
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 font-medium text-slate-400"
                  title="Atalhos: Alt+← / Alt+→ / Alt+1-4"
                >
                  Atalhos
                </span>
              </div>
            </motion.div>

        <div className="lg:hidden sticky top-20 z-10 mb-4">
          <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">Etapa {currentStep} de 4</p>
                <p className="truncate text-sm font-semibold text-calcularq-blue">{currentStepLabel}</p>
              </div>
              {stepPending[currentStep as 1 | 2 | 3 | 4].count > 0 ? (
                <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                  Faltam {stepPending[currentStep as 1 | 2 | 3 | 4].count}
                </span>
              ) : stepPending[currentStep as 1 | 2 | 3 | 4].optional ? (
                <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                  Opcional
                </span>
              ) : null}
            </div>
          </div>
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

                {currentStep === 3 && (
                  <ComplexityConfig
                    factors={factors}
                    onFactorWeightChange={handleFactorWeightChange}
                  />
                )}

                {currentStep === 2 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
                    <SectionHeader
                      title="Análise de complexidade"
                      description="Selecione as características do projeto específico que está precificando"
                      icon={<BarChart2 className="w-5 h-5 text-calcularq-blue" />}
                    />

                    <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-blue-50/70">
                      <p className="text-sm text-blue-800">
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
                          intervals={areaIntervals}
                          onIntervalsChange={setAreaIntervals}
                        />
                      )}
                      {otherFactors.map((factor) => (
                        <FactorCard
                          key={factor.id}
                          factor={factor}
                          value={selections[factor.id]}
                          onChange={handleSelectionChange}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {currentStep === 4 && minHourlyRate && minHourlyRate > 0 && results && (
                  <FinalCalculation
                    budgetId={budgetId || undefined}
                    initialBudgetName={loadedBudgetName || undefined}
                    initialClientName={loadedClientName || undefined}
                    initialProjectName={loadedProjectName || undefined}
                    initialDescription={loadedBudgetDescription || undefined}
                    proLabore={proLabore}
                    minHourlyRate={minHourlyRate}
                    globalComplexity={results.globalComplexity}
                    adjustedHourlyRate={results.adjustedHourlyRate}
                    estimatedHours={estimatedHours}
                    onEstimatedHoursChange={setEstimatedHours}
                    commercialDiscount={commercialDiscount}
                    onCommercialDiscountChange={setCommercialDiscount}
                    variableExpenses={variableExpenses}
                    onVariableExpensesChange={setVariableExpenses}
                    projectPrice={results.projectPrice}
                    finalSalePrice={displayValues.finalSalePrice}
                    factorLevels={selections}
                    area={area}
                    factors={factors}
                    areaIntervals={areaIntervals}
                    fixedExpenses={fixedExpenses}
                    personalExpenses={personalExpenses}
                    productiveHours={productiveHours}
                    useManualMinHourlyRate={useManualMinHourlyRate}
                    onBudgetSaved={handleBudgetSaved}
                    mobileResultsContent={
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: prefersReducedMotion ? 0.12 : 0.18 }}
                        className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-6"
                      >
                        <SectionHeader
                          compact
                          title="Resultados"
                          description="Resumo do cálculo atual"
                          icon={<PieChart className="w-5 h-5 text-calcularq-blue" />}
                        />
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/30 overflow-hidden">
                          <ResultsPanel />
                        </div>
                      </motion.div>
                    }
                  />
                )}
                {currentStep === 4 && (!minHourlyRate || !results) && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
                    <p className="text-slate-500">Complete as etapas anteriores para chegar ao cálculo final.</p>
                    <button type="button" onClick={() => setCurrentStep(1)} className="mt-4 text-sm font-semibold text-calcularq-blue underline">
                      Voltar ao início
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

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
              <div className="rounded-2xl border border-slate-100 bg-slate-50/30 overflow-hidden">
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

          {currentStep < 4 ? (
            <button
              onClick={handleNext}
              disabled={!canAdvance}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors
                ${canAdvance ? "bg-calcularq-blue text-white hover:bg-calcularq-blue/90 shadow-sm" : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
            >
              Próxima etapa
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-32" />
          )}
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
            ? "Deseja reiniciar todos os dados preenchidos deste cálculo? O cálculo salvo permanecerá intacto."
            : "Deseja reiniciar todos os dados preenchidos deste cálculo?"
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
          setConfirmLeaveOpen(open);
          if (!open && navigationBlocker.state === "blocked") {
            navigationBlocker.reset();
          }
        }}
        title="Sair sem salvar?"
        description="Há alterações não salvas neste cálculo. Se sair agora, você pode perder mudanças recentes."
        confirmLabel="Sair sem salvar"
        confirmVariant="danger"
        onConfirm={() => {
          setConfirmLeaveOpen(false);
          if (navigationBlocker.state === "blocked") {
            navigationBlocker.proceed();
          }
        }}
      />
    </div>
  );
}

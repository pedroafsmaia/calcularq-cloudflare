import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart2, ChevronRight, ChevronLeft, PieChart } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

import MinimumHourCalculator from "../components/calculator/MinimumHourCalculator";
import ComplexityConfig from "../components/calculator/ComplexityConfig";
import AreaFactorCard from "../components/calculator/AreaFactorCard";
import FactorCard from "../components/pricing/FactorCard";
import FinalCalculation from "../components/calculator/FinalCalculation";
import Tooltip from "@/components/ui/Tooltip";

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

const STEPS = [
  { n: 1, label: "Hora Técnica" },
  { n: 2, label: "Pesos" },
  { n: 3, label: "Complexidade" },
  { n: 4, label: "Preço Final" },
];

// Chave do localStorage para rascunho
const DRAFT_KEY = "calcularq_draft_v1";

function saveDraft(data: object) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)); } catch { /* silencioso */ }
}

function loadDraft(): any | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function Calculator() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const budgetId = searchParams.get("budget");
  const [loadedBudgetName, setLoadedBudgetName] = useState<string | null>(null);
  const [loadedClientName, setLoadedClientName] = useState<string | null>(null);
  const [loadedProjectName, setLoadedProjectName] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [maxStepReached, setMaxStepReached] = useState(1);

  // Seção 1
  const [minHourlyRate, setMinHourlyRate] = useState<number | null>(null);
  const [fixedExpenses, setFixedExpenses] = useState<Array<{ id: string; name: string; value: number }>>([]);
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
  const [variableExpenses, setVariableExpenses] = useState<Array<{ id: string; name: string; value: number }>>([]);

  // Restaurar último cálculo
  const [lastBudgetExpenses, setLastBudgetExpenses] = useState<Array<{ id: string; name: string; value: number }> | null>(null);
  const [lastBudgetProLabore, setLastBudgetProLabore] = useState<number | null>(null);
  const [lastBudgetProductiveHours, setLastBudgetProductiveHours] = useState<number | null>(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);

  // ── Autosave em localStorage ──────────────────────────────────
  const draftSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user || budgetId) return;
    if (draftSaveRef.current) clearTimeout(draftSaveRef.current);
    draftSaveRef.current = setTimeout(() => {
      saveDraft({
        minHourlyRate, fixedExpenses, proLabore, productiveHours,
        factors: factors.map(f => ({ id: f.id, weight: f.weight })),
        areaIntervals, area, selections,
        estimatedHours, commercialDiscount, variableExpenses,
        currentStep, maxStepReached,
        savedAt: Date.now(),
      });
    }, 800);
  }, [
    minHourlyRate, fixedExpenses, proLabore, productiveHours,
    factors, areaIntervals, area, selections,
    estimatedHours, commercialDiscount, variableExpenses,
    currentStep, maxStepReached,
  ]);

  // ── Restaurar rascunho do localStorage ao montar ──────────────
  const draftRestoredRef = useRef(false);
  useEffect(() => {
    if (draftRestoredRef.current || budgetId || !user) return;
    draftRestoredRef.current = true;

    const draft = loadDraft();
    if (!draft || !draft.minHourlyRate) return;

    // Só restaura se o rascunho for recente (< 24h) e não vier de outro usuário
    const age = Date.now() - (draft.savedAt || 0);
    if (age > 24 * 60 * 60 * 1000) return;

    setMinHourlyRate(draft.minHourlyRate ?? null);
    if (draft.fixedExpenses) setFixedExpenses(draft.fixedExpenses);
    if (draft.proLabore) setProLabore(draft.proLabore);
    if (draft.productiveHours) setProductiveHours(draft.productiveHours);
    if (draft.factors) {
      setFactors(DEFAULT_FACTORS.map(df => {
        const saved = draft.factors.find((f: any) => f.id === df.id);
        return saved ? { ...df, weight: saved.weight } : df;
      }));
    }
    if (draft.areaIntervals) setAreaIntervals(draft.areaIntervals);
    if (draft.area) setArea(draft.area);
    if (draft.selections) setSelections(draft.selections);
    if (draft.estimatedHours) setEstimatedHours(draft.estimatedHours);
    if (draft.commercialDiscount) setCommercialDiscount(draft.commercialDiscount);
    if (draft.variableExpenses) setVariableExpenses(draft.variableExpenses);
    if (draft.currentStep) setCurrentStep(draft.currentStep);
    if (draft.maxStepReached) setMaxStepReached(draft.maxStepReached);
  }, [user, budgetId]);

  // ── Buscar último budget para banner de restauração ───────────
  useEffect(() => {
    const fetchLastBudget = async () => {
      if (!user || budgetId) return;
      try {
        const resp = await api.listBudgets();
        if (resp.budgets && resp.budgets.length > 0) {
          const last = resp.budgets[0];
          const hasExpenses = last.data?.fixedExpenses && last.data.fixedExpenses.length > 0;
          if (hasExpenses) {
            setLastBudgetExpenses(last.data.fixedExpenses ?? null);
            setLastBudgetProLabore(last.data.proLabore ?? null);
            setLastBudgetProductiveHours(last.data.productiveHours ?? null);
            setShowRestorePrompt(true);
          }
        }
      } catch { /* silencioso */ }
    };
    fetchLastBudget();
  }, [user, budgetId]);

  const handleRestoreLastExpenses = () => {
    if (lastBudgetExpenses) {
      setFixedExpenses(lastBudgetExpenses);
      if (lastBudgetProLabore !== null) setProLabore(lastBudgetProLabore);
      if (lastBudgetProductiveHours !== null) setProductiveHours(lastBudgetProductiveHours);
    }
    setShowRestorePrompt(false);
  };

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
        setMinHourlyRate(budget.data.minHourlyRate);

        setFactors(budget.data.factors.map((f: any) => {
          const defaultFactor = DEFAULT_FACTORS.find(df => df.id === f.id);
          return { ...defaultFactor!, weight: f.weight };
        }));

        setAreaIntervals(budget.data.areaIntervals);
        setSelections(budget.data.selections);
        setEstimatedHours(budget.data.estimatedHours);
        setVariableExpenses(budget.data.variableExpenses || []);

        if (budget.data.commercialDiscount !== undefined) setCommercialDiscount(budget.data.commercialDiscount);
        if (budget.data.fixedExpenses) setFixedExpenses(budget.data.fixedExpenses);
        if (budget.data.proLabore !== undefined) setProLabore(budget.data.proLabore);
        if (budget.data.productiveHours !== undefined) setProductiveHours(budget.data.productiveHours);

        const areaFactor = budget.data.factors.find((f: any) => f.id === "area");
        if (areaFactor) {
          const interval = budget.data.areaIntervals.find((i: any) => i.level === areaFactor.level);
          if (interval) {
            const max = interval.max ?? interval.min;
            setArea((interval.min + max) / 2);
          }
        }
        setCurrentStep(4);
        setMaxStepReached(4);
      } catch (e) {
        console.error("Erro ao carregar cálculo:", e);
      }
    };
    loadBudget();
  }, [budgetId, user]);

  useEffect(() => {
    setMaxStepReached(prev => Math.max(prev, currentStep));
  }, [currentStep]);

  // ── Handlers ──────────────────────────────────────────────────
  const handleMinHourRateCalculate = useCallback((rate: number) => {
    setMinHourlyRate(rate);
  }, []);

  const handleFactorWeightChange = useCallback((factorId: string, weight: number) => {
    setFactors(prev => prev.map(f => f.id === factorId ? { ...f, weight } : f));
  }, []);

  const handleResetWeights = useCallback(() => setFactors(DEFAULT_FACTORS), []);

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
    const totalFixedExpenses = fixedExpenses.reduce((sum, exp) => sum + exp.value, 0);
    const fixedCostPerHour = productiveHours > 0 ? totalFixedExpenses / productiveHours : 0;
    const adjustedHourlyRate = minHourlyRate && minHourlyRate > 0 && globalComplexity > 0
      ? minHourlyRate * globalComplexity : 0;
    const projectPrice = adjustedHourlyRate > 0 && estimatedHours > 0
      ? adjustedHourlyRate * estimatedHours : 0;
    const projectPriceWithDiscount = projectPrice * (1 - commercialDiscount / 100);
    const discountAmount = projectPrice * (commercialDiscount / 100);
    const finalSalePrice = projectPriceWithDiscount + totalVariableExpenses;
    const profit = productiveHours > 0 && projectPriceWithDiscount > 0 && estimatedHours > 0
      ? projectPriceWithDiscount - (fixedCostPerHour * estimatedHours) : null;
    return {
      totalVariableExpenses, adjustedHourlyRate, projectPrice,
      projectPriceWithDiscount, discountAmount, finalSalePrice, profit,
    };
  }, [minHourlyRate, globalComplexity, estimatedHours, commercialDiscount, variableExpenses, fixedExpenses, productiveHours]);

  const CUB_MEDIO = 2800;
  const effectiveAreaForCub = useMemo(() => {
    if (typeof area === "number" && Number.isFinite(area) && area > 0) return area;

    const selectedAreaLevel = selections.area;
    if (!selectedAreaLevel) return null;

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

  const hasComplexitySelections = Object.keys(selections).length > 0;
  const totalFactors = factors.length; // inclui área
  const selectedFactorsCount = Object.keys(selections).length;
  const areaFactor = factors.find(f => f.id === "area");
  const otherFactors = factors.filter(f => f.id !== "area");

  // ── Stepper ───────────────────────────────────────────────────
  const stepComplete = (n: number) => {
    if (n === 1) return !!(minHourlyRate && minHourlyRate > 0);
    if (n === 2) return true; // opcional
    if (n === 3) return hasComplexitySelections;
    return displayValues.finalSalePrice > 0;
  };
  const stepVisualDone = (n: number) => maxStepReached > n;
  const canAdvance = stepComplete(currentStep);

  const handleNext = () => {
    if (currentStep < 4 && canAdvance) {
      setCurrentStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };



  // ── Painel de resultados (compartilhado desktop/mobile) ────────
  const ResultsPanel = () => (
    <>
      {(!minHourlyRate || minHourlyRate <= 0) ? (
        /* Estado vazio — igual ao padrão do sistema */
        <div className="bg-white p-5 space-y-3">
          <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-slate-400 text-lg font-bold">1</span>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Comece pela Etapa 1</p>
            <p className="text-xs text-slate-400">
              Preencha sua hora técnica mínima para ver os resultados aqui.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white p-5 space-y-4">

          {/* BASE DO CÁLCULO */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-calcularq-blue text-center mb-3">Base do Cálculo</p>
            <div className="space-y-1 text-sm text-slate-600">
              <div className="flex justify-between gap-3">
                <span className="min-w-0">Hora Técnica Mínima</span>
                <span className="font-medium text-slate-800 whitespace-nowrap">
                  R$ {minHourlyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h
                </span>
              </div>
              {hasComplexitySelections && (
                <div className="flex justify-between gap-3">
                  <span className="min-w-0">Complexidade Global</span>
                  <span className="font-medium text-slate-800 whitespace-nowrap">{globalComplexity.toFixed(2)}x</span>
                </div>
              )}
              {displayValues.adjustedHourlyRate > 0 && (
                <div className="flex justify-between gap-3 pt-1 border-t border-slate-200 mt-1">
                  <span className="font-bold text-calcularq-blue min-w-0">Hora Ajustada</span>
                  <span className="font-bold text-calcularq-blue whitespace-nowrap">
                    R$ {displayValues.adjustedHourlyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Indicador de fatores — etapa 3 */}
          {currentStep === 3 && (
            <div className="flex items-center justify-between px-1 text-xs text-slate-500">
              <span>Fatores classificados</span>
              <span className={`font-semibold ${selectedFactorsCount === totalFactors ? "text-green-600" : "text-calcularq-blue"}`}>
                {selectedFactorsCount} / {totalFactors}
              </span>
            </div>
          )}

          {/* LINHAS DE COMPOSIÇÃO */}
          {displayValues.projectPrice > 0 && (
            <div className="space-y-2 text-sm px-1">
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-600 flex-1">
                  Preço do Projeto
                  {estimatedHours > 0 && displayValues.adjustedHourlyRate > 0 && (
                    <span className="block text-slate-400 text-xs">
                      {estimatedHours}h × R$ {displayValues.adjustedHourlyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </span>
                <span className="font-semibold text-slate-800 whitespace-nowrap">
                  R$ {displayValues.projectPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {displayValues.totalVariableExpenses > 0 && (
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-slate-600 min-w-0">(+) Despesas Variáveis</span>
                  <span className="font-semibold text-slate-800 whitespace-nowrap">
                    R$ {displayValues.totalVariableExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {displayValues.discountAmount > 0 && (
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-slate-600 min-w-0">(-) Desconto ({commercialDiscount}%)</span>
                  <span className="font-semibold text-red-500 whitespace-nowrap">
                    - R$ {displayValues.discountAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* PREÇO FINAL */}
          {displayValues.finalSalePrice > 0 ? (
            <div className="bg-calcularq-blue rounded-lg p-4 text-center">
              <p className="text-xs font-semibold text-blue-200 mb-1">Preço de Venda Final</p>
              <p className="text-2xl font-bold text-white">
                R$ {displayValues.finalSalePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
              <p className="text-xs text-slate-400">O preço de venda aparecerá aqui</p>
            </div>
          )}

          {/* % DO VALOR DA OBRA (CUB) */}
          {cubPercentage !== null && (
            <div className="flex justify-between items-center gap-3 px-1 pt-1 border-t border-slate-100">
              <span className="min-w-0 flex items-center gap-1 text-sm text-slate-500">
                % do valor da obra
                <Tooltip text="Estimativa baseada no CUB médio nacional (R$ 2.800/m²). É apenas uma referência — o valor real da obra varia conforme a região, o padrão construtivo e o tipo de projeto." />
              </span>
              <span className="text-sm font-bold text-calcularq-blue whitespace-nowrap">
                {cubPercentage.toFixed(1)}%
              </span>
            </div>
          )}

          {/* LUCRO ESTIMADO */}
          {displayValues.profit !== null && (
            <div className="flex justify-between items-center gap-3 px-1 pt-1 border-t border-slate-100">
              <span className="min-w-0 text-sm text-slate-500">Lucro Estimado</span>
              <span className={`text-sm font-bold whitespace-nowrap ${displayValues.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                R$ {displayValues.profit.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}

        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 text-center"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-calcularq-blue mb-2">
            Precifique seu projeto em 4 etapas
          </h1>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Descubra sua hora técnica mínima, ajuste os pesos (opcional), classifique a complexidade do projeto e finalize a composição do preço.
          </p>
        </motion.div>

        {/* Stepper horizontal unificado */}
        <div className="mb-10 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto">
          <div className="flex min-w-max mx-auto items-start gap-0">
            {STEPS.map((step, i) => {
              const done = stepVisualDone(step.n);
              const active = currentStep === step.n;
              const handleClick = () => {
                const canJumpSkipWeights = step.n === 3 && maxStepReached === 1 && stepComplete(1);
                const canGoToReached = step.n <= maxStepReached;
                const canGoToNext = step.n === maxStepReached + 1 && stepComplete(step.n - 1);
                if (canGoToReached || canGoToNext || canJumpSkipWeights) setCurrentStep(step.n);
              };
              return (
                <div key={step.n} className="flex items-start">
                  <div className="flex flex-col items-center w-16 sm:w-20 md:w-24">
                    <button
                      type="button"
                      onClick={handleClick}
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2
                        ${done ? "bg-calcularq-blue border-calcularq-blue text-white shadow-md"
                          : active ? "bg-white border-calcularq-blue text-calcularq-blue shadow-sm"
                          : "bg-white border-slate-200 text-slate-400 cursor-default"}`}
                    >
                      {done ? "✓" : step.n}
                    </button>
                    <span className={`mt-1.5 text-xs font-medium text-center leading-tight
                      ${done || active ? "text-calcularq-blue" : "text-slate-400"}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="mt-5 h-0.5 w-4 sm:w-6 md:w-10 shrink-0 transition-colors duration-300"
                      style={{ backgroundColor: done ? "#1e3a8a" : "#e2e8f0" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-8">
          {/* Coluna principal */}
          <div className="flex-1 min-w-0">

            {/* Banner restaurar */}
            {showRestorePrompt && currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-6"
              >
                <p className="text-sm text-blue-800">
                  <strong>Preencher com os dados do seu último cálculo salvo?</strong>{" "}
                  Despesas fixas, pró-labore mínimo e horas produtivas serão preenchidos automaticamente.
                </p>
                <div className="flex gap-2 shrink-0">
                  <button onClick={handleRestoreLastExpenses} className="text-sm font-semibold text-white bg-calcularq-blue px-4 py-2 rounded-lg hover:bg-calcularq-blue/90 transition-colors">
                    Restaurar
                  </button>
                  <button onClick={() => setShowRestorePrompt(false)} className="text-sm font-medium text-slate-500 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                    Ignorar
                  </button>
                </div>
              </motion.div>
            )}

            {/* Conteúdo da etapa */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                {currentStep === 1 && (
                  <MinimumHourCalculator
                    onCalculate={handleMinHourRateCalculate}
                    initialMinHourRate={minHourlyRate || undefined}
                    onFixedExpensesChange={setFixedExpenses}
                    onProductiveHoursChange={setProductiveHours}
                    onProLaboreChange={setProLabore}
                    initialFixedExpenses={fixedExpenses}
                    initialProductiveHours={productiveHours}
                    initialProLabore={proLabore}
                  />
                )}

                {currentStep === 2 && (
                  <ComplexityConfig
                    factors={factors}
                    onFactorWeightChange={handleFactorWeightChange}
                    onResetWeights={handleResetWeights}
                  />
                )}

                {currentStep === 3 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-calcularq-blue/10 flex items-center justify-center">
                        <BarChart2 className="w-5 h-5 text-calcularq-blue" />
                      </div>
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-calcularq-blue">Análise de Complexidade</h2>
                        <p className="text-sm text-slate-500 mt-1">
                          Selecione as características do projeto específico que está precificando
                        </p>
                      </div>
                    </div>

                    <div className="mb-6 p-4 rounded-lg border border-blue-200" style={{ background: "rgba(239,246,255,0.70)" }}>
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
                    finalSalePrice={results.finalSalePrice}
                    factorLevels={selections}
                    factors={factors}
                    areaIntervals={areaIntervals}
                    fixedExpenses={fixedExpenses}
                    productiveHours={productiveHours}
                    mobileResultsContent={
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-calcularq-blue/10 flex items-center justify-center">
                            <PieChart className="w-5 h-5 text-calcularq-blue" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-calcularq-blue">Resultados</h2>
                            <p className="text-sm text-slate-500">Resumo do cálculo atual</p>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                          <ResultsPanel />
                        </div>
                      </motion.div>
                    }
                  />
                )}
                {currentStep === 4 && (!minHourlyRate || !results) && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
                    <p className="text-slate-500">Complete as etapas anteriores para chegar ao cálculo final.</p>
                    <button onClick={() => setCurrentStep(1)} className="mt-4 text-sm font-semibold text-calcularq-blue underline">
                      Voltar ao início
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

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

          {/* Painel lateral — desktop */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-calcularq-blue px-6 py-4 rounded-t-2xl">
                  <h3 className="text-lg font-bold text-white text-center">Resultados</h3>
                </div>
                <ResultsPanel />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

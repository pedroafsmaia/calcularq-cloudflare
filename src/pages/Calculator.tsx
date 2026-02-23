import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart2, ChevronRight, ChevronLeft, PieChart, Download, Trash2 } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

import MinimumHourCalculator from "../components/calculator/MinimumHourCalculator";
import ComplexityConfig from "../components/calculator/ComplexityConfig";
import AreaFactorCard from "../components/calculator/AreaFactorCard";
import FactorCard from "../components/pricing/FactorCard";
import FinalCalculation from "../components/calculator/FinalCalculation";
import SectionHeader from "../components/calculator/SectionHeader";
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
  const [useManualMinHourlyRate, setUseManualMinHourlyRate] = useState(false);
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
  const [lastBudgetData, setLastBudgetData] = useState<any | null>(null);

  // ── Autosave em localStorage ──────────────────────────────────
  const draftSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!user || budgetId) return;
    if (draftSaveRef.current) clearTimeout(draftSaveRef.current);
    draftSaveRef.current = setTimeout(() => {
      saveDraft({
        minHourlyRate, useManualMinHourlyRate, fixedExpenses, proLabore, productiveHours,
        factors: factors.map(f => ({ id: f.id, weight: f.weight })),
        areaIntervals, area, selections,
        estimatedHours, commercialDiscount, variableExpenses,
        currentStep, maxStepReached,
        savedAt: Date.now(),
      });
    }, 800);
  }, [
    minHourlyRate, useManualMinHourlyRate, fixedExpenses, proLabore, productiveHours,
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
    setUseManualMinHourlyRate(Boolean(draft.useManualMinHourlyRate));
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
    if (draft.commercialDiscount !== undefined) setCommercialDiscount(draft.commercialDiscount);
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
          setLastBudgetData(last.data ?? null);
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
        setMinHourlyRate(budget.data.minHourlyRate);
        setUseManualMinHourlyRate(Boolean(budget.data.useManualMinHourlyRate));

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

        if (typeof budget.data.area === "number" && Number.isFinite(budget.data.area)) {
          setArea(budget.data.area);
        } else {
          const areaFactor = budget.data.factors.find((f: any) => f.id === "area");
          if (areaFactor) {
            const interval = budget.data.areaIntervals.find((i: any) => i.level === areaFactor.level);
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

  const handleImportCurrentStepFromLastBudget = useCallback(() => {
    if (!lastBudgetData) return;

    if (currentStep === 1) {
      setMinHourlyRate(lastBudgetData.minHourlyRate ?? null);
      setUseManualMinHourlyRate(Boolean(lastBudgetData.useManualMinHourlyRate));
      setFixedExpenses(Array.isArray(lastBudgetData.fixedExpenses) ? lastBudgetData.fixedExpenses : []);
      setProLabore(typeof lastBudgetData.proLabore === "number" ? lastBudgetData.proLabore : 0);
      setProductiveHours(typeof lastBudgetData.productiveHours === "number" ? lastBudgetData.productiveHours : 0);
      return;
    }

    if (currentStep === 2) {
      if (Array.isArray(lastBudgetData.factors)) {
        setFactors(DEFAULT_FACTORS.map((df) => {
          const saved = lastBudgetData.factors.find((f: any) => f.id === df.id);
          return saved ? { ...df, weight: saved.weight } : df;
        }));
      }
      return;
    }

    if (currentStep === 3) {
      if (Array.isArray(lastBudgetData.areaIntervals)) setAreaIntervals(lastBudgetData.areaIntervals);
      if (lastBudgetData.selections) setSelections(lastBudgetData.selections);

      if (typeof lastBudgetData.area === "number" && Number.isFinite(lastBudgetData.area)) {
        setArea(lastBudgetData.area);
      } else {
        const areaLevel = Number(lastBudgetData.selections?.area ?? lastBudgetData.factors?.find?.((f: any) => f.id === "area")?.level);
        const sourceIntervals = Array.isArray(lastBudgetData.areaIntervals) ? lastBudgetData.areaIntervals : areaIntervals;
        const interval = sourceIntervals.find((i: any) => i.level === areaLevel);
        if (interval) {
          const max = typeof interval.max === "number" ? interval.max : interval.min;
          setArea((interval.min + max) / 2);
        } else {
          setArea(null);
        }
      }
      return;
    }

    if (currentStep === 4) {
      setEstimatedHours(typeof lastBudgetData.estimatedHours === "number" ? lastBudgetData.estimatedHours : 0);
      setCommercialDiscount(typeof lastBudgetData.commercialDiscount === "number" ? lastBudgetData.commercialDiscount : 0);
      setVariableExpenses(Array.isArray(lastBudgetData.variableExpenses) ? lastBudgetData.variableExpenses : []);
    }
  }, [currentStep, lastBudgetData, areaIntervals]);

  const handleClearCurrentStep = useCallback(() => {
    const stepName = STEPS.find((s) => s.n === currentStep)?.label ?? `Etapa ${currentStep}`;
    if (!window.confirm(`Limpar os dados preenchidos de "${stepName}"?`)) return;

    if (currentStep === 1) {
      setMinHourlyRate(null);
      setUseManualMinHourlyRate(false);
      setFixedExpenses([]);
      setProLabore(0);
      setProductiveHours(0);
      return;
    }

    if (currentStep === 2) {
      setFactors(DEFAULT_FACTORS);
      return;
    }

    if (currentStep === 3) {
      setArea(null);
      setSelections({});
      setAreaIntervals(DEFAULT_AREA_INTERVALS);
      return;
    }

    if (currentStep === 4) {
      setEstimatedHours(0);
      setCommercialDiscount(0);
      setVariableExpenses([]);
    }
  }, [currentStep]);

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
  const currentStepLabel = STEPS.find((s) => s.n === currentStep)?.label ?? `Etapa ${currentStep}`;
  const canImportCurrentStep = Boolean(lastBudgetData);

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
        <div className="bg-white p-4 sm:p-5 space-y-4">

          {/* BASE DO CÁLCULO */}
          <div className="bg-calcularq-blue/10 border border-calcularq-blue/15 rounded-xl p-4 sm:p-5">
            <p className="text-sm font-semibold text-calcularq-blue text-center mb-3">Base do Cálculo</p>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 leading-snug">Hora Técnica Mínima</span>
                <span className="font-medium text-slate-800 whitespace-nowrap">
                  R$ {minHourlyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h
                </span>
              </div>
              {hasComplexitySelections && (
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 leading-snug">Complexidade Global</span>
                  <span className="font-medium text-slate-800 whitespace-nowrap">{globalComplexity.toFixed(2)}x</span>
                </div>
              )}
              {displayValues.adjustedHourlyRate > 0 && (
                <div className="flex items-start justify-between gap-3 pt-2 border-t border-slate-200 mt-1">
                  <span className="font-bold text-calcularq-blue min-w-0 leading-snug">Hora Ajustada</span>
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
            <div className="space-y-2 text-sm px-1 py-1">
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-600 flex-1 leading-snug">
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
                  <span className="text-slate-600 min-w-0 leading-snug">(+) Despesas Variáveis</span>
                  <span className="font-semibold text-slate-800 whitespace-nowrap">
                    R$ {displayValues.totalVariableExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {displayValues.discountAmount > 0 && (
                <div className="flex justify-between items-baseline gap-2">
                  <span className="text-slate-600 min-w-0 leading-snug">(-) Desconto ({commercialDiscount}%)</span>
                  <span className="font-semibold text-red-500 whitespace-nowrap">
                    - R$ {displayValues.discountAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* PREÇO FINAL */}
          {displayValues.finalSalePrice > 0 ? (
            <div className="bg-calcularq-blue rounded-xl p-4 text-center shadow-sm">
              <p className="text-xs font-semibold text-blue-200 mb-1">Preço de Venda Final</p>
              <p className="text-2xl font-bold text-white">
                R$ {displayValues.finalSalePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400">O preço de venda aparecerá aqui</p>
            </div>
          )}

          {displayValues.finalSalePrice > 0 && (
            <>
              {/* % DO VALOR DA OBRA (CUB) COM ALERTA POR FAIXA */}
              <div className="flex justify-between items-center gap-3 px-1 pt-1 border-t border-slate-100">
                <span className="min-w-0 flex items-center gap-1 text-sm text-slate-500">
                  % do valor da obra
                  <Tooltip text={"Estimativa baseada no CUB médio nacional (R$ 2.800/m²). A faixa de referência do CAU/BR costuma ficar entre 2% e 11% do valor da obra. É apenas uma referência — o valor real varia conforme a região, o padrão e o tipo de projeto."} />
                </span>
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  <span className={`text-sm font-bold ${
                    cubPercentage !== null
                      ? cubPercentage < 2
                        ? "text-red-500"
                        : cubPercentage > 11
                          ? "text-amber-500"
                          : "text-green-600"
                      : "text-calcularq-blue"
                  }`}>
                    {cubPercentage !== null ? `${cubPercentage.toFixed(1)}%` : "—"}
                  </span>
                  {cubPercentage !== null && (cubPercentage < 2 || cubPercentage > 11) && (
                    <Tooltip
                      tone={cubPercentage < 2 ? "danger" : "warning"}
                      iconClassName={cubPercentage < 2 ? "text-red-500 hover:text-red-600" : "text-amber-500 hover:text-amber-600"}
                      text={
                        cubPercentage < 2
                          ? "Atenção: abaixo da faixa sugerida pelo CAU (2% a 11%). Isso pode indicar revisão de horas/escopo, mas também pode refletir custos operacionais mais baixos."
                          : "Atenção: acima da faixa sugerida pelo CAU (2% a 11%). Isso pode ser adequado em projetos de maior complexidade técnica."
                      }
                    />
                  )}
                </span>
              </div>

              {/* LUCRO ESTIMADO */}
              {displayValues.profit !== null && (
                <div className="flex justify-between items-center gap-3 px-1 pt-1 border-t border-slate-100">
                  <span className="min-w-0 text-sm text-slate-500">Lucro Estimado</span>
                  <span className={`text-sm font-bold whitespace-nowrap ${displayValues.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                    R$ {displayValues.profit.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </>
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
          className="mb-7 sm:mb-8 text-center"
        >
          <h1 className="text-3xl sm:text-4xl font-bold text-calcularq-blue mb-2">
            Calculadora de Precificação
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Descubra sua hora técnica mínima, ajuste os pesos (opcional), classifique a complexidade do projeto e finalize a composição do preço.
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
                const canJumpSkipWeights = step.n === 3 && maxStepReached === 1 && stepComplete(1);
                const canGoToReached = step.n <= maxStepReached;
                const canGoToNext = step.n === maxStepReached + 1 && stepComplete(step.n - 1);
                if (canGoToReached || canGoToNext || canJumpSkipWeights) setCurrentStep(step.n);
              };
              return (
                <div key={step.n} className="flex items-start">
                  <div className="flex flex-col items-center w-[4.4rem] sm:w-[5.4rem] md:w-[6.4rem]">
                    <button
                      type="button"
                      onClick={handleClick}
                      className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2
                        ${done ? "bg-calcularq-blue border-calcularq-blue text-white shadow-md"
                          : active ? "bg-white border-calcularq-blue text-calcularq-blue shadow-sm"
                          : "bg-white border-slate-200 text-slate-400 cursor-default"}`}
                    >
                      {done ? "✓" : step.n}
                    </button>
                    <span className={`mt-1.5 text-[13px] sm:text-sm font-medium text-center leading-tight
                      ${done || active ? "text-calcularq-blue" : "text-slate-400"}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="mt-[1.35rem] sm:mt-6 h-0.5 sm:h-1 w-5 sm:w-7 md:w-11 shrink-0 rounded-full transition-colors duration-300"
                      style={{ backgroundColor: done ? "#1e3a8a" : "#e2e8f0" }}
                    />
                  )}
                </div>
              );
            })}
            </div>
          </div>
        </div>

            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <button
                    type="button"
                    onClick={handleImportCurrentStepFromLastBudget}
                    disabled={!canImportCurrentStep}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-slate-200/90 bg-transparent px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                    title={`Importar dados do último cálculo para ${currentStepLabel}`}
                  >
                    <Download className="h-4 w-4" />
                    {"Importar dados do \u00faltimo c\u00e1lculo"}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCurrentStep}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg border border-slate-200/90 bg-transparent px-3 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-800"
                    title={`Limpar dados da etapa ${currentStepLabel}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Limpar dados da etapa
                  </button>
              </div>
            </motion.div>

        <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8">
          {/* Coluna principal */}
          <div className="flex-1 min-w-0">

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
                    initialUseManual={useManualMinHourlyRate}
                    onManualModeChange={setUseManualMinHourlyRate}
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
                  />
                )}

                {currentStep === 3 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
                    <SectionHeader
                      title="Análise de complexidade"
                      description="Selecione as características do projeto específico que está precificando"
                      icon={<BarChart2 className="w-5 h-5 text-calcularq-blue" />}
                    />

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
                    finalSalePrice={displayValues.finalSalePrice}
                    factorLevels={selections}
                    area={area}
                    factors={factors}
                    areaIntervals={areaIntervals}
                    fixedExpenses={fixedExpenses}
                    productiveHours={productiveHours}
                    useManualMinHourlyRate={useManualMinHourlyRate}
                    mobileResultsContent={
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
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
                    <button onClick={() => setCurrentStep(1)} className="mt-4 text-sm font-semibold text-calcularq-blue underline">
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
    </div>
  );
}

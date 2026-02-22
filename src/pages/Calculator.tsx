import { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart2, ChevronRight, ChevronLeft } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

import MinimumHourCalculator from "../components/calculator/MinimumHourCalculator";
import ComplexityConfig from "../components/calculator/ComplexityConfig";
import AreaFactorCard from "../components/calculator/AreaFactorCard";
import FactorCard from "../components/pricing/FactorCard";
import FinalCalculation from "../components/calculator/FinalCalculation";

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

export default function Calculator() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const budgetId = searchParams.get("budget");
  const [loadedBudgetName, setLoadedBudgetName] = useState<string | null>(null);
  const [loadedClientName, setLoadedClientName] = useState<string | null>(null);
  const [loadedProjectName, setLoadedProjectName] = useState<string | null>(null);

  // Etapa ativa
  const [currentStep, setCurrentStep] = useState(1);

  // Seção 1: Hora Técnica Mínima
  const [minHourlyRate, setMinHourlyRate] = useState<number | null>(null);
  const [fixedExpenses, setFixedExpenses] = useState<Array<{ id: string; name: string; value: number }>>([]);
  const [proLabore, setProLabore] = useState(0);
  const [productiveHours, setProductiveHours] = useState(0);

  // Seção 2: Configurações
  const [factors, setFactors] = useState<Factor[]>(DEFAULT_FACTORS);
  const [areaIntervals, setAreaIntervals] = useState<AreaInterval[]>(DEFAULT_AREA_INTERVALS);

  // Seção 3: Análise de Complexidade
  const [area, setArea] = useState<number | null>(null);
  const [selections, setSelections] = useState<Record<string, number>>({});

  // Seção 4: Cálculo Final
  const [estimatedHours, setEstimatedHours] = useState(0);
  const [commercialDiscount, setCommercialDiscount] = useState(0);
  const [variableExpenses, setVariableExpenses] = useState<Array<{ id: string; name: string; value: number }>>([]);

  // Resgatar despesas do último cálculo salvo
  const [lastBudgetExpenses, setLastBudgetExpenses] = useState<Array<{ id: string; name: string; value: number }> | null>(null);
  const [lastBudgetProLabore, setLastBudgetProLabore] = useState<number | null>(null);
  const [lastBudgetProductiveHours, setLastBudgetProductiveHours] = useState<number | null>(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);

  // Mobile: resumo de resultados (bottom sheet)
  const [mobileResultsOpen, setMobileResultsOpen] = useState(false);

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
      } catch {
        // Silencioso
      }
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

  // Carregar cálculo salvo se houver ID na URL
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
        // Ao carregar um cálculo salvo, ir direto para a última etapa
        setCurrentStep(4);
      } catch (e) {
        console.error("Erro ao carregar cálculo:", e);
      }
    };
    loadBudget();
  }, [budgetId, user]);

  // Handlers
  const handleMinHourRateCalculate = useCallback((rate: number) => {
    setMinHourlyRate(rate);
  }, []);

  const handleFactorWeightChange = useCallback((factorId: string, weight: number) => {
    setFactors(prev => prev.map(f => f.id === factorId ? { ...f, weight } : f));
  }, []);

  const handleResetWeights = useCallback(() => {
    setFactors(DEFAULT_FACTORS);
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

  // Cálculos
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
    const adjustedHourlyRate = minHourlyRate && minHourlyRate > 0 && globalComplexity > 0 ? minHourlyRate * globalComplexity : 0;
    const projectPrice = adjustedHourlyRate > 0 && estimatedHours > 0 ? adjustedHourlyRate * estimatedHours : 0;
    const projectPriceWithDiscount = projectPrice * (1 - commercialDiscount / 100);
    const discountAmount = projectPrice * (commercialDiscount / 100);
    const finalSalePrice = projectPriceWithDiscount + totalVariableExpenses;
    const profit = productiveHours > 0 && projectPriceWithDiscount > 0 && estimatedHours > 0
      ? projectPriceWithDiscount - (fixedCostPerHour * estimatedHours)
      : null;
    return { totalVariableExpenses, adjustedHourlyRate, projectPrice, projectPriceWithDiscount, discountAmount, finalSalePrice, profit };
  }, [minHourlyRate, globalComplexity, estimatedHours, commercialDiscount, variableExpenses, fixedExpenses, productiveHours]);

  const hasComplexitySelections = Object.keys(selections).length > 0;
  const areaFactor = factors.find(f => f.id === "area");
  const otherFactors = factors.filter(f => f.id !== "area");

  // Lógica de conclusão de cada etapa
  const stepDone = (n: number) => {
    if (n === 1) return !!(minHourlyRate && minHourlyRate > 0);
    // Etapa 2 (Pesos) não deve bloquear avanço: valores padrão funcionam.
    if (n === 2) return true;
    // Etapa 3: precisa classificar o projeto (seleções)
    if (n === 3) return hasComplexitySelections;
    // Etapa 4: ter um preço final calculado
    return displayValues.finalSalePrice > 0;
  };

  const canAdvance = stepDone(currentStep);

  const handleNext = () => {
    if (currentStep < 4 && canAdvance) setCurrentStep(s => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 pb-28 lg:pb-12">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-calcularq-blue mb-3">Calculadora de Precificação</h1>
          <p className="text-lg text-slate-600">
            Insira suas despesas fixas, calibre os fatores de complexidade e adicione os custos
            variáveis para chegar a um preço justo, que remunera corretamente a dificuldade do seu trabalho.
          </p>
        </motion.div>

        <div className="flex gap-8">

          {/* Barra de progresso vertical */}
          <div className="hidden lg:flex flex-col items-center pt-2 shrink-0">
            {STEPS.map((step, i) => {
              const done = stepDone(step.n);
              const active = currentStep === step.n;
              return (
                <div key={step.n} className="flex flex-col items-center">
                  <button
                    onClick={() => {
                      // Permite navegar para qualquer etapa já liberada ou anterior
                      if (step.n <= currentStep || stepDone(step.n - 1)) setCurrentStep(step.n);
                    }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2
                      ${done ? "bg-calcularq-blue border-calcularq-blue text-white shadow-md" :
                        active ? "bg-white border-calcularq-blue text-calcularq-blue shadow-md" :
                        "bg-white border-slate-200 text-slate-400"}`}
                    title={step.label}
                  >
                    {done ? "✓" : step.n}
                  </button>
                  <span className={`text-xs mt-1 mb-1 font-medium text-center w-20 leading-tight
                    ${done || active ? "text-calcularq-blue" : "text-slate-400"}`}>
                    {step.label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className={`w-0.5 h-10 transition-colors duration-300 ${done ? "bg-calcularq-blue" : "bg-slate-200"}`} />
                  )}
                </div>
              );
            })}
          </div>

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

            {/* Conteúdo da etapa ativa */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.25 }}
              >
                {/* ETAPA 1 */}
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

                {/* ETAPA 2 */}
                {currentStep === 2 && (
                  <ComplexityConfig
                    factors={factors}
                    onFactorWeightChange={handleFactorWeightChange}
                    onResetWeights={handleResetWeights}
                  />
                )}

                {/* ETAPA 3 */}
                {currentStep === 3 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-calcularq-blue/10 flex items-center justify-center">
                        <BarChart2 className="w-5 h-5 text-calcularq-blue" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-calcularq-blue">Análise de Complexidade</h2>
                        <p className="text-sm text-slate-500 mt-1">
                          Selecione as características do projeto específico que está precificando
                        </p>
                      </div>
                    </div>

                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
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

                {/* ETAPA 4 */}
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

            {/* Botões de navegação */}
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

              {/* Indicador mobile */}
              <span className="text-xs text-slate-400 lg:hidden">
                {currentStep} de {STEPS.length}
              </span>

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

          {/* Painel lateral de resultados */}
          <div className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-calcularq-blue px-6 py-4">
                  <h3 className="text-lg font-bold text-white text-center">Resultados</h3>
                </div>

                {(!minHourlyRate || minHourlyRate <= 0) ? (
                  <div className="px-6 py-10 text-center">
                    <p className="text-slate-400 text-sm">Preencha a Hora Técnica Mínima para ver os resultados.</p>
                  </div>
                ) : (
                  <div className="p-5 space-y-4">

                    {/* BASE DO CÁLCULO */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                      <p className="text-xs font-bold text-calcularq-blue uppercase tracking-widest text-center mb-3">Base do Cálculo</p>
                      <div className="space-y-1 text-sm text-slate-600">
                        <div className="flex justify-between">
                          <span>Hora Técnica Mínima</span>
                          <span className="font-medium text-slate-800">
                            R$ {minHourlyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h
                          </span>
                        </div>
                        {hasComplexitySelections && (
                          <div className="flex justify-between">
                            <span>Complexidade Global</span>
                            <span className="font-medium text-slate-800">{globalComplexity.toFixed(2)}x</span>
                          </div>
                        )}
                        {displayValues.adjustedHourlyRate > 0 && (
                          <div className="flex justify-between pt-1 border-t border-slate-200 mt-1">
                            <span className="font-bold text-calcularq-blue">Hora Técnica Ajustada</span>
                            <span className="font-bold text-calcularq-blue">
                              R$ {displayValues.adjustedHourlyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

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
                          <div className="flex justify-between items-baseline">
                            <span className="text-slate-600">(+) Despesas Variáveis</span>
                            <span className="font-semibold text-slate-800 whitespace-nowrap">
                              R$ {displayValues.totalVariableExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}

                        {displayValues.discountAmount > 0 && (
                          <div className="flex justify-between items-baseline">
                            <span className="text-slate-600">(-) Desconto ({commercialDiscount}%)</span>
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
                        <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Preço de Venda Final</p>
                        <p className="text-2xl font-bold text-white">
                          R$ {displayValues.finalSalePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                        <p className="text-xs text-slate-400">Preencha a Composição Final para ver o preço</p>
                      </div>
                    )}

                    {/* LUCRO ESTIMADO */}
                    {displayValues.profit !== null && (
                      <div className="flex justify-between items-center px-1 pt-1 border-t border-slate-100">
                        <span className="text-sm text-slate-500">Lucro Estimado</span>
                        <span className={`text-sm font-bold ${displayValues.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                          R$ {displayValues.profit.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Mobile: barra fixa de resultados + bottom sheet */}
        <div className="lg:hidden">
          <div className="fixed inset-x-0 bottom-0 z-40" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
              <div className="mb-3 rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMobileResultsOpen(true)}
                  className="w-full flex items-center justify-between gap-4 px-4 py-3"
                >
                  <div className="text-left min-w-0">
                    <p className="text-xs text-slate-500">Resultados</p>
                    {displayValues.finalSalePrice > 0 ? (
                      <p className="text-lg font-bold text-slate-900 truncate">
                        R$ {displayValues.finalSalePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    ) : (
                      <p className="text-sm font-semibold text-slate-400 truncate">Complete as etapas para ver o preço</p>
                    )}
                  </div>
                  <div className="shrink-0 text-sm font-semibold text-calcularq-blue flex items-center gap-2">
                    Ver detalhes
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {mobileResultsOpen && (
              <>
                <motion.button
                  type="button"
                  aria-label="Fechar resultados"
                  className="fixed inset-0 bg-black/30 z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setMobileResultsOpen(false)}
                />
                <motion.div
                  className="fixed inset-x-0 bottom-0 z-50"
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 24, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-6">
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                        <div>
                          <p className="text-xs text-slate-500">Resultados</p>
                          <p className="text-lg font-bold text-slate-900">Detalhamento</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMobileResultsOpen(false)}
                          className="text-sm font-semibold text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-50"
                        >
                          Fechar
                        </button>
                      </div>

                      {(!minHourlyRate || minHourlyRate <= 0) ? (
                        <div className="px-5 py-10 text-center">
                          <p className="text-slate-400 text-sm">Preencha a Hora Técnica Mínima para ver os resultados.</p>
                        </div>
                      ) : (
                        <div className="p-5 space-y-4">
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                            <p className="text-xs font-bold text-calcularq-blue uppercase tracking-widest text-center mb-3">Base do Cálculo</p>
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
                                  <span className="font-bold text-calcularq-blue min-w-0">Hora Técnica Ajustada</span>
                                  <span className="font-bold text-calcularq-blue whitespace-nowrap">
                                    R$ {displayValues.adjustedHourlyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

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

                          {displayValues.finalSalePrice > 0 ? (
                            <div className="bg-calcularq-blue rounded-lg p-4 text-center">
                              <p className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">Preço de Venda Final</p>
                              <p className="text-2xl font-bold text-white">
                                R$ {displayValues.finalSalePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                            </div>
                          ) : (
                            <div className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center">
                              <p className="text-xs text-slate-400">Preencha a Composição Final para ver o preço</p>
                            </div>
                          )}

                          {displayValues.profit !== null && (
                            <div className="flex justify-between items-center px-1 pt-1 border-t border-slate-100">
                              <span className="text-sm text-slate-500">Lucro Estimado</span>
                              <span className={`text-sm font-bold ${displayValues.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                                R$ {displayValues.profit.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

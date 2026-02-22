import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
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

export default function Calculator() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const budgetId = searchParams.get("budget");
  const [loadedBudgetName, setLoadedBudgetName] = useState<string | null>(null);
  const [loadedClientName, setLoadedClientName] = useState<string | null>(null);
  const [loadedProjectName, setLoadedProjectName] = useState<string | null>(null);

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
  const [commercialDiscount, setCommercialDiscount] = useState(0); // 0 a 100 (%)
  const [variableExpenses, setVariableExpenses] = useState<Array<{ id: string; name: string; value: number }>>([]);

  // Resgatar despesas do último cálculo salvo
  const [lastBudgetExpenses, setLastBudgetExpenses] = useState<Array<{ id: string; name: string; value: number }> | null>(null);
  const [lastBudgetProLabore, setLastBudgetProLabore] = useState<number | null>(null);
  const [lastBudgetProductiveHours, setLastBudgetProductiveHours] = useState<number | null>(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);

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
          return {
            ...defaultFactor!,
            weight: f.weight,
          };
        }));

        setAreaIntervals(budget.data.areaIntervals);
        setSelections(budget.data.selections);
        setEstimatedHours(budget.data.estimatedHours);
        setVariableExpenses(budget.data.variableExpenses || []);

        if (budget.data.commercialDiscount !== undefined) {
          setCommercialDiscount(budget.data.commercialDiscount);
        }
        if (budget.data.fixedExpenses) {
          setFixedExpenses(budget.data.fixedExpenses);
        }
        if (budget.data.proLabore !== undefined) {
          setProLabore(budget.data.proLabore);
        }
        if (budget.data.productiveHours !== undefined) {
          setProductiveHours(budget.data.productiveHours);
        }

        // Área (a partir do nível do fator de área)
        const areaFactor = budget.data.factors.find((f: any) => f.id === "area");
        if (areaFactor) {
          const interval = budget.data.areaIntervals.find((i: any) => i.level === areaFactor.level);
          if (interval) {
            // Usa o meio do intervalo como aproximação para preencher o input
            const max = interval.max ?? interval.min;
            setArea((interval.min + max) / 2);
          }
        }
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
    setFactors(prev => 
      prev.map(f => f.id === factorId ? { ...f, weight } : f)
    );
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
    setSelections(prev => ({
      ...prev,
      [factorId]: value
    }));
  }, []);

  // Cálculos
  const globalComplexity = useMemo(() => {
    return calculateGlobalComplexity(factors, selections);
  }, [factors, selections]);

  const results = useMemo(() => {
    if (!minHourlyRate || minHourlyRate <= 0) {
      return null;
    }
    const totalVariableExpenses = variableExpenses.reduce((sum, exp) => sum + exp.value, 0);
    return calculateProjectValue(
      minHourlyRate,
      estimatedHours,
      globalComplexity,
      totalVariableExpenses
    );
  }, [minHourlyRate, estimatedHours, globalComplexity, variableExpenses]);

  // Todos os valores derivados em um único useMemo para evitar duplicação
  const displayValues = useMemo(() => {
    const totalVariableExpenses = variableExpenses.reduce((sum, exp) => sum + exp.value, 0);
    const totalFixedExpenses = fixedExpenses.reduce((sum, exp) => sum + exp.value, 0);
    const fixedCostPerHour = productiveHours > 0 ? totalFixedExpenses / productiveHours : 0;

    const adjustedHourlyRate = minHourlyRate && minHourlyRate > 0 && globalComplexity > 0
      ? minHourlyRate * globalComplexity
      : 0;

    const projectPrice = adjustedHourlyRate > 0 && estimatedHours > 0
      ? adjustedHourlyRate * estimatedHours
      : 0;

    const projectPriceWithDiscount = projectPrice * (1 - commercialDiscount / 100);
    const discountAmount = projectPrice * (commercialDiscount / 100);
    const finalSalePrice = projectPriceWithDiscount + totalVariableExpenses;

    const profit = productiveHours > 0 && projectPriceWithDiscount > 0 && estimatedHours > 0
      ? projectPriceWithDiscount - (fixedCostPerHour * estimatedHours)
      : null;

    return {
      totalVariableExpenses,
      adjustedHourlyRate,
      projectPrice,
      projectPriceWithDiscount,
      discountAmount,
      finalSalePrice,
      profit,
    };
  }, [minHourlyRate, globalComplexity, estimatedHours, commercialDiscount, variableExpenses, fixedExpenses, productiveHours]);

  const hasComplexitySelections = Object.keys(selections).length > 0;

  const areaFactor = factors.find(f => f.id === "area");
  const otherFactors = factors.filter(f => f.id !== "area");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-bold text-calcularq-blue mb-3">
            Calculadora de Precificação
          </h1>
          <p className="text-lg text-slate-600">
            Insira suas despesas fixas, calibre os fatores de complexidade e adicione os custos
            variáveis para chegar a um preço justo, que remunera corretamente a dificuldade do seu trabalho.
          </p>
        </motion.div>

        {/* Indicador de progresso */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[
            { n: 1, label: "Hora Técnica" },
            { n: 2, label: "Pesos" },
            { n: 3, label: "Complexidade" },
            { n: 4, label: "Preço Final" },
          ].map((step, i, arr) => {
            const done =
              step.n === 1 ? !!(minHourlyRate && minHourlyRate > 0) :
              step.n === 2 ? hasComplexitySelections :
              step.n === 3 ? hasComplexitySelections && displayValues.finalSalePrice > 0 :
              displayValues.finalSalePrice > 0;
            const active =
              step.n === 1 ? !(minHourlyRate && minHourlyRate > 0) :
              step.n === 2 ? !!(minHourlyRate && minHourlyRate > 0) && !hasComplexitySelections :
              step.n === 3 ? hasComplexitySelections && displayValues.finalSalePrice <= 0 :
              displayValues.finalSalePrice > 0;
            return (
              <div key={step.n} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                    ${done ? "bg-calcularq-blue text-white" : active ? "bg-calcularq-blue/20 text-calcularq-blue border-2 border-calcularq-blue" : "bg-slate-100 text-slate-400"}`}>
                    {done ? "✓" : step.n}
                  </div>
                  <span className={`text-xs hidden sm:block ${done || active ? "text-calcularq-blue font-medium" : "text-slate-400"}`}>
                    {step.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`w-8 sm:w-16 h-0.5 mb-4 transition-colors ${done ? "bg-calcularq-blue" : "bg-slate-200"}`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal: Conteúdo */}
          <div className="lg:col-span-2 space-y-8">
          {/* Banner: resgatar despesas do último cálculo */}
          {showRestorePrompt && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4"
            >
              <p className="text-sm text-blue-800">
                <strong>Preencher com os dados do seu último cálculo salvo?</strong>{" "}
                Despesas fixas, pró-labore mín. e horas produtivas serão preenchidos automaticamente.
              </p>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleRestoreLastExpenses}
                  className="text-sm font-semibold text-white bg-calcularq-blue px-4 py-2 rounded-lg hover:bg-calcularq-blue/90 transition-colors"
                >
                  Restaurar
                </button>
                <button
                  onClick={() => setShowRestorePrompt(false)}
                  className="text-sm font-medium text-slate-500 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Ignorar
                </button>
              </div>
            </motion.div>
          )}

          {/* Seção 1: Calculadora da Hora Técnica Mínima */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
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
          </motion.section>

          {/* Seção 2: Configurações da Calculadora de Complexidade */}
          {minHourlyRate && minHourlyRate > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ComplexityConfig
                factors={factors}
                onFactorWeightChange={handleFactorWeightChange}
                onResetWeights={handleResetWeights}
              />
            </motion.section>
          )}

          {/* Seção 3: Análise de Complexidade */}
          {minHourlyRate && minHourlyRate > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-calcularq-blue/10 flex items-center justify-center">
                    <Info className="w-5 h-5 text-calcularq-blue" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-calcularq-blue">
                      Análise de Complexidade
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Selecione as características do projeto específico que está precificando
                    </p>
                  </div>
                </div>

                {/* Nota sobre instruções */}
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Precisa de apoio na classificação?</strong> Para entender os critérios técnicos e os exemplos práticos por trás de cada Fator e Valor,{" "}
                    <a 
                      href={createPageUrl("Manual")} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline font-semibold"
                    >
                      acesse o manual de instruções
                    </a>
                    .
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Área de Projeto com Régua */}
                  {areaFactor && (
                    <AreaFactorCard
                      area={area}
                      onAreaChange={handleAreaChange}
                      onLevelChange={handleAreaLevelChange}
                      intervals={areaIntervals}
                      onIntervalsChange={setAreaIntervals}
                    />
                  )}

                  {/* Outros Fatores */}
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
            </motion.section>
          )}

          {/* Seção 4: Cálculo Final do Preço */}
          {minHourlyRate && minHourlyRate > 0 && results && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
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
            </motion.section>
          )}

          {/* Mensagem inicial */}
          {(!minHourlyRate || minHourlyRate <= 0) && (
            <div className="text-center py-12">
              <p className="text-slate-500">
                Preencha os dados acima para continuar.
              </p>
            </div>
          )}
          </div>

          {/* Coluna Lateral: Resultados Fixos */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="bg-calcularq-blue px-6 py-4">
                  <h3 className="text-lg font-bold text-white tracking-wide text-center uppercase">Resumo</h3>
                </div>

                {(!minHourlyRate || minHourlyRate <= 0) ? (
                  <div className="px-6 py-10 text-center">
                    <p className="text-slate-400 text-sm">Preencha a Hora Técnica Mínima para ver o resumo.</p>
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
                            <span className="text-slate-600">
                              (-) Desconto ({commercialDiscount}%)
                            </span>
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
      </div>
    </div>
  );
}

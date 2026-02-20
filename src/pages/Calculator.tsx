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

  // Calcular valores intermediários para exibição progressiva
  const totalVariableExpensesForDisplay = variableExpenses.reduce((sum, exp) => sum + exp.value, 0);
  
  // Calcular hora técnica ajustada mesmo sem horas estimadas
  const adjustedHourlyRateIntermediate = minHourlyRate && minHourlyRate > 0 && globalComplexity > 0
    ? minHourlyRate * globalComplexity
    : 0;
  
  // Calcular preço do projeto mesmo sem todas as condições
  const projectPriceIntermediate = adjustedHourlyRateIntermediate > 0 && estimatedHours > 0
    ? adjustedHourlyRateIntermediate * estimatedHours
    : 0;
  
  const projectPriceWithDiscount = projectPriceIntermediate > 0
    ? projectPriceIntermediate * (1 - commercialDiscount / 100)
    : 0;
  const discountAmount = projectPriceIntermediate > 0
    ? projectPriceIntermediate * (commercialDiscount / 100)
    : 0;
  const finalSalePriceWithDiscount = projectPriceWithDiscount + totalVariableExpensesForDisplay;
  
  const totalFixedExpenses = fixedExpenses.reduce((sum, exp) => sum + exp.value, 0);
  const fixedCostPerHour = productiveHours > 0 ? totalFixedExpenses / productiveHours : 0;
  const profit = productiveHours > 0 && projectPriceWithDiscount > 0 && estimatedHours > 0
    ? projectPriceWithDiscount - (fixedCostPerHour * estimatedHours)
    : null;
  
  // Verificar se há seleções de complexidade
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Principal: Conteúdo */}
          <div className="lg:col-span-2 space-y-8">
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

                {/* Resumo dos Níveis de Complexidade - Movido para o final da seção */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-3">Níveis de Complexidade dos Fatores:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {Object.entries(selections).map(([factorId, level]) => {
                      const factor = factors.find(f => f.id === factorId);
                      const factorName = factor ? factor.name : factorId;
                      return (
                        <div key={factorId} className="text-sm">
                          <span className="text-blue-700">{factorName}:</span>{" "}
                          <span className="font-semibold text-blue-900">Nível {level}</span>
                        </div>
                      );
                    })}
                  </div>
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
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-xl font-bold text-calcularq-blue mb-6">Resultados do Cálculo</h3>
                
                <div className="space-y-3">
                  {/* Hora Técnica Mínima */}
                  {minHourlyRate && minHourlyRate > 0 ? (
                    <div className="p-4 bg-calcularq-blue/10 rounded-lg border border-calcularq-blue/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-calcularq-blue">Hora Técnica Mínima:</span>
                        <span className="text-lg font-bold text-calcularq-blue">
                          R$ {minHourlyRate.toLocaleString("pt-BR", { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}/h
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-slate-400 text-xs">Preencha a Hora Técnica Mínima</p>
                    </div>
                  )}

                  {/* Complexidade Global */}
                  {hasComplexitySelections ? (
                    <div className="p-4 bg-calcularq-blue/10 rounded-lg border border-calcularq-blue/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-calcularq-blue">Complexidade Global:</span>
                        <span className="text-lg font-bold text-calcularq-blue">
                          {globalComplexity.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : minHourlyRate && minHourlyRate > 0 ? (
                    <div className="text-center py-2">
                      <p className="text-slate-400 text-xs">Configure a complexidade</p>
                    </div>
                  ) : null}

                  {/* Hora Técnica Ajustada */}
                  {adjustedHourlyRateIntermediate > 0 ? (
                    <div className="p-4 bg-calcularq-blue/10 rounded-lg border border-calcularq-blue/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-calcularq-blue">Hora Técnica Ajustada:</span>
                        <span className="text-lg font-bold text-calcularq-blue">
                          R$ {adjustedHourlyRateIntermediate.toLocaleString("pt-BR", { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}/h
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* Preço do Projeto */}
                  {projectPriceIntermediate > 0 ? (
                    <div className="p-4 bg-calcularq-blue/10 rounded-lg border border-calcularq-blue/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-calcularq-blue">Preço do Projeto:</span>
                        <span className="text-lg font-bold text-calcularq-blue">
                          R$ {projectPriceIntermediate.toLocaleString("pt-BR", { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* Total de Despesas Variáveis */}
                  {totalVariableExpensesForDisplay > 0 && (
                    <div className="p-4 bg-calcularq-blue/10 rounded-lg border border-calcularq-blue/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-calcularq-blue">Total de Despesas Variáveis:</span>
                        <span className="text-lg font-bold text-calcularq-blue">
                          R$ {totalVariableExpensesForDisplay.toLocaleString("pt-BR", { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Valor do Desconto */}
                  {discountAmount > 0 && (
                    <div className="p-4 bg-calcularq-blue/10 rounded-lg border border-calcularq-blue/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-calcularq-blue">Valor do Desconto:</span>
                        <span className="text-lg font-bold text-calcularq-blue">
                          R$ {discountAmount.toLocaleString("pt-BR", { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Preço de Venda Final */}
                  {finalSalePriceWithDiscount > 0 ? (
                    <div className="p-4 bg-calcularq-blue/10 rounded-lg border border-calcularq-blue/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-calcularq-blue">Preço de Venda Final:</span>
                        <span className="text-lg font-bold text-calcularq-blue">
                          R$ {finalSalePriceWithDiscount.toLocaleString("pt-BR", { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  {/* Lucro Estimado */}
                  {profit !== null && (
                    <div className="p-4 bg-calcularq-blue/10 rounded-lg border border-calcularq-blue/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-calcularq-blue">Lucro Estimado:</span>
                        <span className="text-lg font-bold text-calcularq-blue">
                          R$ {profit.toLocaleString("pt-BR", { 
                            minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                          })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Mensagem quando não há dados */}
                  {!minHourlyRate || minHourlyRate <= 0 ? (
                    <div className="text-center py-4">
                      <p className="text-slate-400 text-xs">Preencha os campos para ver os resultados</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

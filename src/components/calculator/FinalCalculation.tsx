import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, AlertTriangle, Clock3, DollarSign, TrendingUp } from "lucide-react";
import SectionHeader from "./SectionHeader";
import SaveBudgetButton from "./SaveBudgetButton";
import ExpenseCard, { type Expense } from "./ExpenseCard";
import type { BudgetData } from "@/types/budget";
import type { Method10Output, CenarioMethod10, TipologiaMethod10 } from "@/components/pricing/PricingEngineMethod12";
import Tooltip from "@/components/ui/Tooltip";
import { parsePtBrNumber, sanitizeNumberDraft } from "@/lib/numberFormat";
import { technicalPremiumGroup } from "@/lib/methodCalibration";

type FactorSnapshot = {
  id: string;
  name: string;
  weight: number;
};

type AreaIntervalSnapshot = {
  min: number;
  max: number | null;
  level: number;
};

type Props = {
  budgetId?: string;
  initialBudgetName?: string;
  initialClientName?: string;
  initialProjectName?: string;
  initialDescription?: string;
  minHourlyRate: number;
  useManualMinHourlyRate?: boolean;
  fixedExpenses?: Expense[];
  personalExpenses?: Expense[];
  proLabore?: number;
  productiveHours?: number;
  area: number;
  factors: FactorSnapshot[];
  areaIntervals: AreaIntervalSnapshot[];
  selections: Record<string, number>;
  margin: number;
  onMarginChange: (value: number) => void;
  technicalPremium: number;
  onTechnicalPremiumChange: (value: number) => void;
  tipologia: TipologiaMethod10;
  volumetria: number;
  reforma: boolean;
  cenario: CenarioMethod10;
  onCenarioChange: (value: CenarioMethod10) => void;
  commercialDiscount: number;
  onCommercialDiscountChange: (value: number) => void;
  variableExpenses: Expense[];
  onVariableExpensesChange: (expenses: Expense[]) => void;
  horasManual: number | null;
  onHorasManualChange: (value: number | null) => void;
  h50: number;
  hCons: number;
  output: Method10Output;
  onBudgetSaved?: () => void;
  mobileResultsPanel?: ReactNode;
};

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

const TECHNICAL_PREMIUM_OPTIONS = [
  { value: 0.15, label: "Suave" },
  { value: 0.25, label: "Equilibrado" },
  { value: 0.35, label: "Agressivo" },
] as const;

const MARGIN_OPTIONS = [
  { value: 0.1, label: "Baixa (10%)" },
  { value: 0.15, label: "Média (15%)" },
  { value: 0.2, label: "Alta (20%)" },
] as const;

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatHours = (value: number) =>
  value.toLocaleString("pt-BR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 1,
  });

const findClosestPremiumOption = (value: number) => {
  return TECHNICAL_PREMIUM_OPTIONS.reduce((closest, option) => {
    const optionDistance = Math.abs(option.value - value);
    const closestDistance = Math.abs(closest.value - value);
    return optionDistance < closestDistance ? option : closest;
  }, TECHNICAL_PREMIUM_OPTIONS[1]);
};

export default function FinalCalculation({
  budgetId,
  initialBudgetName,
  initialClientName,
  initialProjectName,
  initialDescription,
  minHourlyRate,
  useManualMinHourlyRate,
  fixedExpenses,
  personalExpenses,
  proLabore,
  productiveHours,
  area,
  factors,
  areaIntervals,
  selections,
  margin,
  onMarginChange,
  technicalPremium,
  onTechnicalPremiumChange,
  tipologia,
  volumetria,
  reforma,
  cenario,
  onCenarioChange,
  commercialDiscount,
  onCommercialDiscountChange,
  variableExpenses,
  onVariableExpensesChange,
  horasManual,
  onHorasManualChange,
  h50,
  hCons,
  output,
  onBudgetSaved,
  mobileResultsPanel,
}: Props) {
  const [discountDraft, setDiscountDraft] = useState("0");
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const [customMarginDraft, setCustomMarginDraft] = useState("15");
  const [customPremiumDraft, setCustomPremiumDraft] = useState("25");

  const baseHoras = cenario === "conservador" ? hCons : h50;
  const horasUsadas = output.h_final;
  const sanitizedCommercialDiscount = Math.min(100, Math.max(0, Number(commercialDiscount) || 0));
  const totalVariableExpenses = useMemo(
    () => variableExpenses.reduce((sum, expense) => sum + (Number(expense.value) || 0), 0),
    [variableExpenses]
  );
  const discountAmount = output.preco_final * (sanitizedCommercialDiscount / 100);
  const finalSalePrice = output.preco_final - discountAmount + totalVariableExpenses;

  const percentualDiff = useMemo(() => {
    if (baseHoras <= 0) return 0;
    return ((horasUsadas - baseHoras) / baseHoras) * 100;
  }, [baseHoras, horasUsadas]);

  const showSubpricingAlert = percentualDiff <= -20;
  const showOverpricingAlert = percentualDiff >= 20;

  useEffect(() => {
    if (isEditingDiscount) return;
    setDiscountDraft(String(sanitizedCommercialDiscount));
  }, [sanitizedCommercialDiscount, isEditingDiscount]);

  useEffect(() => {
    const percent = clampPercent(margin * 100);
    setCustomMarginDraft(percent.toLocaleString("pt-BR", { maximumFractionDigits: 2 }));
  }, [margin]);

  useEffect(() => {
    const percent = clampPercent(technicalPremium * 100);
    setCustomPremiumDraft(percent.toLocaleString("pt-BR", { maximumFractionDigits: 2 }));
  }, [technicalPremium]);

  useEffect(() => {
    if (variableExpenses.length > 0) return;
    onVariableExpensesChange([{ id: Date.now().toString(), name: "", value: 0 }]);
  }, [onVariableExpensesChange, variableExpenses.length]);

  const technicalPremiumTooltipText = useMemo(() => {
    const technicalLevel = Math.max(1, Math.min(5, Math.round(Number(selections.technical ?? 1))));
    const cTech = (technicalLevel - 1) / 4;

    const maxLines = TECHNICAL_PREMIUM_OPTIONS.map((option) => {
      const maxHourly = minHourlyRate * (1 + margin + option.value * cTech);
      return `${option.label} (+${Math.round(option.value * 100)}%): ${formatCurrency(maxHourly)}/h`;
    });

    return [
      "Este prêmio ajusta a hora técnica, não apenas o preço final.",
      `Exigência técnica atual (F4): nível ${technicalLevel}.`,
      "Valores máximos simulados:",
      ...maxLines,
      "Baseado em simulações, ajustado com uso.",
    ].join("\n");
  }, [margin, minHourlyRate, selections.technical]);

  const applyMarginFromDraft = (draft: string) => {
    const parsed = parsePtBrNumber(draft);
    if (parsed === null) {
      onMarginChange(0);
      return;
    }
    onMarginChange(clampPercent(parsed) / 100);
  };

  const applyPremiumFromDraft = (draft: string) => {
    const parsed = parsePtBrNumber(draft);
    if (parsed === null) {
      onTechnicalPremiumChange(0.25);
      return;
    }

    const normalized = clampPercent(parsed) / 100;
    const closest = findClosestPremiumOption(normalized);
    onTechnicalPremiumChange(closest.value);
  };

  const handleAddExpense = (expense: Expense) => {
    onVariableExpensesChange([...variableExpenses, expense]);
  };

  const handleRemoveExpense = (id: string) => {
    onVariableExpensesChange(variableExpenses.filter((expense) => expense.id !== id));
  };

  const handleUpdateExpense = (id: string, updates: Partial<Expense>) => {
    onVariableExpensesChange(variableExpenses.map((expense) => (expense.id === id ? { ...expense, ...updates } : expense)));
  };

  const budgetData: BudgetData = {
    minHourlyRate,
    useManualMinHourlyRate,
    margemLucro: margin,
    tipologia,
    volumetria,
    reforma,
    cenarioEscolhido: cenario,
    h50Metodo: output.h50,
    hConsMetodo: output.h_cons,
    hUsuarioManual: horasManual ?? undefined,
    hFinal: output.h_final,
    scoreComplexidade: output.score_complexidade,
    classificacaoComplexidade: output.classificacao_complexidade,
    aValue: technicalPremium,
    aTestGroup: technicalPremiumGroup(technicalPremium),
    area,
    factors: factors.map((factor) => ({
      id: factor.id,
      name: factor.name,
      weight: factor.weight,
      level: selections[factor.id] ?? 0,
    })),
    areaIntervals,
    selections,
    estimatedHours: output.h_final,
    fixedExpenses: fixedExpenses ?? [],
    personalExpenses: personalExpenses ?? [],
    proLabore,
    productiveHours,
    commercialDiscount: sanitizedCommercialDiscount,
    variableExpenses,
    results: {
      globalComplexity: Number((output.score_complexidade / 100).toFixed(2)),
      adjustedHourlyRate: output.ht_aj,
      projectPrice: output.preco_final,
      finalSalePrice,
    },
    methodVersion: output.method_version,
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
        <SectionHeader
          title="Horas estimadas"
          description="Ajuste as horas sugeridas pelo método para este projeto."
          icon={<Clock3 className="h-5 w-5 text-calcularq-blue" />}
        />

        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <input
                type="radio"
                name="cenario"
                className="mr-2"
                checked={cenario === "conservador"}
                onChange={() => onCenarioChange("conservador")}
              />
              <strong>Conservador</strong> (recomendado)
            </label>
            <label className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
              <input
                type="radio"
                name="cenario"
                className="mr-2"
                checked={cenario === "otimista"}
                onChange={() => onCenarioChange("otimista")}
              />
              <strong>Otimista</strong>
            </label>
          </div>

          {cenario === "otimista" ? (
            <div className="flex items-start gap-3 rounded-xl border-l-4 border-blue-500 bg-blue-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="mb-0.5 text-sm font-semibold text-blue-900">Cenário otimista selecionado</p>
                <p className="text-sm text-blue-700">Este cenário não inclui margem de segurança para imprevistos.</p>
              </div>
            </div>
          ) : null}

          <div className="rounded-xl border border-calcularq-blue/15 bg-calcularq-blue/5 px-4 py-3">
            <p className="text-sm text-slate-600">Sugestão do método ({cenario})</p>
            <p className="text-2xl font-bold text-calcularq-blue">{formatHours(baseHoras)}h</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Usar outra estimativa (opcional)</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={horasManual ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                if (!value) {
                  onHorasManualChange(null);
                  return;
                }
                const parsed = Number(value);
                onHorasManualChange(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-calcularq-blue focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20"
              placeholder="Ex.: 220"
            />
          </div>

          {showSubpricingAlert ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <p>Risco de subprecificação: sua estimativa está {Math.abs(Math.round(percentualDiff))}% abaixo da sugestão.</p>
              </div>
            </div>
          ) : null}

          {showOverpricingAlert ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <p>Atenção: sua estimativa está {Math.round(percentualDiff)}% acima da sugestão de referência.</p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
        <SectionHeader
          title="Ajustes de preço"
          description="Defina margem, prêmio por complexidade e desconto comercial para calibrar a hora técnica ajustada."
          icon={<TrendingUp className="h-5 w-5 text-calcularq-blue" />}
        />

        <div className="space-y-5">
          <div>
            <h4 className="mb-2 text-sm font-semibold text-slate-800">Margem de lucro</h4>
            <div className="space-y-2">
              {MARGIN_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={[
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                    margin === option.value
                      ? "border-calcularq-blue bg-calcularq-blue/5 text-calcularq-blue"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="margin"
                    value={option.value}
                    checked={margin === option.value}
                    onChange={() => onMarginChange(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Margem personalizada (%)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={customMarginDraft}
                    onChange={(event) => {
                      const nextDraft = sanitizeNumberDraft(event.target.value);
                      setCustomMarginDraft(nextDraft);
                      applyMarginFromDraft(nextDraft);
                    }}
                    onBlur={() => {
                      const parsed = parsePtBrNumber(customMarginDraft);
                      if (parsed === null) {
                        setCustomMarginDraft("");
                        onMarginChange(0);
                        return;
                      }
                      const clamped = clampPercent(parsed);
                      setCustomMarginDraft(clamped.toLocaleString("pt-BR", { maximumFractionDigits: 2 }));
                      onMarginChange(clamped / 100);
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-8 text-sm focus:border-calcularq-blue focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20"
                    placeholder="0"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">%</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              Prêmio por complexidade
              <Tooltip text={technicalPremiumTooltipText} />
            </h4>
            <div className="space-y-2">
              {TECHNICAL_PREMIUM_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={[
                    "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
                    technicalPremium === option.value
                      ? "border-calcularq-blue bg-calcularq-blue/5 text-calcularq-blue"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="technical-premium"
                      value={option.value}
                      checked={technicalPremium === option.value}
                      onChange={() => onTechnicalPremiumChange(option.value)}
                    />
                    <span>
                      {option.label} (+{Math.round(option.value * 100)}%)
                    </span>
                  </span>
                </label>
              ))}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Prêmio personalizado (%)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={customPremiumDraft}
                    onChange={(event) => {
                      const nextDraft = sanitizeNumberDraft(event.target.value);
                      setCustomPremiumDraft(nextDraft);

                      const parsed = parsePtBrNumber(nextDraft);
                      if (parsed === null) return;
                      const normalized = clampPercent(parsed) / 100;
                      const exactOption = TECHNICAL_PREMIUM_OPTIONS.find((option) => Math.abs(option.value - normalized) < 0.001);
                      if (exactOption) {
                        onTechnicalPremiumChange(exactOption.value);
                      }
                    }}
                    onBlur={() => {
                      applyPremiumFromDraft(customPremiumDraft);
                      const nextPercent = clampPercent(technicalPremium * 100);
                      setCustomPremiumDraft(nextPercent.toLocaleString("pt-BR", { maximumFractionDigits: 2 }));
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-8 text-sm focus:border-calcularq-blue focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20"
                    placeholder="15, 25 ou 35"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">%</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              Desconto comercial
              <Tooltip text="Percentual aplicado sobre os honorários antes das despesas variáveis." />
            </label>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px] sm:items-center">
                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={sanitizedCommercialDiscount}
                    onChange={(e) => {
                      const next = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      onCommercialDiscountChange(next);
                      setDiscountDraft(String(next));
                    }}
                    className="h-3 w-full cursor-pointer appearance-none rounded-full bg-slate-200
                      [&::-webkit-slider-thumb]:appearance-none
                      [&::-webkit-slider-thumb]:h-5
                      [&::-webkit-slider-thumb]:w-5
                      [&::-webkit-slider-thumb]:cursor-pointer
                      [&::-webkit-slider-thumb]:rounded-full
                      [&::-webkit-slider-thumb]:bg-calcularq-blue
                      [&::-webkit-slider-thumb]:shadow-md
                      [&::-webkit-slider-thumb]:transition-transform
                      [&::-webkit-slider-thumb]:hover:scale-110
                      [&::-moz-range-thumb]:h-5
                      [&::-moz-range-thumb]:w-5
                      [&::-moz-range-thumb]:cursor-pointer
                      [&::-moz-range-thumb]:rounded-full
                      [&::-moz-range-thumb]:border-0
                      [&::-moz-range-thumb]:bg-calcularq-blue"
                    aria-label="Ajustar desconto comercial"
                  />
                  <div className="flex items-center justify-between px-0.5 text-xs text-slate-500">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="relative w-full sm:w-[110px]">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={discountDraft}
                    onFocus={() => setIsEditingDiscount(true)}
                    onChange={(e) => {
                      const nextDraft = sanitizeNumberDraft(e.target.value);
                      setDiscountDraft(nextDraft);
                      const parsed = parsePtBrNumber(nextDraft);
                      const next = parsed === null ? 0 : Math.max(0, Math.min(100, Math.round(parsed)));
                      onCommercialDiscountChange(next);
                    }}
                    onBlur={() => {
                      const parsed = parsePtBrNumber(discountDraft);
                      const next = parsed === null ? 0 : Math.max(0, Math.min(100, Math.round(parsed)));
                      setDiscountDraft(String(next));
                      onCommercialDiscountChange(next);
                      setIsEditingDiscount(false);
                    }}
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 pr-8 text-right text-base font-bold text-calcularq-blue focus:border-calcularq-blue focus:outline-none focus:ring-4 focus:ring-calcularq-blue/10"
                    aria-label="Desconto comercial em porcentagem"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-base font-bold text-calcularq-blue">%</span>
                </div>
              </div>
            </div>

            {sanitizedCommercialDiscount > 0 ? (
              <div className="mt-3 flex items-start gap-3 rounded-xl border-l-4 border-blue-500 bg-blue-50 px-4 py-3">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div>
                  <p className="mb-0.5 text-sm font-semibold text-blue-900">Impacto do desconto</p>
                  <p className="text-sm text-blue-700">
                    Sua remuneração será reduzida em <span className="font-bold">{formatCurrency(discountAmount)}</span>.
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
        <SectionHeader
          title="Despesas variáveis"
          description="Adicione despesas que devem entrar no valor final do projeto."
          icon={<DollarSign className="h-5 w-5 text-calcularq-blue" />}
        />

        <ExpenseCard
          expenses={variableExpenses}
          onAdd={handleAddExpense}
          onRemove={handleRemoveExpense}
          onUpdate={handleUpdateExpense}
          placeholder="Ex.: RRT, deslocamento..."
          label="Despesas variáveis do projeto (R$)"
          tooltip="Custos específicos deste contrato que serão repassados ao cliente."
        />
      </section>

      {mobileResultsPanel ? <div className="lg:hidden">{mobileResultsPanel}</div> : null}

      <SaveBudgetButton
        budgetId={budgetId}
        initialBudgetName={initialBudgetName}
        initialClientName={initialClientName}
        initialDescription={initialDescription}
        clientName={initialClientName}
        projectName={initialProjectName}
        onSaved={onBudgetSaved}
        budgetData={budgetData}
      />
    </div>
  );
}


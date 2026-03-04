import { useEffect, useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, DollarSign } from "lucide-react";
import SectionHeader from "./SectionHeader";
import SaveBudgetButton from "./SaveBudgetButton";
import type { BudgetData } from "@/types/budget";
import type { Method10Output, CenarioMethod10, TipologiaMethod10 } from "@/components/pricing/PricingEngineMethod10";
import type { Expense } from "./ExpenseCard";
import Tooltip from "@/components/ui/Tooltip";
import { parsePtBrNumber, sanitizeNumberDraft } from "@/lib/numberFormat";

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
  technicalPremium: number;
  tipologia: TipologiaMethod10;
  volumetria: number;
  reforma: boolean;
  cenario: CenarioMethod10;
  onCenarioChange: (value: CenarioMethod10) => void;
  commercialDiscount: number;
  onCommercialDiscountChange: (value: number) => void;
  horasManual: number | null;
  onHorasManualChange: (value: number | null) => void;
  h50: number;
  hCons: number;
  output: Method10Output;
  onBudgetSaved?: () => void;
};

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

export default function Method10Composition({
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
  technicalPremium,
  tipologia,
  volumetria,
  reforma,
  cenario,
  onCenarioChange,
  commercialDiscount,
  onCommercialDiscountChange,
  horasManual,
  onHorasManualChange,
  h50,
  hCons,
  output,
  onBudgetSaved,
}: Props) {
  const [discountDraft, setDiscountDraft] = useState("0");
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);
  const baseHoras = cenario === "conservador" ? hCons : h50;
  const horasUsadas = output.h_final;
  const sanitizedCommercialDiscount = Math.min(100, Math.max(0, Number(commercialDiscount) || 0));
  const discountAmount = output.preco_final * (sanitizedCommercialDiscount / 100);
  const finalSalePrice = output.preco_final - discountAmount;

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
    aTestGroup: technicalPremium <= 0.25 ? "A" : technicalPremium >= 0.45 ? "C" : "B",
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
    variableExpenses: [],
    results: {
      globalComplexity: Number((output.score_complexidade / 100).toFixed(2)),
      adjustedHourlyRate: output.ht_aj,
      projectPrice: output.preco_final,
      finalSalePrice,
    },
    methodVersion: output.method_version,
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 lg:p-8 shadow-sm">
      <SectionHeader
        title="Composição final"
        description="Escolha o cenário, ajuste horas se necessário e salve o projeto."
        icon={<DollarSign className="w-5 h-5 text-calcularq-blue" />}
      />

      <div className="space-y-6">
        <section className="space-y-3">
          <h3 className="flex items-center gap-1.5 text-base font-semibold text-calcularq-blue">
            Horas estimadas
            <Tooltip text="Estimativa fundamentada em referências de mercado e simulações, com calibragem automática contínua." />
          </h3>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-700">
              <input
                type="radio"
                name="cenario"
                className="mr-2"
                checked={cenario === "conservador"}
                onChange={() => onCenarioChange("conservador")}
              />
              <strong>Conservador</strong> (recomendado)
            </label>
            <label className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-700">
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
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Este cenário não inclui margem de segurança para imprevistos.
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:border-calcularq-blue focus:ring-2 focus:ring-calcularq-blue/20"
              placeholder="Ex.: 220"
            />
          </div>

          {showSubpricingAlert ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <p>
                  Risco de subprecificação: sua estimativa está {Math.abs(Math.round(percentualDiff))}% abaixo da sugestão.
                </p>
              </div>
            </div>
          ) : null}

          {showOverpricingAlert ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5" />
                <p>
                  Atenção: sua estimativa está {Math.round(percentualDiff)}% acima da sugestão e pode afastar o preço de mercado.
                </p>
              </div>
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white px-4 py-4">
          <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
            Desconto comercial: {sanitizedCommercialDiscount}%
            <Tooltip text="Porcentagem de desconto aplicada sobre os honorários. O painel de resultados mostra o impacto no valor final." />
          </label>
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-xs text-slate-500 sm:text-sm">Arraste para ajustar ou digite o percentual.</p>
            </div>

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
                    [&::-webkit-slider-thumb]:w-5
                    [&::-webkit-slider-thumb]:h-5
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-calcularq-blue
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:shadow-md
                    [&::-webkit-slider-thumb]:transition-transform
                    [&::-webkit-slider-thumb]:hover:scale-110
                    [&::-moz-range-thumb]:w-5
                    [&::-moz-range-thumb]:h-5
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-calcularq-blue
                    [&::-moz-range-thumb]:border-0
                    [&::-moz-range-thumb]:cursor-pointer"
                  aria-label="Ajustar desconto comercial pelo slider"
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
                  className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 pr-8 text-right text-base font-bold text-calcularq-blue transition-all focus:border-calcularq-blue focus:outline-none focus:ring-4 focus:ring-calcularq-blue/10"
                  aria-label="Desconto comercial em porcentagem"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-base font-bold text-calcularq-blue">%</span>
              </div>
            </div>
          </div>

          {sanitizedCommercialDiscount > 0 ? (
            <div className="mt-4 flex items-start gap-3 rounded-xl border-l-4 border-blue-500 bg-blue-50 px-4 py-3">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
              <div>
                <p className="mb-0.5 text-sm font-semibold text-blue-900">Impacto do desconto</p>
                <p className="text-sm text-blue-700">
                  Sua remuneração será reduzida em{" "}
                  <span className="font-bold">
                    {formatCurrency(discountAmount)}
                  </span>
                  .
                </p>
              </div>
            </div>
          ) : null}
        </section>

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
    </div>
  );
}

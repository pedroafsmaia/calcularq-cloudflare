import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, DollarSign } from "lucide-react";
import SectionHeader from "./SectionHeader";
import SaveBudgetButton from "./SaveBudgetButton";
import type { BudgetData } from "@/types/budget";
import type { Method10Output, CenarioMethod10, TipologiaMethod10 } from "@/components/pricing/PricingEngineMethod10";
import type { Expense } from "./ExpenseCard";

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
  horasManual,
  onHorasManualChange,
  h50,
  hCons,
  output,
  onBudgetSaved,
}: Props) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const baseHoras = cenario === "conservador" ? hCons : h50;
  const horasUsadas = output.h_final;

  const percentualDiff = useMemo(() => {
    if (baseHoras <= 0) return 0;
    return ((horasUsadas - baseHoras) / baseHoras) * 100;
  }, [baseHoras, horasUsadas]);

  const showSubpricingAlert = percentualDiff <= -20;
  const showOverpricingAlert = percentualDiff >= 20;

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
    commercialDiscount: 0,
    variableExpenses: [],
    results: {
      globalComplexity: Number((output.score_complexidade / 100).toFixed(2)),
      adjustedHourlyRate: output.ht_aj,
      projectPrice: output.preco_final,
      finalSalePrice: output.preco_final,
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
          <h3 className="text-base font-semibold text-calcularq-blue">Horas estimadas</h3>

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

        <section className="rounded-xl border border-calcularq-blue/15 bg-calcularq-blue/5 px-4 py-4 text-center">
          <p className="text-xs font-semibold text-calcularq-blue">PREÇO FINAL</p>
          <p className="mt-1 text-3xl font-bold text-calcularq-blue">{formatCurrency(output.preco_final)}</p>
          <p className="mt-1 text-sm text-slate-600">
            ({formatHours(output.h_final)}h x {formatCurrency(output.ht_aj)}/h)
          </p>
        </section>

        <section className="space-y-3">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails((prev) => !prev)}
            className="inline-flex items-center gap-2 text-sm font-medium text-calcularq-blue hover:text-calcularq-blue/80"
          >
            {showTechnicalDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Ver detalhes técnicos
          </button>

          {showTechnicalDetails ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-4 space-y-3 text-sm text-slate-700">
              <p>
                <strong>Complexidade:</strong> {output.score_complexidade}/100 ({output.classificacao_complexidade})
              </p>
              <p>
                <strong>Horas base (H50):</strong> {formatHours(output.h50)}h
              </p>
              <p>
                <strong>Horas conservadoras:</strong> {formatHours(output.h_cons)}h (+{Math.round(output.u_total * 100)}%)
              </p>
              <p>
                <strong>Hora técnica mínima:</strong> {formatCurrency(minHourlyRate)}/h
              </p>
              <p>
                <strong>Taxa ajustada:</strong> {formatCurrency(output.ht_aj)}/h
              </p>
              <p>
                <strong>Prêmio técnico máximo:</strong> +{Math.round(technicalPremium * 100)}%
              </p>
              <p className="text-xs text-slate-500">
                Versão: {output.method_version} | Cenário: {cenario}
              </p>
            </div>
          ) : null}
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-4 text-sm">
          <h4 className="font-semibold text-calcularq-blue mb-2">Indicadores de mercado</h4>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-600">Preço por m²</span>
            <strong className="text-slate-800">{formatCurrency(output.preco_m2)}/m²</strong>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-slate-600">Valor da hora</span>
            <strong className="text-slate-800">{formatCurrency(output.ht_aj)}/h</strong>
          </div>
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

import Tooltip from "@/components/ui/Tooltip";
import { describePricePerSqm } from "@/lib/pricePerSqmBands";

type CalculatorDisplayValues = {
  totalVariableExpenses: number;
  adjustedHourlyRate: number;
  projectPrice: number;
  projectPriceWithDiscount: number;
  discountAmount: number;
  finalSalePrice: number;
  profit: number | null;
};

type Props = {
  minHourlyRate: number | null;
  hasComplexitySelections: boolean;
  complexityScore: number;
  currentStep: number;
  currentStepLabel: string;
  selectedFactorsCount: number;
  totalFactors: number;
  estimatedHours: number;
  commercialDiscount: number;
  pricePerSqm: number | null;
  displayValues: CalculatorDisplayValues;
};

export default function CalculatorResultsPanel({
  minHourlyRate,
  hasComplexitySelections,
  complexityScore,
  currentStep,
  currentStepLabel,
  selectedFactorsCount,
  totalFactors,
  estimatedHours,
  commercialDiscount,
  pricePerSqm,
  displayValues,
}: Props) {
  const pricePerSqmDescription = pricePerSqm !== null ? describePricePerSqm(pricePerSqm) : null;
  const isExtremePricePerSqm = pricePerSqmDescription?.kind === "extreme";

  const adjustedHourlyRateMessage = (() => {
    const rate = displayValues.adjustedHourlyRate;
    if (!Number.isFinite(rate) || rate <= 0) return null;
    if (rate < 45) return "Abaixo da faixa júnior (R$ 45-85/h)";
    if (rate >= 45 && rate < 75) return "Dentro da faixa júnior (R$ 45-85/h)";
    if (rate >= 75 && rate < 85) return "Faixa júnior-pleno (R$ 75-100/h)";
    if (rate >= 85 && rate < 120) return "Dentro da faixa pleno (R$ 85-130/h)";
    if (rate >= 120 && rate < 130) return "Faixa pleno-sênior (R$ 120-150/h)";
    if (rate >= 130 && rate <= 200) return "Dentro da faixa sênior (R$ 130-200/h)";
    return "Acima da faixa sênior (R$ 130-200/h)";
  })();

  return (
    <>
      {!minHourlyRate || minHourlyRate <= 0 ? (
        <div className="bg-transparent p-5 space-y-3">
          <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <span className="text-lg font-bold text-slate-400">1</span>
            </div>
            <p className="mb-1 text-sm font-medium text-slate-600">Comece pela Etapa 1</p>
            <p className="text-xs text-slate-400">Complete {currentStepLabel.toLowerCase()} para liberar a base do cálculo.</p>
          </div>
        </div>
      ) : (
        <div className="bg-transparent p-4 space-y-4 sm:p-5">
          <div className="rounded-xl border border-calcularq-blue/15 bg-calcularq-blue/10 p-4 sm:p-5">
            <p className="mb-3 text-center text-sm font-semibold text-calcularq-blue">Base do Cálculo</p>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 leading-snug">Hora técnica</span>
                <span className="whitespace-nowrap font-medium text-slate-800">
                  R$ {minHourlyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h
                </span>
              </div>

              {hasComplexitySelections ? (
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 leading-snug">Score de Complexidade</span>
                  <span className="whitespace-nowrap font-medium text-slate-800">{complexityScore}/100</span>
                </div>
              ) : null}

              {displayValues.adjustedHourlyRate > 0 ? (
                <>
                  <div className="mt-1 flex items-start justify-between gap-3 border-t border-slate-200 pt-2">
                    <span className="min-w-0 font-bold leading-snug text-calcularq-blue">Hora Ajustada</span>
                    <span className="whitespace-nowrap font-bold text-calcularq-blue">
                      R$ {displayValues.adjustedHourlyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h
                    </span>
                  </div>

                  {adjustedHourlyRateMessage ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                      <p className="inline-flex items-center gap-1.5">
                        <Tooltip text={adjustedHourlyRateMessage} />
                        {adjustedHourlyRateMessage}
                      </p>
                      <p className="mt-1 text-slate-500">Faixa estimada com base em CAGED 2025, Censo CAU 2020 e SINAPI.</p>
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>

          {currentStep === 2 ? (
            <div className="flex items-center justify-between px-1 text-xs text-slate-500">
              <span>Fatores classificados</span>
              <span className={`font-semibold ${selectedFactorsCount === totalFactors ? "text-green-600" : "text-calcularq-blue"}`}>
                {selectedFactorsCount} / {totalFactors}
              </span>
            </div>
          ) : null}

          {displayValues.projectPrice > 0 ? (
            <div className="space-y-2 px-1 py-1 text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="flex-1 leading-snug text-slate-600">
                  Preço do Projeto
                  {estimatedHours > 0 && displayValues.adjustedHourlyRate > 0 ? (
                    <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-400">
                      {estimatedHours}h × R$ {displayValues.adjustedHourlyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <Tooltip text="Estimativa fundamentada em referências de mercado e simulações, com calibragem automática contínua." />
                    </span>
                  ) : null}
                </span>
                <span className="whitespace-nowrap font-semibold text-slate-800">
                  R$ {displayValues.projectPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {displayValues.totalVariableExpenses > 0 ? (
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 leading-snug text-slate-600">(+) Despesas Variáveis</span>
                  <span className="whitespace-nowrap font-semibold text-slate-800">
                    R$ {displayValues.totalVariableExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ) : null}

              {displayValues.discountAmount > 0 ? (
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 leading-snug text-slate-600">(-) Desconto ({commercialDiscount}%)</span>
                  <span className="whitespace-nowrap font-semibold text-red-500">
                    - R$ {displayValues.discountAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          {displayValues.finalSalePrice > 0 ? (
            <div className="rounded-xl border border-calcularq-blue/15 bg-calcularq-blue/10 p-4 text-center shadow-sm">
              <p className="mb-1 text-xs font-semibold text-calcularq-blue">Preço de Venda Final</p>
              <p className="text-2xl font-bold text-calcularq-blue">
                R$ {displayValues.finalSalePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center">
              <p className="text-xs text-slate-400">O preço de venda aparecerá aqui</p>
            </div>
          )}

          {displayValues.finalSalePrice > 0 ? (
            <>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-1 pt-1">
                <span className="min-w-0 flex items-center gap-1 text-sm text-slate-500">
                  Preço/m²
                  <Tooltip text="Indicador comparativo. O aviso mostra a faixa interna (ou transição) em que o valor se encaixa." />
                </span>
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  <span
                    className={`text-sm font-bold ${
                      pricePerSqm !== null ? (isExtremePricePerSqm ? "text-amber-700" : "text-slate-700") : "text-calcularq-blue"
                    }`}
                  >
                    {pricePerSqm !== null
                      ? `R$ ${pricePerSqm.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </span>
                  {pricePerSqmDescription ? (
                    <Tooltip
                      title={isExtremePricePerSqm ? "Atenção" : "Referência interna"}
                      tone={isExtremePricePerSqm ? "warning" : "info"}
                      iconClassName={isExtremePricePerSqm ? "text-amber-700 hover:text-amber-800" : undefined}
                      text={[pricePerSqmDescription.line1, pricePerSqmDescription.line2].filter(Boolean).join("\n")}
                    />
                  ) : null}
                </span>
              </div>

              {displayValues.profit !== null ? (
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-1 pt-1">
                  <span className="min-w-0 inline-flex items-center gap-1 text-sm text-slate-500">
                    Lucro Estimado
                    <Tooltip text="Estimativa de margem bruta do projeto: diferença entre Hora Ajustada e Hora Técnica, multiplicada pelas horas estimadas." />
                  </span>
                  <span className={`whitespace-nowrap text-sm font-bold ${displayValues.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                    R$ {displayValues.profit.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      )}
    </>
  );
}

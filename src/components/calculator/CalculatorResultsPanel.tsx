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
  globalComplexity: number;
  currentStep: number;
  currentStepLabel: string;
  selectedFactorsCount: number;
  totalFactors: number;
  estimatedHours: number;
  commercialDiscount: number;
  cubPercentage: number | null;
  pricePerSqm: number | null;
  displayValues: CalculatorDisplayValues;
};

export default function CalculatorResultsPanel({
  minHourlyRate,
  hasComplexitySelections,
  globalComplexity,
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
  const isTransitionPricePerSqm = pricePerSqmDescription?.kind === "transition";

  return (
    <>
      {!minHourlyRate || minHourlyRate <= 0 ? (
        <div className="bg-transparent p-5 space-y-3">
          <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
              <span className="text-lg font-bold text-slate-400">1</span>
            </div>
            <p className="mb-1 text-sm font-medium text-slate-600">Comece pela Etapa 1</p>
            <p className="text-xs text-slate-400">
              Complete {currentStepLabel.toLowerCase()} para liberar a base do cálculo.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-transparent p-4 space-y-4 sm:p-5">
          <div className="rounded-xl border border-calcularq-blue/15 bg-calcularq-blue/10 p-4 sm:p-5">
            <p className="mb-3 text-center text-sm font-semibold text-calcularq-blue">Base do Cálculo</p>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 leading-snug">Hora Técnica Mínima</span>
                <span className="whitespace-nowrap font-medium text-slate-800">
                  R$ {minHourlyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h
                </span>
              </div>
              {hasComplexitySelections && (
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 leading-snug">Complexidade Global</span>
                  <span className="whitespace-nowrap font-medium text-slate-800">{globalComplexity.toFixed(2)}x</span>
                </div>
              )}
              {displayValues.adjustedHourlyRate > 0 && (
                <div className="mt-1 flex items-start justify-between gap-3 border-t border-slate-200 pt-2">
                  <span className="min-w-0 font-bold leading-snug text-calcularq-blue">Hora Ajustada</span>
                  <span className="whitespace-nowrap font-bold text-calcularq-blue">
                    R$ {displayValues.adjustedHourlyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h
                  </span>
                </div>
              )}
            </div>
          </div>

          {currentStep === 2 && (
            <div className="flex items-center justify-between px-1 text-xs text-slate-500">
              <span>Fatores classificados</span>
              <span className={`font-semibold ${selectedFactorsCount === totalFactors ? "text-green-600" : "text-calcularq-blue"}`}>
                {selectedFactorsCount} / {totalFactors}
              </span>
            </div>
          )}

          {displayValues.projectPrice > 0 && (
            <div className="space-y-2 px-1 py-1 text-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="flex-1 leading-snug text-slate-600">
                  Preço do Projeto
                  {estimatedHours > 0 && displayValues.adjustedHourlyRate > 0 && (
                    <span className="block text-xs text-slate-400">
                      {estimatedHours}h × R$ {displayValues.adjustedHourlyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </span>
                <span className="whitespace-nowrap font-semibold text-slate-800">
                  R$ {displayValues.projectPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {displayValues.totalVariableExpenses > 0 && (
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 leading-snug text-slate-600">(+) Despesas Variáveis</span>
                  <span className="whitespace-nowrap font-semibold text-slate-800">
                    R$ {displayValues.totalVariableExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {displayValues.discountAmount > 0 && (
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 leading-snug text-slate-600">(-) Desconto ({commercialDiscount}%)</span>
                  <span className="whitespace-nowrap font-semibold text-red-500">
                    - R$ {displayValues.discountAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>
          )}

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

          {displayValues.finalSalePrice > 0 && (
            <>
              <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-1 pt-1">
                <span className="min-w-0 flex items-center gap-1 text-sm text-slate-500">
                  Preço/m²
                  <Tooltip text="Indicador comparativo. O aviso mostra a faixa interna (ou transição) em que o valor se encaixa." />
                </span>
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  <span
                    className={`text-sm font-bold ${
                      pricePerSqm !== null
                        ? isExtremePricePerSqm
                          ? "text-amber-700"
                          : isTransitionPricePerSqm
                            ? "text-blue-700"
                            : "text-slate-700"
                        : "text-calcularq-blue"
                    }`}
                  >
                    {pricePerSqm !== null
                      ? `R$ ${pricePerSqm.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </span>
                  {pricePerSqmDescription && (
                    <Tooltip
                      title={isExtremePricePerSqm ? "Atenção" : "Referência interna"}
                      tone={isExtremePricePerSqm ? "warning" : "info"}
                      iconClassName={
                        isExtremePricePerSqm
                          ? "text-amber-700 hover:text-amber-800"
                          : isTransitionPricePerSqm
                            ? "text-blue-700 hover:text-blue-800"
                            : "text-slate-600 hover:text-slate-700"
                      }
                      text={[pricePerSqmDescription.line1, pricePerSqmDescription.line2, "Faixas internas de referência."].filter(Boolean).join("\n")}
                    />
                  )}
                </span>
              </div>

              {pricePerSqmDescription && (
                <div
                  className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${
                    isExtremePricePerSqm
                      ? "border-amber-200 bg-amber-50 text-amber-800"
                      : isTransitionPricePerSqm
                        ? "border-blue-200 bg-blue-50 text-blue-800"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  <p className="font-medium">{pricePerSqmDescription.line1}</p>
                  {pricePerSqmDescription.line2 ? <p className="mt-0.5">{pricePerSqmDescription.line2}</p> : null}
                </div>
              )}

              {displayValues.profit !== null && (
                <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-1 pt-1">
                  <span className="min-w-0 inline-flex items-center gap-1 text-sm text-slate-500">
                    Lucro Estimado
                    <Tooltip text="Estimativa de margem bruta do projeto: diferença entre Hora Ajustada e Hora Técnica Mínima, multiplicada pelas horas estimadas." />
                  </span>
                  <span className={`whitespace-nowrap text-sm font-bold ${displayValues.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
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
}


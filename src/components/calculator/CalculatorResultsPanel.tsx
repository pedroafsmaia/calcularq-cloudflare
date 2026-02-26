import Tooltip from "@/components/ui/Tooltip";

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
  selectedFactorsCount,
  totalFactors,
  estimatedHours,
  commercialDiscount,
  cubPercentage,
  pricePerSqm,
  displayValues,
}: Props) {
  return (
    <>
      {(!minHourlyRate || minHourlyRate <= 0) ? (
        <div className="bg-white p-5 space-y-3">
          <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <span className="text-slate-400 text-lg font-bold">1</span>
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">Comece pela Etapa 1</p>
            <p className="text-xs text-slate-400">Preencha sua hora técnica mínima para ver os resultados aqui.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white p-4 sm:p-5 space-y-4">
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

          {currentStep === 2 && (
            <div className="flex items-center justify-between px-1 text-xs text-slate-500">
              <span>Fatores classificados</span>
              <span className={`font-semibold ${selectedFactorsCount === totalFactors ? "text-green-600" : "text-calcularq-blue"}`}>
                {selectedFactorsCount} / {totalFactors}
              </span>
            </div>
          )}

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
              <div className="flex justify-between items-center gap-3 px-1 pt-1 border-t border-slate-100">
                <span className="min-w-0 flex items-center gap-1 text-sm text-slate-500">
                  % do valor da obra
                  <Tooltip text="Estimativa baseada no CUB médio nacional (R$ 2.800/m²). A faixa de referência do CAU/BR para % do valor da obra varia conforme a complexidade, a etapa do projeto, o tipo de projeto, a sofisticação e a região." />
                </span>
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  <span className={`text-sm font-bold ${
                    cubPercentage !== null
                      ? cubPercentage < 2
                        ? "text-amber-600"
                        : cubPercentage > 11
                          ? "text-amber-600"
                          : "text-slate-700"
                      : "text-calcularq-blue"
                  }`}>
                    {cubPercentage !== null ? `${cubPercentage.toFixed(1)}%` : "—"}
                  </span>
                  {cubPercentage !== null && (cubPercentage < 2 || cubPercentage > 11) && (
                    <Tooltip
                      title="Atenção"
                      tone="warning"
                      iconClassName="text-amber-600 hover:text-amber-700"
                      text={
                        cubPercentage < 2
                          ? "% abaixo da faixa sugerida pelo CAU (2% a 11%). Isso pode indicar necessidade de revisão de horas/escopo, mas também pode refletir custos operacionais mais baixos, maior eficiência ou um projeto em etapa/nível de sofisticação diferente da referência."
                          : "% acima da faixa sugerida pelo CAU (2% a 11%). Isso pode ser adequado em projetos com maior complexidade, maior sofisticação ou etapas de desenvolvimento mais avançadas."
                      }
                    />
                  )}
                </span>
              </div>

              <div className="flex justify-between items-center gap-3 px-1 pt-1 border-t border-slate-100">
                <span className="min-w-0 flex items-center gap-1 text-sm text-slate-500">
                  Preço/m²
                  <Tooltip text="Honorário dividido pela área do projeto. A faixa de referência do IAB/CAU para valor por m² varia conforme a complexidade, a etapa do projeto, a sofisticação, a área e a região." />
                </span>
                <span className="inline-flex items-center gap-1 whitespace-nowrap">
                  <span className={`text-sm font-bold ${
                    pricePerSqm !== null
                      ? pricePerSqm < 60 || pricePerSqm > 200
                        ? "text-amber-600"
                        : "text-slate-700"
                      : "text-calcularq-blue"
                  }`}>
                    {pricePerSqm !== null
                      ? `R$ ${pricePerSqm.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : "—"}
                  </span>
                  {pricePerSqm !== null && (pricePerSqm < 60 || pricePerSqm > 200) && (
                    <Tooltip
                      title="Atenção"
                      tone="warning"
                      iconClassName="text-amber-600 hover:text-amber-700"
                      text={
                        pricePerSqm < 60
                          ? "Valor/m² abaixo da faixa de referência IAB/CAU (R$ 60 a R$ 200/m²). Pode ocorrer em projetos de grande porte, menor sofisticação ou etapas mais simples, mas também pode indicar subvalorização do serviço."
                          : "Valor/m² acima da faixa de referência IAB/CAU (R$ 60 a R$ 200/m²). Pode ser adequado em áreas menores, maior complexidade, maior sofisticação ou etapas mais avançadas."
                      }
                    />
                  )}
                </span>
              </div>

              {displayValues.profit !== null && (
                <div className="flex justify-between items-center gap-3 px-1 pt-1 border-t border-slate-100">
                  <span className="min-w-0 inline-flex items-center gap-1 text-sm text-slate-500">
                    Lucro Estimado
                    <Tooltip text="Estimativa de margem bruta do projeto: diferença entre Hora Ajustada e Hora Técnica Mínima, multiplicada pelas horas estimadas." />
                  </span>
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
}

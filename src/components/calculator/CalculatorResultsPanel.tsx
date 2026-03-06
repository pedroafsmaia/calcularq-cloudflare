import Tooltip from "@/components/ui/Tooltip";
import { describeHourlyRate } from "@/lib/hourlyRateBands";
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
  selectedFactorsCount: number;
  totalFactors: number;
  estimatedHours: number;
  commercialDiscount: number;
  pricePerSqm: number | null;
  displayValues: CalculatorDisplayValues;
  useManualMinHourlyRate: boolean;
  fixedExpensesTotal: number;
  personalExpensesTotal: number;
  productiveHours: number;
};

function Row({ label, value, valueClassName = "text-slate-800", labelClassName = "text-slate-600", noWrapValue = true }: {
  label: string;
  value: string;
  valueClassName?: string;
  labelClassName?: string;
  noWrapValue?: boolean;
}) {
  const isPendingValue = valueClassName.includes("text-slate-400");
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 text-sm">
      <span className={`min-w-0 leading-snug ${labelClassName}`}>{label}</span>
      <span
        className={`${noWrapValue ? "whitespace-nowrap" : ""} self-start pt-0.5 text-right ${isPendingValue ? "font-normal" : "font-semibold"} ${valueClassName}`}
      >
        {value}
      </span>
    </div>
  );
}

export default function CalculatorResultsPanel({
  minHourlyRate,
  hasComplexitySelections,
  complexityScore,
  currentStep,
  selectedFactorsCount,
  totalFactors,
  estimatedHours,
  commercialDiscount,
  pricePerSqm,
  displayValues,
  useManualMinHourlyRate,
  fixedExpensesTotal,
  personalExpensesTotal,
  productiveHours,
}: Props) {
  const hasMinHourlyRate = Number.isFinite(minHourlyRate) && Number(minHourlyRate) > 0;
  const hasFinalPrice = Number.isFinite(displayValues.finalSalePrice) && displayValues.finalSalePrice > 0;
  const factorsProgress = totalFactors > 0 ? Math.min(100, Math.max(0, (selectedFactorsCount / totalFactors) * 100)) : 0;

  const pricePerSqmDescription = pricePerSqm !== null ? describePricePerSqm(pricePerSqm) : null;
  const isExtremePricePerSqm = pricePerSqmDescription?.kind === "extreme";
  const adjustedHourlyRateDescription =
    Number.isFinite(displayValues.adjustedHourlyRate) && displayValues.adjustedHourlyRate > 0
      ? describeHourlyRate(displayValues.adjustedHourlyRate)
      : null;
  const isExtremeAdjustedHourlyRate = adjustedHourlyRateDescription?.kind === "extreme";
  const showAdjustedAsPrimary = currentStep >= 3 && displayValues.adjustedHourlyRate > 0;

  return (
    <div className="space-y-4 bg-transparent p-4 sm:p-5">
      <div className="rounded-xl border border-calcularq-blue/15 bg-calcularq-blue/10 p-4 sm:p-5">
        <p className="mb-3 text-center text-sm font-semibold text-calcularq-blue">Base do cálculo</p>
        <div className="space-y-2.5">
          <Row
            label={showAdjustedAsPrimary ? "Hora técnica ajustada" : "Hora técnica mínima"}
            value={
              showAdjustedAsPrimary
                ? `R$ ${displayValues.adjustedHourlyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h`
                : hasMinHourlyRate
                  ? `R$ ${Number(minHourlyRate).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h`
                  : "Pendente"
            }
            valueClassName={
              showAdjustedAsPrimary
                ? isExtremeAdjustedHourlyRate
                  ? "text-amber-700"
                  : "text-slate-800"
                : hasMinHourlyRate
                  ? "text-slate-800"
                  : "text-slate-400"
            }
            labelClassName={showAdjustedAsPrimary ? "text-slate-700" : "text-slate-600"}
          />

          <Row
            label="Score de complexidade"
            value={selectedFactorsCount > 0 ? `${complexityScore}/100` : "Pendente"}
            valueClassName={selectedFactorsCount > 0 ? "text-slate-800" : "text-slate-400"}
          />

          {!showAdjustedAsPrimary && displayValues.adjustedHourlyRate > 0 ? (
            <div className="grid grid-cols-[1fr_auto] items-start gap-3 border-t border-slate-200 pt-2.5 text-sm">
              <span className="min-w-0 font-semibold leading-snug text-slate-700">Hora técnica ajustada</span>
              <span
                className={`inline-flex items-center gap-1 whitespace-nowrap font-bold ${
                  isExtremeAdjustedHourlyRate ? "text-amber-700" : "text-slate-700"
                }`}
              >
                R$ {displayValues.adjustedHourlyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/h
                {adjustedHourlyRateDescription ? (
                  <Tooltip
                    title={isExtremeAdjustedHourlyRate ? "Atenção" : "Referência interna"}
                    tone={isExtremeAdjustedHourlyRate ? "warning" : "info"}
                    iconClassName={isExtremeAdjustedHourlyRate ? "text-amber-700 hover:text-amber-800" : undefined}
                    text={[
                      adjustedHourlyRateDescription.line1,
                      adjustedHourlyRateDescription.line2,
                      "Faixa estimada com base em CAGED 2025, Censo CAU 2020 e SINAPI.",
                    ]
                      .filter(Boolean)
                      .join("\n")}
                  />
                ) : null}
              </span>
            </div>
          ) : currentStep >= 3 ? (
            <p className="border-t border-slate-200 pt-2.5 text-sm text-slate-400">A hora técnica ajustada será exibida após os ajustes de preço.</p>
          ) : null}
        </div>
      </div>

      {currentStep === 1 ? (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-700">Progresso da etapa 1</p>
          {useManualMinHourlyRate ? (
            <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
              Modo manual ativo: despesas e horas produtivas ficam dispensadas.
            </p>
          ) : null}

          <Row
            label="Despesas operacionais"
            value={fixedExpensesTotal > 0 ? "Preenchido" : "Pendente"}
            valueClassName={fixedExpensesTotal > 0 ? "text-emerald-700" : "text-slate-400"}
          />
          <Row
            label="Despesas pessoais"
            value={personalExpensesTotal > 0 ? "Preenchido" : "Pendente"}
            valueClassName={personalExpensesTotal > 0 ? "text-emerald-700" : "text-slate-400"}
          />
          <Row
            label="Horas produtivas"
            value={productiveHours > 0 ? "Preenchido" : "Pendente"}
            valueClassName={productiveHours > 0 ? "text-emerald-700" : "text-slate-400"}
          />

          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Próximo passo: classificar os fatores de complexidade.
          </p>
        </div>
      ) : null}

      {currentStep === 2 ? (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-700">Progresso da etapa 2</p>
          <Row label="Fatores classificados" value={`${selectedFactorsCount} / ${totalFactors}`} valueClassName="text-calcularq-blue" />
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-calcularq-blue transition-all duration-200" style={{ width: `${factorsProgress}%` }} />
          </div>
          <Row
            label="Score parcial"
            value={selectedFactorsCount > 0 ? `${complexityScore}/100` : "Aguardando"}
            valueClassName={selectedFactorsCount > 0 ? "text-slate-800" : "text-slate-400"}
          />
          <Row
            label="Horas estimadas"
            value={hasComplexitySelections && estimatedHours > 0 ? `${estimatedHours}h` : "Pendente"}
            valueClassName={hasComplexitySelections && estimatedHours > 0 ? "text-slate-800" : "text-slate-400"}
          />
          {!hasComplexitySelections || estimatedHours <= 0 ? (
            <p className="text-xs text-slate-400">Aguardando conclusão da etapa para estimar as horas.</p>
          ) : null}
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
            Próximo passo: finalize os ajustes de preço na Etapa 3.
          </p>
        </div>
      ) : null}

      {currentStep === 3 ? (
        <>
          {displayValues.projectPrice > 0 ? (
            <div className="space-y-2.5 px-1 py-1 text-sm">
              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <span className="min-w-0 leading-snug text-slate-600">
                  Preço do Projeto
                  {estimatedHours > 0 && displayValues.adjustedHourlyRate > 0 ? (
                    <span className="mt-0.5 block text-xs leading-snug text-slate-400">
                      {estimatedHours}h × R$ {displayValues.adjustedHourlyRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      <span className="ml-1 inline-flex align-middle">
                        <Tooltip text="Estimativa fundamentada em referências de mercado e simulações, com calibragem automática contínua." />
                      </span>
                    </span>
                  ) : null}
                </span>
                <span className="whitespace-nowrap font-semibold text-slate-800">
                  R$ {displayValues.projectPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {displayValues.totalVariableExpenses > 0 ? (
                <div className="grid grid-cols-[1fr_auto] items-baseline gap-2">
                  <span className="min-w-0 leading-snug text-slate-600">(+) Despesas Variáveis</span>
                  <span className="whitespace-nowrap font-semibold text-slate-800">
                    R$ {displayValues.totalVariableExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ) : null}

              {displayValues.discountAmount > 0 ? (
                <div className="grid grid-cols-[1fr_auto] items-baseline gap-2">
                  <span className="min-w-0 leading-snug text-slate-600">(-) Desconto ({commercialDiscount}%)</span>
                  <span className="whitespace-nowrap font-semibold text-red-500">
                    - R$ {displayValues.discountAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}

          {hasFinalPrice ? (
            <div className="rounded-xl border border-calcularq-blue/15 bg-calcularq-blue/10 p-4 text-center shadow-sm">
              <p className="mb-1 text-xs font-semibold text-calcularq-blue">Preço de Venda Final</p>
              <p className="text-2xl font-bold text-calcularq-blue">
                R$ {displayValues.finalSalePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-200 p-4 text-center">
              <p className="text-xs text-slate-400">Conclua os ajustes de preço para liberar o valor final.</p>
            </div>
          )}

          {hasFinalPrice ? (
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
        </>
      ) : null}
    </div>
  );
}

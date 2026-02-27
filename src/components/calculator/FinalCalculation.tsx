import { AlertCircle, CheckCircle2, DollarSign } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import ExpenseCard, { Expense } from "./ExpenseCard";
import SaveBudgetButton from "./SaveBudgetButton";
import Tooltip from "@/components/ui/Tooltip";
import SectionHeader from "./SectionHeader";
import { formatHoursPtBr, parsePtBrNumber, sanitizeNumberDraft } from "@/lib/numberFormat";

interface FinalCalculationProps {
  budgetId?: string;
  initialBudgetName?: string;
  initialClientName?: string;
  initialProjectName?: string;
  initialDescription?: string;
  proLabore?: number;
  minHourlyRate: number;
  globalComplexity: number;
  adjustedHourlyRate: number;
  estimatedHours: number;
  onEstimatedHoursChange: (hours: number) => void;
  commercialDiscount: number;
  onCommercialDiscountChange: (discount: number) => void;
  variableExpenses: Expense[];
  onVariableExpensesChange: (expenses: Expense[]) => void;
  projectPrice: number;
  finalSalePrice: number;
  factorLevels: Record<string, number>;
  area?: number | null;
  factors: Array<{ id: string; name: string; weight: number }>;
  areaIntervals: Array<{ min: number; max: number | null; level: number }>;
  fixedExpenses?: Expense[];
  personalExpenses?: Expense[];
  productiveHours?: number;
  useManualMinHourlyRate?: boolean;
  mobileResultsContent?: ReactNode;
  onBudgetSaved?: () => void;
}

export default function FinalCalculation({
  budgetId,
  initialBudgetName,
  initialClientName,
  initialProjectName,
  initialDescription,
  proLabore = 0,
  minHourlyRate,
  globalComplexity,
  adjustedHourlyRate,
  estimatedHours,
  onEstimatedHoursChange,
  commercialDiscount,
  onCommercialDiscountChange,
  variableExpenses,
  onVariableExpensesChange,
  projectPrice,
  finalSalePrice,
  factorLevels,
  area = null,
  factors,
  areaIntervals,
  fixedExpenses = [],
  personalExpenses = [],
  productiveHours = 0,
  useManualMinHourlyRate = false,
  mobileResultsContent,
  onBudgetSaved,
}: FinalCalculationProps) {
  const [estimatedHoursDraft, setEstimatedHoursDraft] = useState("");
  const [discountDraft, setDiscountDraft] = useState("0");
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);

  const handleAddExpense = (expense: Expense) => {
    onVariableExpensesChange([...variableExpenses, expense]);
  };

  const handleRemoveExpense = (id: string) => {
    onVariableExpensesChange(variableExpenses.filter((exp) => exp.id !== id));
  };

  const handleUpdateExpense = (id: string, updates: Partial<Expense>) => {
    onVariableExpensesChange(
      variableExpenses.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp))
    );
  };

  useEffect(() => {
    if (variableExpenses.length === 0) {
      handleAddExpense({ id: Date.now().toString(), name: "", value: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const discountAmount = projectPrice * (commercialDiscount / 100);

  useEffect(() => {
    setEstimatedHoursDraft(estimatedHours > 0 ? formatHoursPtBr(estimatedHours) : "");
  }, [estimatedHours]);

  useEffect(() => {
    if (isEditingDiscount) return;
    setDiscountDraft(String(commercialDiscount));
  }, [commercialDiscount, isEditingDiscount]);

  const saveActions = (
    <div className="space-y-4">
      <SaveBudgetButton
        budgetId={budgetId}
        initialBudgetName={initialBudgetName}
        initialClientName={initialClientName}
        initialDescription={initialDescription}
        clientName={initialClientName}
        projectName={initialProjectName}
        onSaved={() => onBudgetSaved?.()}
        budgetData={{
          minHourlyRate,
          useManualMinHourlyRate,
          area,
          factors: factors.map((factor) => ({
            id: factor.id,
            name: factor.name,
            weight: factor.weight,
            level: factorLevels[factor.id] || 0,
          })),
          areaIntervals,
          selections: factorLevels,
          estimatedHours,
          fixedExpenses,
          personalExpenses,
          proLabore,
          productiveHours,
          commercialDiscount,
          variableExpenses,
          results: {
            globalComplexity,
            adjustedHourlyRate,
            projectPrice,
            finalSalePrice,
          },
        }}
      />

      <a
        href="https://senja.io/p/calcularq/r/GRdv6A"
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center text-[#fc7338] underline font-medium text-sm"
      >
        Avalie a Calcularq e ganhe um cupom de 25% para um colega
      </a>
    </div>
  );

  return (
    <div>
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 lg:p-8 shadow-sm">
        <SectionHeader
          title="Composição final do preço"
          description="Ajuste as horas, despesas e desconto comercial para finalizar o cálculo e visualizar o preço de venda final."
          icon={<DollarSign className="w-5 h-5 text-calcularq-blue" />}
        />

        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
              Estimativa de horas de projeto
              <Tooltip text="Quantidade total de horas que você estima gastar para executar este projeto. Considere a etapa, o tamanho e a complexidade do projeto ao estimar esse tempo. O sistema multiplicará esse valor pela sua Hora Técnica Ajustada." />
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={estimatedHoursDraft}
              onChange={(e) => {
                const nextDraft = sanitizeNumberDraft(e.target.value);
                setEstimatedHoursDraft(nextDraft);
                const parsed = parsePtBrNumber(nextDraft);
                onEstimatedHoursChange(parsed !== null && parsed >= 0 ? parsed : 0);
              }}
              onBlur={() => {
                const parsed = parsePtBrNumber(estimatedHoursDraft);
                setEstimatedHoursDraft(parsed !== null && parsed > 0 ? formatHoursPtBr(parsed) : "");
              }}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg text-lg font-semibold text-calcularq-blue focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20 focus:border-calcularq-blue"
              placeholder="0"
            />
          </div>

          <ExpenseCard
            expenses={variableExpenses}
            onAdd={handleAddExpense}
            onRemove={handleRemoveExpense}
            onUpdate={handleUpdateExpense}
            placeholder="Ex: RRT, Transporte..."
            label="Despesas variáveis do projeto (R$)"
            tooltip="Custos específicos deste contrato que serão repassados integralmente ao cliente."
          />

          <div className="space-y-4">
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
              Desconto comercial: {commercialDiscount}%
              <Tooltip text="Porcentagem de desconto aplicada sobre os honorários. O painel de resultados mostra o impacto no valor final." />
            </label>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="mb-4">
                <p className="text-xs sm:text-sm text-slate-500">
                  Arraste para ajustar ou digite o percentual.
                </p>
              </div>

              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={commercialDiscount}
                    onChange={(e) => {
                      const next = Math.max(0, Math.min(100, Number(e.target.value) || 0));
                      onCommercialDiscountChange(next);
                      setDiscountDraft(String(next));
                    }}
                    className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer
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
                  <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <span className="text-sm text-slate-600">Percentual:</span>
                  <div className="relative w-[100px] max-w-[120px]">
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
                      className="w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2.5 pr-10 text-center text-base font-bold text-calcularq-blue transition-all
                        focus:outline-none focus:border-calcularq-blue focus:ring-4 focus:ring-calcularq-blue/10"
                      aria-label="Desconto comercial em porcentagem"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-base font-bold text-calcularq-blue">%</span>
                  </div>
                </div>
              </div>
            </div>

            {commercialDiscount > 0 && (
              <div className="flex items-start gap-3 rounded-xl border-l-4 border-blue-500 bg-blue-50 px-4 py-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-0.5">Impacto do desconto</p>
                  <p className="text-sm text-blue-700">
                    Sua remuneração será reduzida em{" "}
                    <span className="font-bold">
                      R$ {discountAmount.toLocaleString("pt-BR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    .
                  </p>
                </div>
              </div>
            )}
            {commercialDiscount === 0 && (
              <div className="flex items-start gap-3 rounded-xl border-l-4 border-green-500 bg-green-50 px-4 py-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-900 mb-0.5">Sem desconto aplicado</p>
                  <p className="text-sm text-green-700">Sua remuneração-base permanece integral.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:block mt-8 pt-6 border-t border-slate-200">{saveActions}</div>
      </div>

      {mobileResultsContent && <div className="mt-6 lg:hidden">{mobileResultsContent}</div>}

      <div className="mt-6 lg:hidden bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">{saveActions}</div>
    </div>
  );
}

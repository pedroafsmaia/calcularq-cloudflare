import { DollarSign } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import ExpenseCard, { Expense } from "./ExpenseCard";
import SaveBudgetButton from "./SaveBudgetButton";
import Tooltip from "@/components/ui/Tooltip";

interface FinalCalculationProps {
  budgetId?: string;
  initialBudgetName?: string;
  initialClientName?: string;
  initialProjectName?: string;
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
  factors: Array<{ id: string; name: string; weight: number }>;
  areaIntervals: Array<{ min: number; max: number | null; level: number }>;
  fixedExpenses?: Expense[];
  productiveHours?: number;
  mobileResultsContent?: ReactNode;
}

export default function FinalCalculation({
  budgetId,
  initialBudgetName,
  initialClientName,
  initialProjectName,
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
  factors,
  areaIntervals,
  fixedExpenses = [],
  productiveHours = 0,
  mobileResultsContent,
}: FinalCalculationProps) {
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

  const saveActions = (
    <div className="space-y-4">
      <SaveBudgetButton
        budgetId={budgetId}
        initialBudgetName={initialBudgetName}
        clientName={initialClientName}
        projectName={initialProjectName}
        budgetData={{
          minHourlyRate,
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
      <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-calcularq-blue/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-calcularq-blue" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-calcularq-blue">Composição Final do Preço</h2>
            <p className="text-sm text-slate-500 mt-1">Configure os parâmetros finais do projeto</p>
          </div>
        </div>

        <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-blue-50/70">
          <p className="text-sm text-blue-800">
            Ajuste as horas, despesas e desconto comercial para finalizar o cálculo e visualizar o impacto no valor final.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
              Estimativa de Horas de Projeto
              <Tooltip text="Quantidade total de horas que você estima gastar para executar este projeto. O sistema multiplicará esse valor pela sua Hora Técnica Ajustada." />
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={estimatedHours || ""}
              onChange={(e) => onEstimatedHoursChange(Number(e.target.value))}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-calcularq-blue focus:border-calcularq-blue text-lg font-semibold text-calcularq-blue"
              placeholder="0"
            />
          </div>

          <ExpenseCard
            expenses={variableExpenses}
            onAdd={handleAddExpense}
            onRemove={handleRemoveExpense}
            onUpdate={handleUpdateExpense}
            placeholder="Ex: RRT, Transporte..."
            label="Despesas Variáveis do Projeto (R$)"
            tooltip="Custos específicos deste contrato que serão repassados integralmente ao cliente."
          />

          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
              Desconto Comercial: {commercialDiscount}%
              <Tooltip text="Porcentagem de desconto aplicada sobre os honorários. O painel de resultados mostra o impacto no valor final." />
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={commercialDiscount}
              onChange={(e) => onCommercialDiscountChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-calcularq-blue mb-2"
            />
            <div className="flex justify-between text-xs text-slate-500 mb-2">
              <span>0%</span>
              <span>100%</span>
            </div>
            {commercialDiscount > 0 && (
              <div className="mt-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm text-slate-700">
                  Ao aplicar este desconto, você reduz sua remuneração em R${" "}
                  {discountAmount.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  .
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:block mt-6 pt-6 border-t border-slate-200">{saveActions}</div>
      </div>

      {mobileResultsContent && <div className="mt-6 lg:hidden">{mobileResultsContent}</div>}

      <div className="mt-6 lg:hidden bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">{saveActions}</div>
    </div>
  );
}

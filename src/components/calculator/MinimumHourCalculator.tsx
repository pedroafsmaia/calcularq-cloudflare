import { useEffect, useMemo, useRef, useState } from "react";
import { Calculator } from "lucide-react";
import ExpenseCard, { type Expense } from "./ExpenseCard";
import Tooltip from "@/components/ui/Tooltip";
import SectionHeader from "./SectionHeader";
import { formatCurrencyPtBr, formatHoursPtBr, parsePtBrNumber, sanitizeNumberDraft } from "@/lib/numberFormat";

interface MinimumHourCalculatorProps {
  initialFixedExpenses?: Expense[];
  initialPersonalExpenses?: Expense[];
  initialProLabore?: number;
  initialProductiveHours?: number;
  onProLaboreChange?: (value: number) => void;
  onPersonalExpensesChange?: (expenses: Expense[]) => void;
  onCalculate: (minHourRate: number) => void;
  initialMinHourRate?: number;
  onFixedExpensesChange?: (expenses: Expense[]) => void;
  onProductiveHoursChange?: (hours: number) => void;
  initialUseManual?: boolean;
  onManualModeChange?: (value: boolean) => void;
  onClearCalculation?: () => void;
  titleLabel?: string;
  manualToggleLabel?: string;
  manualFieldLabel?: string;
}

export default function MinimumHourCalculator({
  onCalculate,
  initialMinHourRate,
  onFixedExpensesChange,
  onProductiveHoursChange,
  onProLaboreChange,
  onPersonalExpensesChange,
  initialFixedExpenses,
  initialPersonalExpenses,
  initialProLabore,
  initialProductiveHours,
  initialUseManual = false,
  onManualModeChange,
  onClearCalculation,
  titleLabel = "Hora técnica mínima",
  manualToggleLabel = "Já sei a minha hora técnica.",
  manualFieldLabel = "Hora técnica (R$/hora)",
}: MinimumHourCalculatorProps) {
  const [fixedExpenses, setFixedExpenses] = useState<Expense[]>(initialFixedExpenses || []);
  const [personalExpenses, setPersonalExpenses] = useState<Expense[]>(
    initialPersonalExpenses ||
      (typeof initialProLabore === "number" && initialProLabore > 0
        ? [{ id: "personal-legacy", name: "Despesa pessoal", value: initialProLabore }]
        : [])
  );
  const [productiveHours, setProductiveHours] = useState(initialProductiveHours || 0);
  const [manualMinHourRate, setManualMinHourRate] = useState<number | undefined>(initialMinHourRate);
  const [useManual, setUseManual] = useState(initialUseManual);
  const [manualMinHourDraft, setManualMinHourDraft] = useState("");
  const [productiveHoursDraft, setProductiveHoursDraft] = useState("");
  const [isEditingManualMinHour, setIsEditingManualMinHour] = useState(false);
  const [isEditingProductiveHours, setIsEditingProductiveHours] = useState(false);

  const proLabore = useMemo(() => personalExpenses.reduce((sum, exp) => sum + exp.value, 0), [personalExpenses]);

  const calculatedMinHourRate = useMemo(() => {
    if (useManual) {
      return manualMinHourRate ?? 0;
    }
    const totalExpenses = fixedExpenses.reduce((sum, exp) => sum + exp.value, 0);
    if (productiveHours === 0) return 0;
    return (totalExpenses + proLabore) / productiveHours;
  }, [fixedExpenses, proLabore, productiveHours, useManual, manualMinHourRate]);

  const prevInitialExpensesRef = useRef<string>("");
  useEffect(() => {
    const serialized = JSON.stringify(initialFixedExpenses || []);
    if (serialized === prevInitialExpensesRef.current) return;
    prevInitialExpensesRef.current = serialized;
    if (initialFixedExpenses) {
      setFixedExpenses(initialFixedExpenses);
      onFixedExpensesChange?.(initialFixedExpenses);
    }
  }, [initialFixedExpenses, onFixedExpensesChange]);

  useEffect(() => {
    if (typeof initialProLabore === "number") {
      if (!initialPersonalExpenses || initialPersonalExpenses.length === 0) {
        const legacyExpenses =
          initialProLabore > 0 ? [{ id: "personal-legacy", name: "Despesa pessoal", value: initialProLabore }] : [];
        setPersonalExpenses(legacyExpenses);
        onPersonalExpensesChange?.(legacyExpenses);
      }
      onProLaboreChange?.(initialProLabore);
    }
  }, [initialPersonalExpenses, initialProLabore, onPersonalExpensesChange, onProLaboreChange]);

  const prevInitialPersonalExpensesRef = useRef<string>("");
  useEffect(() => {
    const serialized = JSON.stringify(initialPersonalExpenses || []);
    if (serialized === prevInitialPersonalExpensesRef.current) return;
    prevInitialPersonalExpensesRef.current = serialized;
    if (initialPersonalExpenses) {
      setPersonalExpenses(initialPersonalExpenses);
      onPersonalExpensesChange?.(initialPersonalExpenses);
    }
  }, [initialPersonalExpenses, onPersonalExpensesChange]);

  useEffect(() => {
    if (typeof initialProductiveHours === "number") {
      setProductiveHours(initialProductiveHours);
      onProductiveHoursChange?.(initialProductiveHours);
    }
  }, [initialProductiveHours, onProductiveHoursChange]);

  useEffect(() => {
    setUseManual(initialUseManual);
  }, [initialUseManual]);

  useEffect(() => {
    if (isEditingManualMinHour) return;
    setManualMinHourDraft(
      typeof manualMinHourRate === "number" && manualMinHourRate > 0 ? formatCurrencyPtBr(manualMinHourRate) : ""
    );
  }, [manualMinHourRate, isEditingManualMinHour]);

  useEffect(() => {
    if (isEditingProductiveHours) return;
    setProductiveHoursDraft(productiveHours > 0 ? formatHoursPtBr(productiveHours) : "");
  }, [productiveHours, isEditingProductiveHours]);

  useEffect(() => {
    onManualModeChange?.(useManual);
  }, [useManual, onManualModeChange]);

  const handleAddExpense = (expense: Expense) => {
    const updated = [...fixedExpenses, expense];
    setFixedExpenses(updated);
    onFixedExpensesChange?.(updated);
  };

  const handleAddPersonalExpense = (expense: Expense) => {
    const updated = [...personalExpenses, expense];
    setPersonalExpenses(updated);
    onPersonalExpensesChange?.(updated);
    onProLaboreChange?.(updated.reduce((sum, exp) => sum + exp.value, 0));
  };

  const handleRemovePersonalExpense = (id: string) => {
    const updated = personalExpenses.filter((exp) => exp.id !== id);
    setPersonalExpenses(updated);
    onPersonalExpensesChange?.(updated);
    onProLaboreChange?.(updated.reduce((sum, exp) => sum + exp.value, 0));
  };

  const handleUpdatePersonalExpense = (id: string, updates: Partial<Expense>) => {
    const updated = personalExpenses.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp));
    setPersonalExpenses(updated);
    onPersonalExpensesChange?.(updated);
    onProLaboreChange?.(updated.reduce((sum, exp) => sum + exp.value, 0));
  };

  const handleRemoveExpense = (id: string) => {
    const updated = fixedExpenses.filter((exp) => exp.id !== id);
    setFixedExpenses(updated);
    onFixedExpensesChange?.(updated);
  };

  const handleUpdateExpense = (id: string, updates: Partial<Expense>) => {
    const updated = fixedExpenses.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp));
    setFixedExpenses(updated);
    onFixedExpensesChange?.(updated);
  };

  useEffect(() => {
    if (!useManual && calculatedMinHourRate > 0) {
      onCalculate(calculatedMinHourRate);
    } else if (useManual && manualMinHourRate !== undefined && manualMinHourRate > 0) {
      onCalculate(manualMinHourRate);
    }
  }, [calculatedMinHourRate, manualMinHourRate, onCalculate, useManual]);

  useEffect(() => {
    onProLaboreChange?.(proLabore);
  }, [proLabore, onProLaboreChange]);

  useEffect(() => {
    if (!useManual && fixedExpenses.length === 0) {
      handleAddExpense({ id: Date.now().toString(), name: "", value: 0 });
    }
  }, [fixedExpenses.length, useManual]);

  useEffect(() => {
    if (!useManual && personalExpenses.length === 0 && (initialProLabore ?? 0) === 0) {
      handleAddPersonalExpense({ id: `${Date.now()}-personal`, name: "", value: 0 });
    }
  }, [initialProLabore, personalExpenses.length, useManual]);

  return (
    <div className="space-y-6">
      {onClearCalculation ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClearCalculation}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:w-auto"
          >
            Reiniciar cálculo
          </button>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
        <SectionHeader
          className="mb-6"
          title={titleLabel}
          description="Preencha os dados do seu escritório para descobrir o valor da sua hora técnica base."
          icon={<Calculator className="h-5 w-5 text-calcularq-blue" />}
        />

        <div className="space-y-5">
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5">
            <input
              type="checkbox"
              id="useManual"
              checked={useManual}
              onChange={(e) => setUseManual(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-calcularq-blue focus:ring-2 focus:ring-calcularq-blue/20 focus:ring-offset-0"
            />
            <label htmlFor="useManual" className="flex items-center gap-1.5 text-sm font-medium leading-snug text-slate-700">
              {manualToggleLabel}
              <Tooltip text="Use esta opção se você já conhece sua hora técnica. Se o valor estiver abaixo do necessário, sua margem pode ficar comprometida." />
            </label>
          </div>

          {useManual ? (
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                {manualFieldLabel}
                <Tooltip text="Valor mínimo por hora para cobrir despesas fixas e pessoais sem prejuízo." />
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={manualMinHourDraft}
                  onFocus={() => setIsEditingManualMinHour(true)}
                  onChange={(e) => {
                    const nextDraft = sanitizeNumberDraft(e.target.value);
                    setManualMinHourDraft(nextDraft);
                    const parsed = parsePtBrNumber(nextDraft);
                    setManualMinHourRate(parsed !== null && parsed >= 0 ? parsed : undefined);
                  }}
                  onBlur={() => {
                    const parsed = parsePtBrNumber(manualMinHourDraft);
                    setManualMinHourDraft(parsed !== null && parsed > 0 ? formatCurrencyPtBr(parsed) : "");
                    setManualMinHourRate(parsed !== null && parsed >= 0 ? parsed : undefined);
                    setIsEditingManualMinHour(false);
                  }}
                  className="w-full rounded-lg border border-slate-300 py-3 pl-8 pr-3 focus:border-calcularq-blue focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20"
                  placeholder="0,00"
                />
              </div>
            </div>
          ) : (
            <>
              <ExpenseCard
                expenses={fixedExpenses}
                onAdd={handleAddExpense}
                onRemove={handleRemoveExpense}
                onUpdate={handleUpdateExpense}
                placeholder="Ex: Aluguel, Contador..."
                label="Despesas operacionais fixas (R$)"
                tooltip="Despesas fixas mensais para manter o escritório funcionando. Custos variáveis por projeto entram na etapa final."
              />

              <ExpenseCard
                expenses={personalExpenses}
                onAdd={handleAddPersonalExpense}
                onRemove={handleRemovePersonalExpense}
                onUpdate={handleUpdatePersonalExpense}
                placeholder="Ex: Moradia, Alimentação..."
                label="Despesas pessoais essenciais (R$)"
                tooltip="Inclua custos pessoais essenciais mensais."
              />

              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  Horas produtivas mensais
                  <Tooltip text="Considere apenas tempo efetivo de produção de projeto, sem tarefas administrativas." />
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={productiveHoursDraft}
                  onFocus={() => setIsEditingProductiveHours(true)}
                  onChange={(e) => {
                    const nextDraft = sanitizeNumberDraft(e.target.value);
                    setProductiveHoursDraft(nextDraft);
                    const parsed = parsePtBrNumber(nextDraft);
                    const hours = parsed !== null && parsed >= 0 ? parsed : 0;
                    setProductiveHours(hours);
                    onProductiveHoursChange?.(hours);
                  }}
                  onBlur={() => {
                    const parsed = parsePtBrNumber(productiveHoursDraft);
                    const hours = parsed !== null && parsed >= 0 ? parsed : 0;
                    setProductiveHoursDraft(hours > 0 ? formatHoursPtBr(hours) : "");
                    setProductiveHours(hours);
                    onProductiveHoursChange?.(hours);
                    setIsEditingProductiveHours(false);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 focus:border-calcularq-blue focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20"
                  placeholder="0"
                />
              </div>
            </>
          )}

        </div>
      </section>
    </div>
  );
}

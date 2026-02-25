import { useState, useMemo, useEffect, useRef } from "react";
import { Calculator } from "lucide-react";
import ExpenseCard, { Expense } from "./ExpenseCard";
import Tooltip from "@/components/ui/Tooltip";
import SectionHeader from "./SectionHeader";

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
}: MinimumHourCalculatorProps) {
  const [fixedExpenses, setFixedExpenses] = useState<Expense[]>(initialFixedExpenses || []);
  const [personalExpenses, setPersonalExpenses] = useState<Expense[]>(
    initialPersonalExpenses || (typeof initialProLabore === "number" && initialProLabore > 0
      ? [{ id: "personal-legacy", name: "Despesa pessoal", value: initialProLabore }]
      : [])
  );
  const [productiveHours, setProductiveHours] = useState(initialProductiveHours || 0);
  const [manualMinHourRate, setManualMinHourRate] = useState<number | undefined>(initialMinHourRate);
  const [useManual, setUseManual] = useState(initialUseManual);

  const proLabore = useMemo(
    () => personalExpenses.reduce((sum, exp) => sum + exp.value, 0),
    [personalExpenses]
  );

  const calculatedMinHourRate = useMemo(() => {
    if (useManual && manualMinHourRate !== undefined) {
      return manualMinHourRate;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFixedExpenses]);

  useEffect(() => {
    if (typeof initialProLabore === 'number') {
      if (!initialPersonalExpenses || initialPersonalExpenses.length === 0) {
        const legacyExpenses =
          initialProLabore > 0 ? [{ id: "personal-legacy", name: "Despesa pessoal", value: initialProLabore }] : [];
        setPersonalExpenses(legacyExpenses);
        onPersonalExpensesChange?.(legacyExpenses);
      }
      onProLaboreChange?.(initialProLabore);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProLabore]);

  const prevInitialPersonalExpensesRef = useRef<string>("");
  useEffect(() => {
    const serialized = JSON.stringify(initialPersonalExpenses || []);
    if (serialized === prevInitialPersonalExpensesRef.current) return;
    prevInitialPersonalExpensesRef.current = serialized;
    if (initialPersonalExpenses) {
      setPersonalExpenses(initialPersonalExpenses);
      onPersonalExpensesChange?.(initialPersonalExpenses);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPersonalExpenses]);

  useEffect(() => {
    if (typeof initialProductiveHours === 'number') {
      setProductiveHours(initialProductiveHours);
      onProductiveHoursChange?.(initialProductiveHours);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProductiveHours]);

  useEffect(() => {
    setUseManual(initialUseManual);
  }, [initialUseManual]);

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

  const handleCalculate = () => {
    onCalculate(calculatedMinHourRate);
  };

  useEffect(() => {
    if (!useManual && calculatedMinHourRate > 0) {
      handleCalculate();
    } else if (useManual && manualMinHourRate !== undefined && manualMinHourRate > 0) {
      handleCalculate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatedMinHourRate, useManual, manualMinHourRate]);

  useEffect(() => {
    onProLaboreChange?.(proLabore);
  }, [proLabore, onProLaboreChange]);

  useEffect(() => {
    if (!useManual && fixedExpenses.length === 0) {
      handleAddExpense({ id: Date.now().toString(), name: "", value: 0 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!useManual && personalExpenses.length === 0 && (initialProLabore ?? 0) === 0) {
      handleAddPersonalExpense({ id: `${Date.now()}-personal`, name: "", value: 0 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 lg:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <SectionHeader
          className="mb-0"
          title="Hora técnica mínima"
          description="Preencha os dados do seu escritório para descobrir o valor da sua hora técnica mínima."
          icon={<Calculator className="w-5 h-5 text-calcularq-blue" />}
        />
        {onClearCalculation && (
          <button
            type="button"
            onClick={onClearCalculation}
            className="self-start w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Limpar cálculo
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Opção Manual */}
        <div className="flex items-start gap-3 p-3 sm:p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl">
          <input
            type="checkbox"
            id="useManual"
            checked={useManual}
            onChange={(e) => setUseManual(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-calcularq-blue border-slate-300 rounded focus:ring-calcularq-blue"
          />
          <label htmlFor="useManual" className="flex items-center gap-1.5 text-sm font-medium text-slate-700 leading-snug">
            Já sei a minha hora técnica mínima.
            <Tooltip text="Marque esta opção se você já calculou sua hora técnica mínima anteriormente e quer inserir o valor diretamente, sem precisar preencher despesas operacionais fixas e despesas pessoais essenciais novamente." />
          </label>
        </div>

        {useManual ? (
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
              Hora técnica mínima (R$/hora)
              <Tooltip text="O valor mínimo que você precisa cobrar por hora para cobrir todas as suas despesas operacionais fixas e despesas pessoais essenciais sem ter prejuízo. Este é o piso financeiro do seu escritório." />
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">R$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={manualMinHourRate || ""}
                onChange={(e) => setManualMinHourRate(Number(e.target.value))}
                className="w-full pl-8 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-calcularq-blue focus:border-calcularq-blue"
                placeholder="0,00"
              />
            </div>
          </div>
        ) : (
          <>
            {/* Despesas operacionais fixas */}
            <ExpenseCard
              expenses={fixedExpenses}
              onAdd={handleAddExpense}
              onRemove={handleRemoveExpense}
              onUpdate={handleUpdateExpense}
              placeholder="Ex: Aluguel, Contador..."
              label="Despesas operacionais fixas mensais (R$)"
              tooltip="Todos os custos recorrentes para manter o escritório funcionando: aluguel, softwares, salários, contador, anuidades do CAU, etc. Não inclua custos variáveis por projeto — esses serão adicionados na etapa final."
            />

            <ExpenseCard
              expenses={personalExpenses}
              onAdd={handleAddPersonalExpense}
              onRemove={handleRemovePersonalExpense}
              onUpdate={handleUpdatePersonalExpense}
              placeholder="Ex: Moradia, Alimentação..."
              label="Despesas pessoais essenciais (R$)"
              tooltip="Suas despesas pessoais mensais essenciais. Inclua moradia, alimentação, saúde, transporte e outros custos de vida. O total substitui o antigo campo de pró-labore."
            />

            {/* Horas Produtivas Mensais */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-2">
                Horas produtivas mensais
                <Tooltip text="Total de horas dedicadas efetivamente à produção de projetos por mês. Considere apenas o tempo focado em projeto — cerca de 70% a 80% do tempo total, descontando reuniões, pausas e tarefas administrativas. Ex: de 160h mensais, use ~120h." />
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={productiveHours || ""}
                onChange={(e) => {
                  const hours = Number(e.target.value);
                  setProductiveHours(hours);
                  onProductiveHoursChange?.(hours);
                }}
                className="w-full px-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-calcularq-blue focus:border-calcularq-blue"
                placeholder="0"
              />
            </div>
          </>
        )}

        {/* Resultado */}
        <div className="p-4 bg-calcularq-blue/10 rounded-xl border border-calcularq-blue/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className="font-semibold text-calcularq-blue">Hora técnica mínima (R$/hora):</span>
            <span className="text-xl sm:text-2xl font-bold text-calcularq-blue">
              R$ {calculatedMinHourRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

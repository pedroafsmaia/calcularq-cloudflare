import { useState, useMemo, useEffect, useRef } from "react";
import { Calculator, TrendingUp } from "lucide-react";
import ExpenseCard, { Expense } from "./ExpenseCard";
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
  initialMargin?: number;
  onMarginChange?: (value: number) => void;
  initialTechnicalPremium?: number;
  onTechnicalPremiumChange?: (value: number) => void;
  technicalLevel?: number;
  titleLabel?: string;
  manualToggleLabel?: string;
  manualFieldLabel?: string;
  resultLabel?: string;
}

const TECHNICAL_PREMIUM_PRESETS = [0.25, 0.35, 0.45] as const;
const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

const TECHNICAL_PREMIUM_OPTIONS = [
  { value: 0.25, label: "Suave" },
  { value: 0.35, label: "Equilibrado" },
  { value: 0.45, label: "Agressivo" },
] as const;

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
  initialMargin = 0.15,
  onMarginChange,
  initialTechnicalPremium = 0.35,
  onTechnicalPremiumChange,
  technicalLevel = 3,
  titleLabel = "Hora técnica mínima",
  manualToggleLabel = "Já sei a minha hora técnica.",
  manualFieldLabel = "Hora técnica (R$/hora)",
  resultLabel = "Hora técnica (R$/hora):",
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

  const [margin, setMargin] = useState(initialMargin);
  const [customMarginDraft, setCustomMarginDraft] = useState(() => {
    const percent = clampPercent(initialMargin * 100);
    return Number.isFinite(percent) ? percent.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) : "";
  });
  const [technicalPremium, setTechnicalPremium] = useState(
    TECHNICAL_PREMIUM_PRESETS.includes(initialTechnicalPremium as (typeof TECHNICAL_PREMIUM_PRESETS)[number])
      ? initialTechnicalPremium
      : 0.35
  );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFixedExpenses]);

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
    if (typeof initialProductiveHours === "number") {
      setProductiveHours(initialProductiveHours);
      onProductiveHoursChange?.(initialProductiveHours);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProductiveHours]);

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

  useEffect(() => {
    setMargin(initialMargin);
    const percent = clampPercent(initialMargin * 100);
    setCustomMarginDraft(percent.toLocaleString("pt-BR", { maximumFractionDigits: 2 }));
  }, [initialMargin]);

  useEffect(() => {
    onMarginChange?.(margin);
  }, [margin, onMarginChange]);

  useEffect(() => {
    setTechnicalPremium(
      TECHNICAL_PREMIUM_PRESETS.includes(initialTechnicalPremium as (typeof TECHNICAL_PREMIUM_PRESETS)[number])
        ? initialTechnicalPremium
        : 0.35
    );
  }, [initialTechnicalPremium]);

  useEffect(() => {
    onTechnicalPremiumChange?.(technicalPremium);
  }, [onTechnicalPremiumChange, technicalPremium]);

  const technicalPremiumTooltipText = useMemo(() => {
    const baseRate =
      typeof initialMinHourRate === "number" && Number.isFinite(initialMinHourRate) && initialMinHourRate > 0
        ? initialMinHourRate
        : calculatedMinHourRate;

    if (!Number.isFinite(baseRate) || baseRate <= 0) {
      return [
        "Preencha a hora técnica mínima para visualizar a simulação do prêmio por complexidade.",
        "Os valores serão atualizados automaticamente no painel de resultados.",
      ].join("\n");
    }

    const safeTechnicalLevel = Math.max(1, Math.min(5, Math.round(technicalLevel)));
    const cTech = (safeTechnicalLevel - 1) / 4;

    const currentOption = TECHNICAL_PREMIUM_OPTIONS.find((option) => option.value === technicalPremium);

    const optionLines = TECHNICAL_PREMIUM_OPTIONS.map((option) => {
      const maxHourly = baseRate * (1 + margin + option.value * cTech);
      return `${option.label} (+${Math.round(option.value * 100)}%): ${formatCurrencyPtBr(maxHourly)}/h`;
    });

    return [
      "Simulação do valor máximo com sua hora técnica atual:",
      `Exigência técnica atual (F4): nível ${safeTechnicalLevel}`,
      ...optionLines,
      `Opção selecionada: ${currentOption?.label ?? "Equilibrado"} (+${Math.round(technicalPremium * 100)}%)`,
      "Baseado em simulações, ajustado com uso.",
    ].join("\n");
  }, [calculatedMinHourRate, initialMinHourRate, margin, technicalLevel, technicalPremium]);

  const applyCustomMarginDraft = (draft: string) => {
    const parsed = parsePtBrNumber(draft);
    if (parsed === null) {
      setMargin(0);
      return;
    }
    setMargin(clampPercent(parsed) / 100);
  };

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
    <div className="space-y-6">
      {onClearCalculation && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClearCalculation}
            className="self-start w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Reiniciar cálculo
          </button>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
        <SectionHeader
          className="mb-6"
          title={titleLabel}
          description="Preencha os dados do seu escritório para descobrir o valor da sua hora técnica base."
          icon={<Calculator className="w-5 h-5 text-calcularq-blue" />}
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
            <label htmlFor="useManual" className="flex items-center gap-1.5 text-sm font-medium text-slate-700 leading-snug">
              {manualToggleLabel}
              <Tooltip text="Use esta opção se você já conhece sua hora técnica. Atenção: se o valor estiver abaixo do necessário, sua margem/lucro pode ficar comprometida." />
            </label>
          </div>

          {useManual ? (
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                {manualFieldLabel}
                <Tooltip text="O valor mínimo que você precisa cobrar por hora para cobrir todas as suas despesas operacionais fixas e despesas pessoais essenciais sem ter prejuízo. Este é o piso financeiro do seu escritório." />
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
                tooltip="Suas despesas operacionais fixas mensais para manter o escritório funcionando: aluguel, softwares, salários, contador, anuidades do CAU etc. Não inclua custos variáveis por projeto — esses serão adicionados na etapa final."
              />

              <ExpenseCard
                expenses={personalExpenses}
                onAdd={handleAddPersonalExpense}
                onRemove={handleRemovePersonalExpense}
                onUpdate={handleUpdatePersonalExpense}
                placeholder="Ex: Moradia, Alimentação..."
                label="Despesas pessoais essenciais (R$)"
                tooltip="Despesas pessoais essenciais mensais. Inclua moradia, alimentação, saúde, transporte e outros custos de vida."
              />

              <div>
                <label className="mb-2 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                  Horas produtivas mensais
                  <Tooltip text="Total de horas dedicadas efetivamente à produção de projetos por mês. Considere apenas o tempo focado em projeto — cerca de 70% a 80% do tempo total, descontando reuniões, pausas e tarefas administrativas. Ex: de 160h mensais, use ~120h." />
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

          <div className="rounded-xl border border-calcularq-blue/20 bg-calcularq-blue/10 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-semibold text-calcularq-blue">{resultLabel}</span>
              <span className="text-xl font-bold text-calcularq-blue sm:text-2xl">
                R$ {calculatedMinHourRate.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
        <SectionHeader
          className="mb-6"
          title="Ajustes de preço"
          description="Defina a margem de lucro e o prêmio por complexidade para calibrar sua hora ajustada."
          icon={<TrendingUp className="w-5 h-5 text-calcularq-blue" />}
        />

        <div className="space-y-5">
          <div>
            <h4 className="text-sm font-semibold text-slate-800 mb-1">Margem de lucro</h4>
            <div className="space-y-2">
              {[
                { value: 0.1, label: "Baixa (10%)" },
                { value: 0.15, label: "Média (15%)" },
                { value: 0.2, label: "Alta (20%)" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={[
                    "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                    margin === option.value
                      ? "border-calcularq-blue bg-calcularq-blue/5 text-calcularq-blue"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="margin"
                    value={option.value}
                    checked={margin === option.value}
                    onChange={() => {
                      setMargin(option.value);
                      setCustomMarginDraft((option.value * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 }));
                    }}
                  />
                  <span>{option.label}</span>
                </label>
              ))}

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600">Margem personalizada (%)</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={customMarginDraft}
                    onChange={(event) => {
                      const nextDraft = sanitizeNumberDraft(event.target.value);
                      setCustomMarginDraft(nextDraft);
                      applyCustomMarginDraft(nextDraft);
                    }}
                    onBlur={() => {
                      const parsed = parsePtBrNumber(customMarginDraft);
                      if (parsed === null) {
                        setCustomMarginDraft("");
                        setMargin(0);
                        return;
                      }
                      const clamped = clampPercent(parsed);
                      setCustomMarginDraft(clamped.toLocaleString("pt-BR", { maximumFractionDigits: 2 }));
                      setMargin(clamped / 100);
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20 focus:border-calcularq-blue"
                    placeholder="0"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">%</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
              Prêmio por complexidade
              <Tooltip text={technicalPremiumTooltipText} />
            </h4>
            <div className="space-y-2">
              {TECHNICAL_PREMIUM_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={[
                    "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
                    technicalPremium === option.value
                      ? "border-calcularq-blue bg-calcularq-blue/5 text-calcularq-blue"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                  ].join(" ")}
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="technical-premium"
                      value={option.value}
                      checked={technicalPremium === option.value}
                      onChange={() => setTechnicalPremium(option.value)}
                    />
                    <span>{option.label} (+{Math.round(option.value * 100)}%)</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

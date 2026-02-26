import { useEffect, useMemo, useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Tooltip from "@/components/ui/Tooltip";
import { formatCurrencyPtBr, parsePtBrNumber, sanitizeNumberDraft } from "@/lib/numberFormat";

export interface Expense {
  id: string;
  name: string;
  value: number;
}

interface ExpenseCardProps {
  expenses: Expense[];
  onAdd: (expense: Expense) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, expense: Partial<Expense>) => void;
  placeholder: string;
  label: string;
  tooltip?: string;
}

export default function ExpenseCard({ 
  expenses, 
  onAdd, 
  onRemove, 
  onUpdate,
  placeholder,
  label,
  tooltip,
}: ExpenseCardProps) {
  const total = expenses.reduce((sum, exp) => sum + exp.value, 0);
  const [valueDrafts, setValueDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setValueDrafts((prev) => {
      const next: Record<string, string> = {};
      for (const expense of expenses) {
        const existing = prev[expense.id];
        if (existing !== undefined) {
          const parsedExisting = parsePtBrNumber(existing);
          next[expense.id] =
            parsedExisting !== null && Math.abs(parsedExisting - expense.value) < 0.005
              ? existing
              : expense.value > 0
                ? formatCurrencyPtBr(expense.value)
                : "";
          continue;
        }
        next[expense.id] = expense.value > 0 ? formatCurrencyPtBr(expense.value) : "";
      }
      return next;
    });
  }, [expenses]);

  const canShowTotal = useMemo(() => expenses.length > 0, [expenses.length]);

  const handleAdd = () => {
    const newExpense: Expense = {
      id: Date.now().toString(),
      name: "",
      value: 0,
    };
    onAdd(newExpense);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
          {label}
          {tooltip && <Tooltip text={tooltip} />}
        </label>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-2.5 sm:p-3">
        <div className="space-y-2.5">
          {expenses.map((expense, index) => (
            <div key={expense.id}>
              {index > 0 ? <div className="mb-2.5 border-t border-slate-200/80" /> : null}
              <div className="flex items-center gap-2 p-1 flex-wrap sm:flex-nowrap">
                <input
                  type="text"
                  placeholder={placeholder}
                  value={expense.name}
                  onChange={(e) => onUpdate(expense.id, { name: e.target.value })}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg min-w-0 bg-white focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20 focus:border-calcularq-blue"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">R$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valueDrafts[expense.id] ?? ""}
                    onChange={(e) => {
                      const nextDraft = sanitizeNumberDraft(e.target.value);
                      setValueDrafts((prev) => ({ ...prev, [expense.id]: nextDraft }));
                      const parsed = parsePtBrNumber(nextDraft);
                      onUpdate(expense.id, { value: parsed !== null && parsed >= 0 ? parsed : 0 });
                    }}
                    onBlur={() => {
                      setValueDrafts((prev) => {
                        const current = prev[expense.id] ?? "";
                        const parsed = parsePtBrNumber(current);
                        return {
                          ...prev,
                          [expense.id]: parsed !== null && parsed > 0 ? formatCurrencyPtBr(parsed) : "",
                        };
                      });
                    }}
                    className="w-28 sm:w-32 pl-8 pr-3 py-2 border border-slate-300 rounded-lg min-w-0 bg-white focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20 focus:border-calcularq-blue"
                    placeholder="0,00"
                  />
                </div>
                {expenses.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(expense.id)}
                    className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 border-t border-slate-200/80 pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAdd}
            className="flex h-9 w-full items-center justify-center gap-2 border-dashed"
          >
            <Plus className="w-4 h-4" />
            Adicionar despesa
          </Button>
        </div>
      </div>

      {canShowTotal && (
        <div className="flex items-center justify-between p-3 bg-calcularq-blue/10 rounded-xl border border-calcularq-blue/20">
          <span className="font-semibold text-calcularq-blue">Total:</span>
          <span className="font-bold text-calcularq-blue">
            R$ {formatCurrencyPtBr(total)}
          </span>
        </div>
      )}
    </div>
  );
}

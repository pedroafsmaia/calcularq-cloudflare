import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Tooltip from "@/components/ui/Tooltip";

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
          {label}
          {tooltip && <Tooltip text={tooltip} />}
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          className="flex items-center gap-2 h-9 px-3"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </Button>
      </div>

      <div className="space-y-3">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="flex items-center gap-2 p-2.5 bg-slate-50/80 rounded-lg border border-slate-200 flex-wrap sm:flex-nowrap"
          >
            <input
              type="text"
              placeholder={placeholder}
              value={expense.name}
              onChange={(e) => onUpdate(expense.id, { name: e.target.value })}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-calcularq-blue focus:border-calcularq-blue min-w-0"
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">R$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={expense.value || ""}
                onChange={(e) => onUpdate(expense.id, { value: Number(e.target.value) })}
                className="w-28 sm:w-32 pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-calcularq-blue focus:border-calcularq-blue min-w-0"
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
        ))}
      </div>

      {expenses.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-calcularq-blue/10 rounded-xl border border-calcularq-blue/20">
          <span className="font-semibold text-calcularq-blue">Total:</span>
          <span className="font-bold text-calcularq-blue">
            R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      )}
    </div>
  );
}

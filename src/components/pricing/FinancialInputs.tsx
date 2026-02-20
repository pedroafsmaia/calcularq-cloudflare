
interface FinancialInputsProps {
  hourlyRate: number;
  estimatedHours: number;
  onHourlyRateChange: (value: number) => void;
  onEstimatedHoursChange: (value: number) => void;
}

export default function FinancialInputs({
  hourlyRate,
  estimatedHours,
  onHourlyRateChange,
  onEstimatedHoursChange,
}: FinancialInputsProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Taxa Horária (R$)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-slate-500 text-sm">R$</span>
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={hourlyRate}
              onChange={(e) => onHourlyRateChange(Number(e.target.value))}
              className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
              placeholder="150.00"
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Valor base por hora de trabalho
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Horas Estimadas
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={estimatedHours}
            onChange={(e) => onEstimatedHoursChange(Number(e.target.value))}
            className="block w-full px-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
            placeholder="40"
          />
          <p className="mt-1 text-xs text-slate-500">
            Total de horas previstas para o projeto
          </p>
        </div>
      </div>
    </div>
  );
}

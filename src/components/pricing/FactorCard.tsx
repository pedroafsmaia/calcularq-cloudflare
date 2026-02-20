import { Factor } from "./PricingEngine";

interface FactorCardProps {
  factor: Factor;
  value?: number;
  onChange: (factorId: string, value: number) => void;
}

export default function FactorCard({ factor, value, onChange }: FactorCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-6 hover:border-slate-300 hover:shadow-lg transition-all duration-300">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-900">{factor.name}</h3>
          <span className="text-xs text-calcularq-blue bg-calcularq-blue/10 px-2 py-1 rounded">
            Peso: {factor.weight}
          </span>
        </div>
        <p className="text-sm text-slate-500">{factor.description}</p>
      </div>

      <div className="space-y-2">
        {factor.options.map((option) => (
          <label
            key={option.value}
            className={`
              flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
              ${
                value === option.value
                  ? "border-calcularq-blue bg-calcularq-blue/10"
                  : "border-slate-200 hover:border-calcularq-blue/50"
              }
            `}
          >
            <input
              type="radio"
              name={factor.id}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(factor.id, option.value)}
              className="mt-0.5 w-4 h-4 text-calcularq-blue focus:ring-calcularq-blue"
            />
            <div className="flex-1">
              <div className="font-medium text-slate-900 text-sm">
                {option.label}
              </div>
              {option.description && (
                <div className="text-xs text-slate-500 mt-0.5">
                  {option.description}
                </div>
              )}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

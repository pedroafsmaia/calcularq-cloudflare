import { Factor } from "./PricingEngine";
import Tooltip from "@/components/ui/Tooltip";
import { getManualFactorTooltip } from "@/lib/manualFactorGuides";

interface FactorCardProps {
  factor: Factor;
  value?: number;
  onChange: (factorId: string, value: number) => void;
  reformValue?: boolean;
  onReformChange?: (value: boolean) => void;
}

export default function FactorCard({ factor, value, onChange, reformValue, onReformChange }: FactorCardProps) {
  const tooltipText = getManualFactorTooltip(factor.id);
  const reformTooltipText =
    "Marque quando o projeto envolver intervenção em edificação existente. Inclui reforma, ampliação, adaptação ou compatibilização com o existente.";

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm transition-colors transition-shadow duration-150 hover:border-slate-300 hover:shadow-sm sm:p-6">
      <div className="mb-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex items-center gap-1.5 font-semibold text-slate-900">
            {factor.name}
            {tooltipText ? <Tooltip text={tooltipText} /> : null}
          </h3>
          <span className="shrink-0 rounded-md border border-calcularq-blue/20 bg-calcularq-blue/10 px-2 py-1 text-xs text-calcularq-blue">
            Peso: {factor.weight}
          </span>
        </div>
        <p className="text-sm text-slate-500">{factor.description}</p>
      </div>

      <div className="space-y-2">
        {factor.options.map((option) => (
          <label
            key={option.value}
            className={[
              "flex items-start gap-3 rounded-xl border-2 bg-white p-3 transition-colors",
              value === option.value ? "border-calcularq-blue shadow-sm" : "border-slate-200 hover:border-calcularq-blue/40",
            ].join(" ")}
          >
            <input
              type="radio"
              name={factor.id}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(factor.id, option.value)}
              className="mt-0.5 h-4 w-4 text-calcularq-blue focus:ring-calcularq-blue"
            />
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900">{option.label}</div>
            </div>
          </label>
        ))}
      </div>

      {factor.id === "tipology" ? (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <label className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(reformValue)}
              onChange={(event) => onReformChange?.(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-calcularq-blue focus:ring-calcularq-blue"
            />
            <span className="inline-flex items-center gap-1.5">
              <span>Reforma/AmpliaÃ§Ã£o</span>
              <Tooltip text={reformTooltipText} />
            </span>
          </label>
        </div>
      ) : null}
    </div>
  );
}


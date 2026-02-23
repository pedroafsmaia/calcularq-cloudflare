import { Settings2 } from "lucide-react";
import Tooltip from "@/components/ui/Tooltip";
import SectionHeader from "./SectionHeader";
import { Factor } from "../pricing/PricingEngine";

interface ComplexityConfigProps {
  factors: Factor[];
  onFactorWeightChange: (factorId: string, weight: number) => void;
}

const WEIGHT_OPTIONS = [0, 0.5, 1, 2, 3, 4, 5, 6];

export default function ComplexityConfig({
  factors,
  onFactorWeightChange,
}: ComplexityConfigProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
      <div className="mb-6">
        <SectionHeader
          className="mb-0"
          title="Pesos dos fatores"
          description="(Opcional) Ajuste os pesos para refletir sua estratégia de precificação."
          icon={<Settings2 className="w-5 h-5 text-calcularq-blue" />}
          titleAccessory={
            <Tooltip text="Os pesos controlam quanto cada fator influencia a Complexidade Global. Se você não souber por onde começar, deixe todos em 1 (padrão) e ajuste depois." />
          }
        />
      </div>

      {/* Observação (sem ícone) */}
      <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-blue-50/70">
        <p className="text-sm text-blue-800 leading-relaxed">
          <strong>Observação:</strong> Sugerimos manter o peso 1 para todos os fatores inicialmente.
          Isso garante uma precificação equilibrada. Altere o peso quando julgar que um fator específico
          deve contribuir mais para o preço final do que os outros.
        </p>
      </div>

      <div className="space-y-4">
        {factors.map((factor) => (
          <div
            key={factor.id}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-slate-50/80 border border-slate-200 rounded-xl"
          >
            <div className="flex-1 min-w-0">
              <div className="font-medium text-slate-900 text-sm mb-1">
                {factor.name}
              </div>
              <div className="text-xs text-slate-500 leading-relaxed">
                {factor.description}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={factor.weight}
                onChange={(e) => onFactorWeightChange(factor.id, Number(e.target.value))}
                className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-calcularq-blue focus:border-calcularq-blue bg-white"
              >
                {WEIGHT_OPTIONS.map((weight) => (
                  <option key={weight} value={weight}>
                    {weight}
                  </option>
                ))}
              </select>

              <span className="w-14 text-right text-sm font-medium text-calcularq-blue">
                {factor.weight}x
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

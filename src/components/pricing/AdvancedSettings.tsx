import { Settings2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Factor } from "./PricingEngine";

interface AdvancedSettingsProps {
  factors: Factor[];
  onFactorWeightChange: (factorId: string, weight: number) => void;
  onResetWeights: () => void;
}

export default function AdvancedSettings({
  factors,
  onFactorWeightChange,
  onResetWeights,
}: AdvancedSettingsProps) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Configurações Avançadas
            </h3>
            <p className="text-sm text-slate-500">
              Ajuste os pesos dos fatores de complexidade
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onResetWeights}
          className="flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Resetar
        </Button>
      </div>

      <div className="space-y-4">
        {factors.map((factor) => (
          <div key={factor.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div className="flex-1">
              <div className="font-medium text-slate-900 text-sm mb-1">
                {factor.name}
              </div>
              <div className="text-xs text-slate-500">{factor.description}</div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={factor.weight}
                onChange={(e) =>
                  onFactorWeightChange(factor.id, Number(e.target.value))
                }
                className="w-24 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
              <span className="w-12 text-right text-sm font-medium text-slate-900">
                {factor.weight.toFixed(1)}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700">
          <strong>Dica:</strong> Ajuste os pesos para dar mais ou menos importância 
          a cada fator. Valores maiores aumentam o impacto do fator no cálculo final.
        </p>
      </div>
    </div>
  );
}

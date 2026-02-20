import { Settings2, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Factor } from "../pricing/PricingEngine";

interface ComplexityConfigProps {
  factors: Factor[];
  onFactorWeightChange: (factorId: string, weight: number) => void;
  onResetWeights: () => void;
}

const WEIGHT_OPTIONS = [0, 0.5, 1, 2, 3, 4, 5, 6];

export default function ComplexityConfig({
  factors,
  onFactorWeightChange,
  onResetWeights,
}: ComplexityConfigProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-calcularq-blue/10 flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-calcularq-blue" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-calcularq-blue">
              Configurações da Calculadora de Complexidade
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Ajuste os pesos dos fatores para calcular os preços de acordo com sua estratégia
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

      {/* Observação */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            <strong>Observação:</strong> Sugerimos manter o Peso 1 para todos os fatores inicialmente. 
            Isso garante uma precificação equilibrada. Altere o peso quando julgar que um fator específico 
            deve contribuir mais para o preço final do que os outros.
          </p>
        </div>
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
              <select
                value={factor.weight}
                onChange={(e) => onFactorWeightChange(factor.id, Number(e.target.value))}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-calcularq-blue focus:border-calcularq-blue bg-white"
              >
                {WEIGHT_OPTIONS.map((weight) => (
                  <option key={weight} value={weight}>
                    {weight}
                  </option>
                ))}
              </select>
              <span className="w-12 text-right text-sm font-medium text-calcularq-blue">
                Peso: {factor.weight}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

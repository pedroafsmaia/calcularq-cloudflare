import { useState } from "react";
import { Info, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaInterval, calculateAreaLevel } from "../pricing/PricingEngine";

interface AreaFactorCardProps {
  area: number | null;
  onAreaChange: (area: number) => void;
  onLevelChange: (level: number) => void;
  intervals: AreaInterval[];
  onIntervalsChange: (intervals: AreaInterval[]) => void;
}

export default function AreaFactorCard({
  area,
  onAreaChange,
  onLevelChange,
  intervals,
  onIntervalsChange,
}: AreaFactorCardProps) {
  const [isEditingIntervals, setIsEditingIntervals] = useState(false);
  const [editingIntervals, setEditingIntervals] = useState<AreaInterval[]>(intervals);

  const currentLevel = area !== null ? calculateAreaLevel(area, intervals) : null;

  const handleAreaInput = (value: number) => {
    onAreaChange(value);
    if (value > 0) {
      const level = calculateAreaLevel(value, intervals);
      onLevelChange(level);
    }
  };

  const handleSaveIntervals = () => {
    onIntervalsChange(editingIntervals);
    setIsEditingIntervals(false);
    if (area !== null) {
      const level = calculateAreaLevel(area, intervals);
      onLevelChange(level);
    }
  };

  const handleCancelEdit = () => {
    setEditingIntervals(intervals);
    setIsEditingIntervals(false);
  };

  const updateInterval = (index: number, field: 'min' | 'max', value: number | null) => {
    const updated = [...editingIntervals];
    updated[index] = { ...updated[index], [field]: value };
    setEditingIntervals(updated);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-slate-300 hover:shadow-lg transition-all duration-300">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-slate-900">Área de Projeto</h3>
          {currentLevel && (
            <span className="text-xs text-slate-500 bg-calcularq-blue/10 text-calcularq-blue px-2 py-1 rounded">
              Nível {currentLevel}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500">Estimativa da metragem total de intervenção.</p>
      </div>

      {/* Input de Área */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Área de Projeto (m²)
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={area || ""}
          onChange={(e) => handleAreaInput(Number(e.target.value))}
          className="w-full px-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-calcularq-blue focus:border-calcularq-blue"
          placeholder="Digite a área em m²"
        />
        {currentLevel && (
          <p className="text-xs text-slate-500 mt-2">
            Classificado automaticamente como <strong>Nível {currentLevel}</strong>
          </p>
        )}
      </div>

      {/* Régua de Intervalos */}
      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Régua de Intervalos</span>
          </div>
          {!isEditingIntervals ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingIntervals(true)}
              className="flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveIntervals}
                className="flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Salvar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancelar
              </Button>
            </div>
          )}
        </div>

        {/* Nota sobre intervalos */}
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          Os intervalos abaixo são a sugestão padrão do sistema. Você pode editá-los para adequar à realidade do seu escritório.
        </div>

        {/* Lista de Intervalos */}
        <div className="space-y-2">
          {(isEditingIntervals ? editingIntervals : intervals).map((interval, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 bg-slate-50 rounded"
            >
              <span className="text-xs font-medium text-slate-600 w-16">Nível {interval.level}:</span>
              {isEditingIntervals ? (
                <>
                  <input
                    type="number"
                    min="0"
                    value={interval.min}
                    onChange={(e) => updateInterval(index, 'min', Number(e.target.value))}
                    className="w-20 px-2 py-1 text-sm border border-slate-300 rounded"
                  />
                  <span className="text-xs text-slate-500">a</span>
                  <input
                    type="number"
                    min="0"
                    value={interval.max || ""}
                    onChange={(e) => updateInterval(index, 'max', e.target.value ? Number(e.target.value) : null)}
                    className="w-20 px-2 py-1 text-sm border border-slate-300 rounded"
                    placeholder="∞"
                  />
                  <span className="text-xs text-slate-500">m²</span>
                </>
              ) : (
                <span className="text-sm text-slate-700">
                  {interval.min} {interval.max === null ? 'ou mais' : `a ${interval.max}`} m²
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

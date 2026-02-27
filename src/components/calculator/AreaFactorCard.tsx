import { useEffect, useState } from "react";
import { Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaInterval, calculateAreaLevel } from "../pricing/PricingEngine";
import Tooltip from "@/components/ui/Tooltip";
import { formatNumberPtBr, parsePtBrNumber, sanitizeNumberDraft } from "@/lib/numberFormat";

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
  const [areaDraft, setAreaDraft] = useState("");

  const currentLevel = area !== null ? calculateAreaLevel(area, intervals) : null;

  const formatArea = (value: number) => {
    const hasFraction = Math.abs(value % 1) > 0.000001;
    return formatNumberPtBr(value, hasFraction ? 2 : 0);
  };

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

  const parseAreaValue = (raw: string) => {
    const parsed = parsePtBrNumber(raw);
    return parsed !== null && parsed >= 0 ? parsed : 0;
  };

  // Sincroniza o rascunho textual quando o valor externo muda (importação/reset)
  useEffect(() => {
    setAreaDraft(typeof area === "number" && area > 0 ? formatArea(area) : "");
  }, [area]);

  return (
    <div className="bg-calcularq-blue/5 rounded-2xl border border-calcularq-blue/15 p-5 sm:p-6 shadow-sm hover:border-calcularq-blue/30 hover:shadow-sm transition-colors transition-shadow duration-150">
      <div className="mb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          {/* Título com tooltip — igual aos outros FactorCards */}
          <h3 className="flex items-center gap-1.5 font-semibold text-slate-900">
            Área de Projeto
            <Tooltip text="Estimativa da metragem total de intervenção. Impacta diretamente o volume de trabalho — quanto maior a área, maior a escala do projeto. Os intervalos de nível podem ser editados para adequar à sua realidade." />
          </h3>
          {currentLevel && (
            <span className="shrink-0 text-xs text-slate-500 bg-calcularq-blue/10 text-calcularq-blue border border-calcularq-blue/20 px-2 py-1 rounded-md">
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
          type="text"
          inputMode="decimal"
          value={areaDraft}
          onChange={(e) => {
            const nextDraft = sanitizeNumberDraft(e.target.value);
            setAreaDraft(nextDraft);
            handleAreaInput(parseAreaValue(nextDraft));
          }}
          onBlur={() => {
            const parsed = parseAreaValue(areaDraft);
            setAreaDraft(parsed > 0 ? formatArea(parsed) : "");
          }}
          className="w-full px-3 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20 focus:border-calcularq-blue"
          placeholder="Digite a área em m²"
        />
        {currentLevel && (
          <p className="text-xs text-slate-500 mt-2">
            Classificado automaticamente como <strong>Nível {currentLevel}</strong>
          </p>
        )}
      </div>

      {/* Régua de Intervalos — sem ícone Info avulso */}
      <div className="border-t border-slate-200 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <span className="text-sm font-medium text-slate-700">Régua de Intervalos</span>
          {!isEditingIntervals ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditingIntervals(true)} className="flex items-center gap-2 self-start">
              <Edit2 className="w-4 h-4" />
              Editar
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={handleSaveIntervals} className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Salvar
              </Button>
              <Button variant="outline" size="sm" onClick={handleCancelEdit} className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Cancelar
              </Button>
            </div>
          )}
        </div>

        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          Os intervalos abaixo são a sugestão padrão do sistema. Você pode editá-los para adequar à realidade do seu escritório.
        </div>

        <div className="space-y-2">
          {(isEditingIntervals ? editingIntervals : intervals).map((interval, index) => (
            <div key={index} className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg">
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

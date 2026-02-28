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
  allowEditIntervals?: boolean;
  showIntervals?: boolean;
  showAutoLevelBadge?: boolean;
}

export default function AreaFactorCard({
  area,
  onAreaChange,
  onLevelChange,
  intervals,
  onIntervalsChange,
  allowEditIntervals = true,
  showIntervals = true,
  showAutoLevelBadge = true,
}: AreaFactorCardProps) {
  const [isEditingIntervals, setIsEditingIntervals] = useState(false);
  const [editingIntervals, setEditingIntervals] = useState<AreaInterval[]>(intervals);
  const [areaDraft, setAreaDraft] = useState("");

  const currentLevel = area !== null ? calculateAreaLevel(area, intervals) : null;

  useEffect(() => {
    if (!allowEditIntervals && isEditingIntervals) {
      setIsEditingIntervals(false);
    }
  }, [allowEditIntervals, isEditingIntervals]);

  useEffect(() => {
    setEditingIntervals(intervals);
  }, [intervals]);

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
      const level = calculateAreaLevel(area, editingIntervals);
      onLevelChange(level);
    }
  };

  const handleCancelEdit = () => {
    setEditingIntervals(intervals);
    setIsEditingIntervals(false);
  };

  const updateInterval = (index: number, field: "min" | "max", value: number | null) => {
    const updated = [...editingIntervals];
    updated[index] = { ...updated[index], [field]: value };
    setEditingIntervals(updated);
  };

  const parseAreaValue = (raw: string) => {
    const parsed = parsePtBrNumber(raw);
    return parsed !== null && parsed >= 0 ? parsed : 0;
  };

  useEffect(() => {
    setAreaDraft(typeof area === "number" && area > 0 ? formatArea(area) : "");
  }, [area]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm transition-colors transition-shadow duration-150 hover:border-slate-300 hover:shadow-sm sm:p-6">
      <div className="mb-4">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="flex items-center gap-1.5 font-semibold text-slate-900">
            Área de projeto
            <Tooltip text="Estimativa da metragem total de intervenção. Impacta diretamente o volume de trabalho — quanto maior a área, maior a escala do projeto." />
          </h3>
          {showAutoLevelBadge && currentLevel ? (
            <span className="shrink-0 rounded-md border border-calcularq-blue/20 bg-calcularq-blue/10 px-2 py-1 text-xs text-calcularq-blue">
              Nível {currentLevel}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-slate-500">Estimativa da metragem total de intervenção.</p>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-slate-700">Área de projeto (m²)</label>
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
          className="w-full rounded-lg border border-slate-300 px-3 py-3 focus:border-calcularq-blue focus:outline-none focus:ring-2 focus:ring-calcularq-blue/20"
          placeholder="Digite a área em m²"
        />
        {showAutoLevelBadge && currentLevel ? (
          <p className="mt-2 text-xs text-slate-500">
            Classificado automaticamente como <strong>Nível {currentLevel}</strong>
          </p>
        ) : null}
      </div>

      {showIntervals ? (
        <div className="border-t border-slate-200 pt-4">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-slate-700">Régua de intervalos</span>
            {allowEditIntervals ? (
              !isEditingIntervals ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingIntervals(true)}
                  className="flex items-center gap-2 self-start"
                >
                  <Edit2 className="h-4 w-4" />
                  Editar
                </Button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveIntervals}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Salvar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              )
            ) : null}
          </div>

          <div className="mb-3 rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-700">
            {allowEditIntervals
              ? "Os intervalos abaixo são a sugestão padrão do sistema. Você pode ajustá-los para adequar à realidade do seu escritório."
              : "Os intervalos abaixo seguem a regra interna da calculadora demo e são usados para classificar a área automaticamente."}
          </div>

          <div className="space-y-2">
            {(isEditingIntervals ? editingIntervals : intervals).map((interval, index) => (
              <div key={index} className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 sm:flex-nowrap">
                <span className="w-16 text-xs font-medium text-slate-600">Nível {interval.level}:</span>
                {isEditingIntervals && allowEditIntervals ? (
                  <>
                    <input
                      type="number"
                      min="0"
                      value={interval.min}
                      onChange={(e) => updateInterval(index, "min", Number(e.target.value))}
                      className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                    />
                    <span className="text-xs text-slate-500">a</span>
                    <input
                      type="number"
                      min="0"
                      value={interval.max || ""}
                      onChange={(e) => updateInterval(index, "max", e.target.value ? Number(e.target.value) : null)}
                      className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
                      placeholder="∞"
                    />
                    <span className="text-xs text-slate-500">m²</span>
                  </>
                ) : (
                  <span className="text-sm text-slate-700">
                    {interval.min} {interval.max === null ? "ou mais" : `a ${interval.max}`} m²
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

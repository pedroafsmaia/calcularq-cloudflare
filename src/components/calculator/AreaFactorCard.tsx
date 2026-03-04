import { useEffect, useState } from "react";
import { AreaInterval, calculateAreaLevel } from "../pricing/PricingEngine";
import Tooltip from "@/components/ui/Tooltip";
import { formatNumberPtBr, parsePtBrNumber, sanitizeNumberDraft } from "@/lib/numberFormat";
import { getManualFactorTooltip } from "@/lib/manualFactorGuides";

interface AreaFactorCardProps {
  area: number | null;
  onAreaChange: (area: number) => void;
  onLevelChange: (level: number) => void;
  volumetryLevel?: number;
  onVolumetryChange?: (level: number) => void;
  intervals: AreaInterval[];
}

const VOLUMETRY_OPTIONS = [
  { value: 1, label: "1 nível (plano)" },
  { value: 2, label: "2-3 níveis" },
  { value: 3, label: "4-6 níveis" },
  { value: 4, label: "7-15 níveis" },
  { value: 5, label: "16+ níveis" },
] as const;

export default function AreaFactorCard({
  area,
  onAreaChange,
  onLevelChange,
  volumetryLevel,
  onVolumetryChange,
  intervals,
}: AreaFactorCardProps) {
  const [areaDraft, setAreaDraft] = useState("");
  const currentLevel = area !== null ? calculateAreaLevel(area, intervals) : null;
  const volumeTooltipText = getManualFactorTooltip("volume");

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
            Volume do Projeto
            {volumeTooltipText ? <Tooltip text={volumeTooltipText} /> : null}
          </h3>
          {currentLevel ? (
            <span className="shrink-0 rounded-md border border-calcularq-blue/20 bg-calcularq-blue/10 px-2 py-1 text-xs text-calcularq-blue">
              Nível {currentLevel}
            </span>
          ) : null}
        </div>
        <p className="text-sm text-slate-500">Área total de intervenção e volumetria do projeto.</p>
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-slate-700">Área (m²)</label>
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
      </div>

      <div>
        <p className="mb-2 block text-sm font-medium text-slate-700">Níveis do projeto</p>
        <div className="space-y-2">
          {VOLUMETRY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={[
                "flex items-start gap-3 rounded-xl border-2 bg-white p-3 transition-colors",
                volumetryLevel === option.value
                  ? "border-calcularq-blue shadow-sm"
                  : "border-slate-200 hover:border-calcularq-blue/40",
              ].join(" ")}
            >
              <input
                type="radio"
                name="volumetry"
                value={option.value}
                checked={volumetryLevel === option.value}
                onChange={() => onVolumetryChange?.(option.value)}
                className="mt-0.5 h-4 w-4 text-calcularq-blue focus:ring-calcularq-blue"
              />
              <span className="text-sm font-medium text-slate-900">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import type { AdminFilters } from "@/types/admin";

const TIPOLOGIA_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "residencial", label: "Residencial" },
  { value: "comercial", label: "Comercial" },
  { value: "institucional", label: "Institucional" },
  { value: "industrial", label: "Industrial" },
  { value: "saude", label: "Saúde" },
];

const REFORMA_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "true", label: "Sim" },
  { value: "false", label: "Não" },
];

const CLOSE_STATUS_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "closed", label: "Fechado" },
  { value: "not_closed", label: "Não fechado" },
];

interface AdminFiltersBarProps {
  onApply: (filters: AdminFilters) => void;
}

export default function AdminFiltersBar({ onApply }: AdminFiltersBarProps) {
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [tipologia, setTipologia] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [feedbackOnly, setFeedbackOnly] = useState(false);
  const [reforma, setReforma] = useState("");
  const [closeStatus, setCloseStatus] = useState("");

  function handleApply() {
    const filters: AdminFilters = {};
    if (periodStart) filters.period_start = periodStart;
    if (periodEnd) filters.period_end = periodEnd;
    if (tipologia) filters.tipologia = tipologia;
    if (areaMin) filters.area_min = areaMin;
    if (areaMax) filters.area_max = areaMax;
    if (feedbackOnly) filters.feedback_only = "true";
    if (reforma) filters.reforma = reforma;
    if (closeStatus) filters.close_status = closeStatus;
    onApply(filters);
  }

  function handleClear() {
    setPeriodStart("");
    setPeriodEnd("");
    setTipologia("");
    setAreaMin("");
    setAreaMax("");
    setFeedbackOnly(false);
    setReforma("");
    setCloseStatus("");
    onApply({});
  }

  const selectClass =
    "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-calcularq-blue focus:outline-none focus:ring-1 focus:ring-calcularq-blue";
  const inputClass = selectClass;
  const labelClass = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="mb-3 text-sm font-semibold text-slate-700">Filtros</p>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {/* Period */}
        <div>
          <label htmlFor="filter-period-start" className={labelClass}>Período (de)</label>
          <input
            id="filter-period-start"
            type="date"
            className={inputClass}
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="filter-period-end" className={labelClass}>Período (até)</label>
          <input
            id="filter-period-end"
            type="date"
            className={inputClass}
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </div>

        {/* Tipologia */}
        <div>
          <label htmlFor="filter-tipologia" className={labelClass}>Tipologia</label>
          <select
            id="filter-tipologia"
            className={selectClass}
            value={tipologia}
            onChange={(e) => setTipologia(e.target.value)}
          >
            {TIPOLOGIA_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Area range */}
        <div>
          <label htmlFor="filter-area-min" className={labelClass}>Área mínima (m²)</label>
          <input
            id="filter-area-min"
            type="number"
            min={0}
            className={inputClass}
            placeholder="0"
            value={areaMin}
            onChange={(e) => setAreaMin(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="filter-area-max" className={labelClass}>Área máxima (m²)</label>
          <input
            id="filter-area-max"
            type="number"
            min={0}
            className={inputClass}
            placeholder="∞"
            value={areaMax}
            onChange={(e) => setAreaMax(e.target.value)}
          />
        </div>

        {/* Reforma */}
        <div>
          <label htmlFor="filter-reforma" className={labelClass}>Reforma</label>
          <select
            id="filter-reforma"
            className={selectClass}
            value={reforma}
            onChange={(e) => setReforma(e.target.value)}
          >
            {REFORMA_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Close Status */}
        <div>
          <label htmlFor="filter-close-status" className={labelClass}>Status de fechamento</label>
          <select
            id="filter-close-status"
            className={selectClass}
            value={closeStatus}
            onChange={(e) => setCloseStatus(e.target.value)}
          >
            {CLOSE_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Feedback only */}
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={feedbackOnly}
              onChange={(e) => setFeedbackOnly(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-calcularq-blue focus:ring-calcularq-blue"
            />
            Somente com feedback
          </label>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleApply}
          className="rounded-lg bg-calcularq-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#002366] focus:outline-none focus:ring-2 focus:ring-calcularq-blue focus:ring-offset-2"
        >
          Aplicar filtros
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-2"
        >
          Limpar
        </button>
      </div>
    </div>
  );
}

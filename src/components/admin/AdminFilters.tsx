import { useEffect, useMemo, useState } from "react";
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
  filters: AdminFilters;
  onApply: (filters: AdminFilters) => void;
}

export default function AdminFiltersBar({ filters, onApply }: AdminFiltersBarProps) {
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [tipologia, setTipologia] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [feedbackOnly, setFeedbackOnly] = useState(false);
  const [reforma, setReforma] = useState("");
  const [closeStatus, setCloseStatus] = useState("");

  useEffect(() => {
    setPeriodStart(filters.period_start || "");
    setPeriodEnd(filters.period_end || "");
    setTipologia(filters.tipologia || "");
    setAreaMin(filters.area_min || "");
    setAreaMax(filters.area_max || "");
    setFeedbackOnly(filters.feedback_only === "true");
    setReforma(filters.reforma || "");
    setCloseStatus(filters.close_status || "");
  }, [filters]);

  const activeCount = useMemo(
    () =>
      [periodStart, periodEnd, tipologia, areaMin, areaMax, reforma, closeStatus].filter(Boolean).length +
      (feedbackOnly ? 1 : 0),
    [areaMax, areaMin, closeStatus, feedbackOnly, periodEnd, periodStart, reforma, tipologia]
  );

  function handleApply() {
    const nextFilters: AdminFilters = {};
    if (periodStart) nextFilters.period_start = periodStart;
    if (periodEnd) nextFilters.period_end = periodEnd;
    if (tipologia) nextFilters.tipologia = tipologia;
    if (areaMin) nextFilters.area_min = areaMin;
    if (areaMax) nextFilters.area_max = areaMax;
    if (feedbackOnly) nextFilters.feedback_only = "true";
    if (reforma) nextFilters.reforma = reforma;
    if (closeStatus) nextFilters.close_status = closeStatus;
    onApply(nextFilters);
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

  const inputBase =
    "block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-calcularq-blue focus:outline-none focus:ring-1 focus:ring-calcularq-blue";
  const labelBase = "block text-xs font-medium text-slate-600 mb-1";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-700">
          Filtros
          {activeCount > 0 ? (
            <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {activeCount} ativos
            </span>
          ) : null}
        </p>

        <button
          type="button"
          onClick={() => setIsMobileExpanded((prev) => !prev)}
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm sm:hidden"
        >
          {isMobileExpanded ? "Ocultar filtros" : "Mostrar filtros"}
        </button>
      </div>

      <div className={`mt-4 ${isMobileExpanded ? "block" : "hidden"} sm:block`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-12">
          <div className="xl:col-span-2">
            <label htmlFor="filter-period-start" className={labelBase}>Período (de)</label>
            <input
              id="filter-period-start"
              type="date"
              className={inputBase}
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
          </div>

          <div className="xl:col-span-2">
            <label htmlFor="filter-period-end" className={labelBase}>Período (até)</label>
            <input
              id="filter-period-end"
              type="date"
              className={inputBase}
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
          </div>

          <div className="xl:col-span-2">
            <label htmlFor="filter-tipologia" className={labelBase}>Tipologia</label>
            <select
              id="filter-tipologia"
              className={inputBase}
              value={tipologia}
              onChange={(e) => setTipologia(e.target.value)}
            >
              {TIPOLOGIA_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="xl:col-span-1">
            <label htmlFor="filter-area-min" className={labelBase}>Área min. (m²)</label>
            <input
              id="filter-area-min"
              type="number"
              min={0}
              className={inputBase}
              placeholder="0"
              value={areaMin}
              onChange={(e) => setAreaMin(e.target.value)}
            />
          </div>

          <div className="xl:col-span-1">
            <label htmlFor="filter-area-max" className={labelBase}>Área máx. (m²)</label>
            <input
              id="filter-area-max"
              type="number"
              min={0}
              className={inputBase}
              placeholder="∞"
              value={areaMax}
              onChange={(e) => setAreaMax(e.target.value)}
            />
          </div>

          <div className="xl:col-span-2">
            <label htmlFor="filter-reforma" className={labelBase}>Reforma</label>
            <select
              id="filter-reforma"
              className={inputBase}
              value={reforma}
              onChange={(e) => setReforma(e.target.value)}
            >
              {REFORMA_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="xl:col-span-2">
            <label htmlFor="filter-close-status" className={labelBase}>Status de fechamento</label>
            <select
              id="filter-close-status"
              className={inputBase}
              value={closeStatus}
              onChange={(e) => setCloseStatus(e.target.value)}
            >
              {CLOSE_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3 xl:flex-nowrap">
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

          <div className="flex flex-wrap items-end gap-3">
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
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "@/lib/api";
import type {
  AdminCalibrationData,
  AdminCommercialData,
  AdminFilters,
  AdminSummaryData,
  AdminTab,
  AdminUsageData,
} from "@/types/admin";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingState } from "@/components/ui/LoadingStates";
import { createPageUrl } from "@/utils";
import AdminFiltersBar from "@/components/admin/AdminFilters";
import AdminExport from "@/components/admin/AdminExport";

function fmtNum(v: number | null | undefined): string {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR");
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return "—";
  return `${(v * 100).toFixed(1)}%`;
}

function fmtCurrency(v: number | null | undefined): string {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtRatio(v: number | null | undefined): string {
  if (v == null) return "—";
  return v.toFixed(2);
}

function fmtDateTime(value: Date | null): string {
  if (!value) return "—";
  return value.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function adherenceColor(v: number | null | undefined): string {
  if (v == null) return "text-slate-400";
  if (v >= 0.85 && v <= 1.15) return "text-green-600";
  if ((v >= 0.7 && v < 0.85) || (v > 1.15 && v <= 1.3)) return "text-amber-500";
  return "text-red-500";
}

function diffColor(diff: number | null | undefined): string {
  if (diff == null) return "text-slate-400";
  const abs = Math.abs(diff);
  if (abs <= 0.05) return "text-green-600";
  if (diff > 0) return "text-orange-500";
  return "text-blue-500";
}

function diffLabel(diff: number | null | undefined): string {
  if (diff == null) return "—";
  const abs = Math.abs(diff);
  if (abs <= 0.05) return "Bem alinhado";
  const pct = `${(abs * 100).toFixed(1)}%`;
  if (diff > 0) return `${pct} a mais que o real`;
  return `${pct} a menos que o real`;
}

const FEEDBACK_LABELS: Record<string, string> = {
  too_expensive: "Muito caro",
  accepted_no_questions: "Aceito sem questionar",
  accepted_after_negotiation: "Aceito apos negociacao",
  could_charge_more: "Poderia cobrar mais",
  did_not_close_other: "Nao fechou (outros motivos)",
};

interface TabDef {
  id: AdminTab;
  label: string;
  v2?: boolean;
}

const TABS: TabDef[] = [
  { id: "resumo", label: "Resumo" },
  { id: "uso", label: "Uso" },
  { id: "comercial", label: "Comercial" },
  { id: "calibracao", label: "Calibracao" },
  { id: "exportacao", label: "Exportacao" },
  { id: "tendencias", label: "Tendencias", v2: true },
  { id: "alertas", label: "Alertas", v2: true },
  { id: "segmentacao", label: "Segmentacao", v2: true },
  { id: "evolucao", label: "Evolucao", v2: true },
];

const PRIMARY_TABS = TABS.filter((tab) => !tab.v2);
const SECONDARY_TABS = TABS.filter((tab) => tab.v2);

function StatCard({
  title,
  value,
  legend,
  className,
  badge,
}: {
  title: string;
  value: string;
  legend: string;
  className?: string;
  badge?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>
        {badge ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">{badge}</span>
        ) : null}
      </div>
      <p className={`mt-2 text-3xl font-bold ${className ?? "text-calcularq-blue"}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{legend}</p>
    </div>
  );
}

function HorizontalBar({ label, count, maxCount }: { label: string; count: number; maxCount: number }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 truncate text-sm text-slate-700" title={label}>{label}</span>
      <div className="h-5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-calcularq-blue/70 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-12 text-right text-sm font-medium text-slate-600">{fmtNum(count)}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-base font-semibold text-slate-800">{children}</h3>;
}

function ComparisonTable({
  title,
  data,
}: {
  title: string;
  data: Record<string, { suggested: number | null; actual: number | null; diff: number | null }>;
}) {
  const entries = Object.entries(data);
  if (entries.length === 0) return null;
  return (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="px-3 py-2 text-left font-medium text-slate-600">Categoria</th>
              <th className="px-3 py-2 text-right font-medium text-slate-600">Sugerido</th>
              <th className="px-3 py-2 text-right font-medium text-slate-600">Real</th>
              <th className="px-3 py-2 text-right font-medium text-slate-600">Diferenca</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, val], i) => (
              <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="px-3 py-2 text-slate-700">{key}</td>
                <td className="px-3 py-2 text-right text-slate-600">{fmtNum(val.suggested)}</td>
                <td className="px-3 py-2 text-right text-slate-600">{fmtNum(val.actual)}</td>
                <td className={`px-3 py-2 text-right font-medium ${diffColor(val.diff)}`}>{diffLabel(val.diff)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function V2Placeholder() {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
      <p className="text-lg font-medium text-slate-400">Em desenvolvimento</p>
      <p className="mt-1 text-sm text-slate-400">Esta secao sera implementada na proxima versao</p>
    </div>
  );
}

function TabResumo({ summary }: { summary: AdminSummaryData | null }) {
  if (!summary) return <p className="text-sm text-slate-500">Sem dados disponiveis.</p>;

  const hasFeedback = summary.totalFeedbacks > 0;
  const cards = [
    {
      title: "Total de usuarios",
      value: fmtNum(summary.totalUsers),
      legend: "Quantidade de contas registradas no sistema",
    },
    {
      title: "Usuarios pagantes",
      value: fmtNum(summary.totalPaidUsers),
      legend: "Usuarios que completaram o pagamento",
    },
    {
      title: "Calculos salvos",
      value: fmtNum(summary.totalBudgets),
      legend: "Total de orcamentos criados por todos os usuarios",
    },
    {
      title: "Feedbacks registrados",
      value: fmtNum(summary.totalFeedbacks),
      legend: "Projetos que tiveram retorno sobre resultado real",
      badge: hasFeedback ? "Com base" : "Sem base",
    },
    {
      title: "Taxa de feedback",
      value: fmtPct(summary.feedbackRate),
      legend: "Proporcao de calculos com retorno real",
      badge: hasFeedback ? "Com base" : "Sem base",
    },
    {
      title: "Taxa de fechamento",
      value: fmtPct(summary.closingRate),
      legend: "Proporcao de projetos aceitos pelo cliente",
      badge: hasFeedback ? "Com base" : "Sem base",
    },
    {
      title: "Aderencia de horas",
      value: fmtRatio(summary.hoursAdherence),
      legend: hasFeedback
        ? "Relacao entre horas reais e horas sugeridas (1.0 = perfeito)"
        : "Sem feedback suficiente para calcular aderencia",
      className: adherenceColor(summary.hoursAdherence),
      badge: hasFeedback ? "Com base" : "Sem base",
    },
    {
      title: "Aderencia de preco",
      value: fmtRatio(summary.priceAdherence),
      legend: hasFeedback
        ? "Relacao entre valor fechado e sugerido (1.0 = perfeito)"
        : "Sem feedback suficiente para calcular aderencia",
      className: adherenceColor(summary.priceAdherence),
      badge: hasFeedback ? "Com base" : "Sem base",
    },
  ];

  return (
    <div className="space-y-4">
      {!hasFeedback ? (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <p className="font-medium">Ainda nao ha feedbacks reais suficientes.</p>
          <p className="mt-1 text-blue-800">
            Registre fechamento de projetos em "Meus calculos" para destravar calibracao e aderencia.
          </p>
        </div>
      ) : null}

      <div className="-mx-1 overflow-x-auto pb-2 md:hidden">
        <div className="flex snap-x snap-mandatory gap-3 px-1">
          {cards.map((card) => (
            <div key={card.title} className="min-w-[280px] snap-start">
              <StatCard {...card} />
            </div>
          ))}
        </div>
      </div>

      <div className="hidden gap-4 sm:grid-cols-2 lg:grid-cols-4 md:grid">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
}

function TabUso({ usage }: { usage: AdminUsageData | null }) {
  if (!usage) return <p className="text-sm text-slate-500">Sem dados disponiveis.</p>;

  const tipEntries = Object.entries(usage.tipologiaDistribution);
  const tipMax = Math.max(...tipEntries.map(([, v]) => v), 1);

  const areaEntries = Object.entries(usage.areaDistribution);
  const areaMax = Math.max(...areaEntries.map(([, v]) => v), 1);

  const volEntries = Object.entries(usage.volumetriaDistribution);
  const volMax = Math.max(...volEntries.map(([, v]) => v), 1);

  const monthEntries = Object.entries(usage.monthlyEvolution);

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Tipologias mais usadas</SectionTitle>
        <div className="space-y-2">
          {tipEntries.map(([label, count]) => (
            <HorizontalBar key={label} label={label} count={count} maxCount={tipMax} />
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Faixas de area</SectionTitle>
        <div className="space-y-2">
          {areaEntries.map(([label, count]) => (
            <HorizontalBar key={label} label={label} count={count} maxCount={areaMax} />
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {(["f3Distribution", "f4Distribution", "f5Distribution"] as const).map((key) => {
          const label = key.replace("Distribution", "").toUpperCase();
          const entries = Object.entries(usage[key]);
          return (
            <div key={key}>
              <SectionTitle>Distribuicao de {label}</SectionTitle>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="px-3 py-2 text-left font-medium text-slate-600">Valor</th>
                      <th className="px-3 py-2 text-right font-medium text-slate-600">Contagem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(([k, v], i) => (
                      <tr key={k} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-3 py-2 text-slate-700">{k}</td>
                        <td className="px-3 py-2 text-right text-slate-600">{fmtNum(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <SectionTitle>Distribuicao de volumetria</SectionTitle>
        <div className="space-y-2">
          {volEntries.map(([label, count]) => (
            <HorizontalBar key={label} label={label} count={count} maxCount={volMax} />
          ))}
        </div>
      </div>

      <div>
        <SectionTitle>Reforma vs Obra Nova</SectionTitle>
        <div className="grid max-w-md gap-4 sm:grid-cols-2">
          <StatCard title="Reforma" value={fmtNum(usage.reformaDistribution.reforma)} legend="Projetos de reforma" />
          <StatCard title="Obra Nova" value={fmtNum(usage.reformaDistribution.novaObra)} legend="Projetos de obra nova" />
        </div>
      </div>

      <div>
        <SectionTitle>Evolucao mensal</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-3 py-2 text-left font-medium text-slate-600">Mes</th>
                <th className="px-3 py-2 text-right font-medium text-slate-600">Calculos</th>
              </tr>
            </thead>
            <tbody>
              {monthEntries.map(([k, v], i) => (
                <tr key={k} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="px-3 py-2 text-slate-700">{k}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{fmtNum(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TabComercial({ commercial }: { commercial: AdminCommercialData | null }) {
  if (!commercial) return <p className="text-sm text-slate-500">Sem dados disponiveis.</p>;

  const priceEntries = Object.entries(commercial.pricePerSqmByTipologia);
  const feedbackEntries = Object.entries(commercial.feedbackDistribution);
  const feedbackMax = Math.max(...feedbackEntries.map(([, v]) => v), 1);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Preco medio sugerido" value={fmtCurrency(commercial.avgSuggestedPrice)} legend="Valor medio calculado pelo metodo" />
        <StatCard title="Preco medio fechado" value={fmtCurrency(commercial.avgClosedPrice)} legend="Valor medio informado como fechado" />
        <StatCard title="Diferenca media" value={fmtCurrency(commercial.avgDifference)} legend="Diferenca entre sugerido e fechado" />
        <StatCard title="Desconto medio" value={fmtPct(commercial.avgDiscount)} legend="Desconto medio aplicado" />
      </div>

      <div>
        <SectionTitle>R$/m² por tipologia</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-3 py-2 text-left font-medium text-slate-600">Tipologia</th>
                <th className="px-3 py-2 text-right font-medium text-slate-600">Sugerido (R$/m²)</th>
                <th className="px-3 py-2 text-right font-medium text-slate-600">Fechado (R$/m²)</th>
              </tr>
            </thead>
            <tbody>
              {priceEntries.map(([key, val], i) => (
                <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="px-3 py-2 text-slate-700">{key}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{fmtCurrency(val.suggested)}</td>
                  <td className="px-3 py-2 text-right text-slate-600">{fmtCurrency(val.closed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <SectionTitle>Distribuicao de feedbacks</SectionTitle>
        <div className="space-y-2">
          {feedbackEntries.map(([key, count]) => (
            <HorizontalBar key={key} label={FEEDBACK_LABELS[key] ?? key} count={count} maxCount={feedbackMax} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TabCalibracao({ calibration }: { calibration: AdminCalibrationData | null }) {
  if (!calibration) return <p className="text-sm text-slate-500">Sem dados disponiveis.</p>;

  const hc = calibration.hoursComparison;

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle>Comparacao de horas</SectionTitle>
        <div className="grid max-w-2xl gap-4 sm:grid-cols-3">
          <StatCard title="Horas sugeridas" value={fmtNum(hc.suggested)} legend="Media de horas do metodo" />
          <StatCard title="Horas reais" value={fmtNum(hc.actual)} legend="Media de horas informadas" />
          <StatCard title="Diferenca" value={diffLabel(hc.difference)} legend="Desvio entre sugerido e real" className={diffColor(hc.difference)} />
        </div>
      </div>

      <ComparisonTable title="Diferenca por tipologia" data={calibration.differenceByTipologia} />
      <ComparisonTable title="Diferenca por faixa de area" data={calibration.differenceByAreaRange} />
      <ComparisonTable title="Diferenca por F3" data={calibration.differenceByF3} />
      <ComparisonTable title="Diferenca por F4" data={calibration.differenceByF4} />
      <ComparisonTable title="Diferenca por F5" data={calibration.differenceByF5} />

      <div>
        <SectionTitle>Diferenca por reforma</SectionTitle>
        <div className="grid max-w-lg gap-4 sm:grid-cols-2">
          {Object.entries(calibration.differenceByReforma).map(([key, val]) => (
            <StatCard
              key={key}
              title={key}
              value={diffLabel(val.diff)}
              legend={`Sugerido: ${fmtNum(val.suggested)} · Real: ${fmtNum(val.actual)}`}
              className={diffColor(val.diff)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

type FilterChip = {
  key: keyof AdminFilters;
  label: string;
};

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("resumo");
  const [filters, setFilters] = useState<AdminFilters>({});

  const [summary, setSummary] = useState<AdminSummaryData | null>(null);
  const [usage, setUsage] = useState<AdminUsageData | null>(null);
  const [commercial, setCommercial] = useState<AdminCommercialData | null>(null);
  const [calibration, setCalibration] = useState<AdminCalibrationData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);

  const activeFilterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (filters.period_start) chips.push({ key: "period_start", label: `De ${filters.period_start}` });
    if (filters.period_end) chips.push({ key: "period_end", label: `Ate ${filters.period_end}` });
    if (filters.tipologia) chips.push({ key: "tipologia", label: `Tipologia: ${filters.tipologia}` });
    if (filters.area_min) chips.push({ key: "area_min", label: `Area min: ${filters.area_min}m²` });
    if (filters.area_max) chips.push({ key: "area_max", label: `Area max: ${filters.area_max}m²` });
    if (filters.reforma) chips.push({ key: "reforma", label: `Reforma: ${filters.reforma === "true" ? "Sim" : "Nao"}` });
    if (filters.close_status) chips.push({ key: "close_status", label: `Status: ${filters.close_status}` });
    if (filters.feedback_only === "true") chips.push({ key: "feedback_only", label: "Somente feedback" });
    return chips;
  }, [filters]);

  const fetchData = useCallback(async (f: AdminFilters) => {
    setLoading(true);
    setError(null);

    const [sumRes, useRes, comRes, calRes] = await Promise.allSettled([
      api.getAdminSummary(f),
      api.getAdminUsage(f),
      api.getAdminCommercial(f),
      api.getAdminCalibration(f),
    ]);

    const failures = [sumRes, useRes, comRes, calRes].filter((r) => r.status === "rejected");

    if (sumRes.status === "fulfilled" && sumRes.value.success) setSummary(sumRes.value.data);
    if (useRes.status === "fulfilled" && useRes.value.success) setUsage(useRes.value.data);
    if (comRes.status === "fulfilled" && comRes.value.success) setCommercial(comRes.value.data);
    if (calRes.status === "fulfilled" && calRes.value.success) setCalibration(calRes.value.data);

    if (failures.length < 4) {
      setLastUpdatedAt(new Date());
    }

    if (failures.length === 4) {
      setError("Erro ao carregar dados do dashboard. Tente novamente.");
    } else if (failures.length > 0) {
      setError("Algumas secoes nao puderam ser carregadas. Revise os filtros e tente novamente.");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchData(filters);
    }
  }, [user, filters, fetchData]);

  if (authLoading) return <PageLoadingState label="Verificando permissoes..." />;
  if (!user) return <Navigate to={createPageUrl("Login")} replace />;
  if (!user.isAdmin) return <Navigate to={createPageUrl("Calculator")} replace />;

  function handleApplyFilters(newFilters: AdminFilters) {
    setFilters(newFilters);
  }

  function handleRemoveFilter(key: keyof AdminFilters) {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  const activeTabDef = TABS.find((t) => t.id === activeTab);
  const hasAnyData = !!(summary || usage || commercial || calibration);
  const activeSecondaryTab = SECONDARY_TABS.some((tab) => tab.id === activeTab) ? activeTab : "";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-calcularq-blue sm:text-3xl">Dashboard Administrativo</h1>
          <p className="mt-1 text-sm text-slate-500">Visao geral do uso, resultados comerciais e calibracao do metodo Calcularq.</p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-1">Ultima atualizacao: {fmtDateTime(lastUpdatedAt)}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1">Filtros ativos: {activeFilterChips.length}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1">Periodo: {filters.period_start || "inicio"} ate {filters.period_end || "hoje"}</span>
          </div>
        </div>

        <div className="mb-4">
          <AdminFiltersBar filters={filters} onApply={handleApplyFilters} />
        </div>

        {activeFilterChips.length > 0 ? (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {activeFilterChips.map((chip) => (
              <button
                key={`${chip.key}:${chip.label}`}
                type="button"
                onClick={() => handleRemoveFilter(chip.key)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                title="Remover filtro"
              >
                {chip.label} ×
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFilters({})}
              className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50"
            >
              Limpar todos
            </button>
          </div>
        ) : null}

        <div className="mb-6 overflow-x-auto">
          <nav className="flex items-center gap-1 border-b border-slate-200 pb-1" aria-label="Abas do dashboard">
            {PRIMARY_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative shrink-0 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-calcularq-blue focus-visible:ring-offset-2 ${
                  activeTab === tab.id
                    ? "border-b-2 border-calcularq-blue bg-white text-calcularq-blue"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}

            <div className="ml-auto min-w-[180px]">
              <select
                aria-label="Secoes secundarias"
                value={activeSecondaryTab}
                onChange={(e) => {
                  const next = e.target.value as AdminTab;
                  if (next) setActiveTab(next);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600"
              >
                <option value="">Mais secoes (em breve)</option>
                {SECONDARY_TABS.map((tab) => (
                  <option key={tab.id} value={tab.id}>{tab.label}</option>
                ))}
              </select>
            </div>
          </nav>
        </div>

        {loading ? (
          <PageLoadingState label="Carregando dados..." compact />
        ) : (
          <>
            {error ? (
              <div className={`mb-4 rounded-xl border p-4 text-sm ${hasAnyData ? "border-amber-200 bg-amber-50 text-amber-800" : "border-red-200 bg-red-50 text-red-700"}`}>
                <p className="font-medium">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchData(filters)}
                  className={`mt-3 rounded-lg px-4 py-2 text-sm font-medium ${hasAnyData ? "bg-amber-600 text-white hover:bg-amber-700" : "bg-red-600 text-white hover:bg-red-700"}`}
                >
                  Tentar novamente
                </button>
              </div>
            ) : null}

            {hasAnyData ? (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                {activeTab === "resumo" && <TabResumo summary={summary} />}
                {activeTab === "uso" && <TabUso usage={usage} />}
                {activeTab === "comercial" && <TabComercial commercial={commercial} />}
                {activeTab === "calibracao" && <TabCalibracao calibration={calibration} />}
                {activeTab === "exportacao" && (
                  <AdminExport
                    filters={filters}
                    summary={summary}
                    usage={usage}
                    commercial={commercial}
                    calibration={calibration}
                  />
                )}
                {activeTabDef?.v2 ? <V2Placeholder /> : null}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                Sem dados disponiveis para os filtros atuais.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


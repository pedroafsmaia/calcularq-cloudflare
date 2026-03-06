import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { api } from "@/lib/api";
import type {
  AdminSummaryData,
  AdminUsageData,
  AdminCommercialData,
  AdminCalibrationData,
  AdminFilters,
  AdminTab,
} from "@/types/admin";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingState } from "@/components/ui/LoadingStates";
import { createPageUrl } from "@/utils";
import AdminFiltersBar from "@/components/admin/AdminFilters";
import AdminExport from "@/components/admin/AdminExport";

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                 */
/* ------------------------------------------------------------------ */

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
  accepted_after_negotiation: "Aceito após negociação",
  could_charge_more: "Poderia cobrar mais",
  did_not_close_other: "Não fechou (outros motivos)",
};

/* ------------------------------------------------------------------ */
/*  Tab definitions                                                    */
/* ------------------------------------------------------------------ */

interface TabDef {
  id: AdminTab;
  label: string;
  v2?: boolean;
}

const TABS: TabDef[] = [
  { id: "resumo", label: "Resumo" },
  { id: "uso", label: "Uso" },
  { id: "comercial", label: "Comercial" },
  { id: "calibracao", label: "Calibração" },
  { id: "exportacao", label: "Exportação" },
  { id: "tendencias", label: "Tendências", v2: true },
  { id: "alertas", label: "Alertas", v2: true },
  { id: "segmentacao", label: "Segmentação", v2: true },
  { id: "evolucao", label: "Evolução", v2: true },
];

/* ------------------------------------------------------------------ */
/*  Reusable sub-components                                            */
/* ------------------------------------------------------------------ */

function StatCard({ title, value, legend, className }: { title: string; value: string; legend: string; className?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
      <p className={`mt-2 text-2xl font-bold ${className ?? "text-calcularq-blue"}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{legend}</p>
    </div>
  );
}

function HorizontalBar({ label, count, maxCount }: { label: string; count: number; maxCount: number }) {
  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-700 w-24 shrink-0 truncate" title={label}>{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
        <div
          className="bg-calcularq-blue/70 h-full rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-medium text-slate-600 w-12 text-right">{fmtNum(count)}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-slate-800 mb-3">{children}</h3>;
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
              <th className="text-left py-2 px-3 font-medium text-slate-600">Categoria</th>
              <th className="text-right py-2 px-3 font-medium text-slate-600">Sugerido</th>
              <th className="text-right py-2 px-3 font-medium text-slate-600">Real</th>
              <th className="text-right py-2 px-3 font-medium text-slate-600">Diferença</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(([key, val], i) => (
              <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="py-2 px-3 text-slate-700">{key}</td>
                <td className="py-2 px-3 text-right text-slate-600">{fmtNum(val.suggested)}</td>
                <td className="py-2 px-3 text-right text-slate-600">{fmtNum(val.actual)}</td>
                <td className={`py-2 px-3 text-right font-medium ${diffColor(val.diff)}`}>
                  {diffLabel(val.diff)}
                </td>
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
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 text-center">
      <p className="text-lg font-medium text-slate-400">Em desenvolvimento</p>
      <p className="text-sm text-slate-400 mt-1">Esta seção será implementada na próxima versão</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab content renderers                                              */
/* ------------------------------------------------------------------ */

function TabResumo({ summary }: { summary: AdminSummaryData | null }) {
  if (!summary) return <p className="text-sm text-slate-500">Sem dados disponíveis.</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Total de Usuários" value={fmtNum(summary.totalUsers)} legend="Quantidade de contas registradas no sistema" />
      <StatCard title="Usuários Pagantes" value={fmtNum(summary.totalPaidUsers)} legend="Usuários que completaram o pagamento" />
      <StatCard title="Cálculos Salvos" value={fmtNum(summary.totalBudgets)} legend="Total de orçamentos criados por todos os usuários" />
      <StatCard title="Feedbacks Registrados" value={fmtNum(summary.totalFeedbacks)} legend="Projetos que tiveram retorno sobre resultado real" />
      <StatCard title="Taxa de Feedback" value={fmtPct(summary.feedbackRate)} legend="Proporção de cálculos que receberam retorno do resultado real" />
      <StatCard title="Taxa de Fechamento" value={fmtPct(summary.closingRate)} legend="Proporção de projetos com feedback que foram aceitos pelo cliente" />
      <StatCard
        title="Aderência de Horas"
        value={fmtRatio(summary.hoursAdherence)}
        legend="Relação entre horas reais e horas sugeridas pelo método (1.0 = perfeito)"
        className={adherenceColor(summary.hoursAdherence)}
      />
      <StatCard
        title="Aderência de Preço"
        value={fmtRatio(summary.priceAdherence)}
        legend="Relação entre valor fechado e valor sugerido pelo método (1.0 = perfeito)"
        className={adherenceColor(summary.priceAdherence)}
      />
    </div>
  );
}

function TabUso({ usage }: { usage: AdminUsageData | null }) {
  if (!usage) return <p className="text-sm text-slate-500">Sem dados disponíveis.</p>;

  const tipEntries = Object.entries(usage.tipologiaDistribution);
  const tipMax = Math.max(...tipEntries.map(([, v]) => v), 1);

  const areaEntries = Object.entries(usage.areaDistribution);
  const areaMax = Math.max(...areaEntries.map(([, v]) => v), 1);

  const volEntries = Object.entries(usage.volumetriaDistribution);
  const volMax = Math.max(...volEntries.map(([, v]) => v), 1);

  const monthEntries = Object.entries(usage.monthlyEvolution);

  return (
    <div className="space-y-8">
      {/* Tipologia distribution */}
      <div>
        <SectionTitle>Tipologias mais usadas</SectionTitle>
        <div className="space-y-2">
          {tipEntries.map(([label, count]) => (
            <HorizontalBar key={label} label={label} count={count} maxCount={tipMax} />
          ))}
        </div>
      </div>

      {/* Area distribution */}
      <div>
        <SectionTitle>Faixas de área</SectionTitle>
        <div className="space-y-2">
          {areaEntries.map(([label, count]) => (
            <HorizontalBar key={label} label={label} count={count} maxCount={areaMax} />
          ))}
        </div>
      </div>

      {/* F3/F4/F5 distributions */}
      <div className="grid gap-6 md:grid-cols-3">
        {(["f3Distribution", "f4Distribution", "f5Distribution"] as const).map((key) => {
          const label = key.replace("Distribution", "").toUpperCase();
          const entries = Object.entries(usage[key]);
          return (
            <div key={key}>
              <SectionTitle>Distribuição de {label}</SectionTitle>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 font-medium text-slate-600">Valor</th>
                      <th className="text-right py-2 px-3 font-medium text-slate-600">Contagem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(([k, v], i) => (
                      <tr key={k} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="py-2 px-3 text-slate-700">{k}</td>
                        <td className="py-2 px-3 text-right text-slate-600">{fmtNum(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Volumetria */}
      <div>
        <SectionTitle>Distribuição de volumetria</SectionTitle>
        <div className="space-y-2">
          {volEntries.map(([label, count]) => (
            <HorizontalBar key={label} label={label} count={count} maxCount={volMax} />
          ))}
        </div>
      </div>

      {/* Reforma vs Obra Nova */}
      <div>
        <SectionTitle>Reforma vs Obra Nova</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 max-w-md">
          <StatCard title="Reforma" value={fmtNum(usage.reformaDistribution.reforma)} legend="Projetos de reforma" />
          <StatCard title="Obra Nova" value={fmtNum(usage.reformaDistribution.novaObra)} legend="Projetos de obra nova" />
        </div>
      </div>

      {/* Monthly evolution */}
      <div>
        <SectionTitle>Evolução mensal</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-medium text-slate-600">Mês</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">Cálculos</th>
              </tr>
            </thead>
            <tbody>
              {monthEntries.map(([k, v], i) => (
                <tr key={k} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="py-2 px-3 text-slate-700">{k}</td>
                  <td className="py-2 px-3 text-right text-slate-600">{fmtNum(v)}</td>
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
  if (!commercial) return <p className="text-sm text-slate-500">Sem dados disponíveis.</p>;

  const priceEntries = Object.entries(commercial.pricePerSqmByTipologia);
  const feedbackEntries = Object.entries(commercial.feedbackDistribution);
  const feedbackMax = Math.max(...feedbackEntries.map(([, v]) => v), 1);

  return (
    <div className="space-y-8">
      {/* Price summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Preço médio sugerido" value={fmtCurrency(commercial.avgSuggestedPrice)} legend="Valor médio calculado pelo método" />
        <StatCard title="Preço médio fechado" value={fmtCurrency(commercial.avgClosedPrice)} legend="Valor médio informado como fechado" />
        <StatCard title="Diferença média" value={fmtCurrency(commercial.avgDifference)} legend="Diferença entre sugerido e fechado" />
        <StatCard title="Desconto médio" value={fmtPct(commercial.avgDiscount)} legend="Desconto médio aplicado sobre o sugerido" />
      </div>

      {/* R$/m² by tipologia */}
      <div>
        <SectionTitle>R$/m² por tipologia</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 font-medium text-slate-600">Tipologia</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">Sugerido (R$/m²)</th>
                <th className="text-right py-2 px-3 font-medium text-slate-600">Fechado (R$/m²)</th>
              </tr>
            </thead>
            <tbody>
              {priceEntries.map(([key, val], i) => (
                <tr key={key} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="py-2 px-3 text-slate-700">{key}</td>
                  <td className="py-2 px-3 text-right text-slate-600">{fmtCurrency(val.suggested)}</td>
                  <td className="py-2 px-3 text-right text-slate-600">{fmtCurrency(val.closed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feedback distribution */}
      <div>
        <SectionTitle>Distribuição de feedbacks</SectionTitle>
        <div className="space-y-2">
          {feedbackEntries.map(([key, count]) => (
            <HorizontalBar
              key={key}
              label={FEEDBACK_LABELS[key] ?? key}
              count={count}
              maxCount={feedbackMax}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TabCalibracao({ calibration }: { calibration: AdminCalibrationData | null }) {
  if (!calibration) return <p className="text-sm text-slate-500">Sem dados disponíveis.</p>;

  const hc = calibration.hoursComparison;

  return (
    <div className="space-y-8">
      {/* Hours comparison */}
      <div>
        <SectionTitle>Comparação de horas</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3 max-w-2xl">
          <StatCard title="Horas sugeridas" value={fmtNum(hc.suggested)} legend="Média de horas calculada pelo método" />
          <StatCard title="Horas reais" value={fmtNum(hc.actual)} legend="Média de horas informadas pelo usuário" />
          <StatCard
            title="Diferença"
            value={diffLabel(hc.difference)}
            legend="Desvio entre sugerido e real"
            className={diffColor(hc.difference)}
          />
        </div>
      </div>

      <ComparisonTable title="Diferença por tipologia" data={calibration.differenceByTipologia} />
      <ComparisonTable title="Diferença por faixa de área" data={calibration.differenceByAreaRange} />
      <ComparisonTable title="Diferença por F3" data={calibration.differenceByF3} />
      <ComparisonTable title="Diferença por F4" data={calibration.differenceByF4} />
      <ComparisonTable title="Diferença por F5" data={calibration.differenceByF5} />

      {/* Reforma */}
      <div>
        <SectionTitle>Diferença por reforma</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
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

      {/* Most underestimated */}
      {calibration.mostUnderestimated.length > 0 && (
        <div>
          <SectionTitle>Maior subestimação</SectionTitle>
          <p className="text-xs text-slate-500 mb-2">O método sugeriu menos do que aconteceu</p>
          <ul className="space-y-1">
            {calibration.mostUnderestimated.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-sm">
                <span className="text-slate-700">{item.label}</span>
                <span className="font-medium text-orange-500">
                  {item.diffPercent > 0 ? "+" : ""}{item.diffPercent.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Most overestimated */}
      {calibration.mostOverestimated.length > 0 && (
        <div>
          <SectionTitle>Maior superestimação</SectionTitle>
          <p className="text-xs text-slate-500 mb-2">O método sugeriu mais do que aconteceu</p>
          <ul className="space-y-1">
            {calibration.mostOverestimated.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-sm">
                <span className="text-slate-700">{item.label}</span>
                <span className="font-medium text-blue-500">
                  {item.diffPercent > 0 ? "+" : ""}{item.diffPercent.toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Admin page                                                    */
/* ------------------------------------------------------------------ */

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

  const fetchData = useCallback(async (f: AdminFilters) => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, useRes, comRes, calRes] = await Promise.all([
        api.getAdminSummary(f),
        api.getAdminUsage(f),
        api.getAdminCommercial(f),
        api.getAdminCalibration(f),
      ]);
      if (sumRes.success) setSummary(sumRes.data);
      if (useRes.success) setUsage(useRes.data);
      if (comRes.success) setCommercial(comRes.data);
      if (calRes.success) setCalibration(calRes.data);
    } catch {
      setError("Erro ao carregar dados do dashboard. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.isAdmin) {
      fetchData(filters);
    }
  }, [user, filters, fetchData]);

  if (authLoading) return <PageLoadingState label="Verificando permissões..." />;
  if (!user) return <Navigate to={createPageUrl("Login")} replace />;
  if (!user.isAdmin) return <Navigate to={createPageUrl("Calculator")} replace />;

  function handleApplyFilters(newFilters: AdminFilters) {
    setFilters(newFilters);
  }

  const activeTabDef = TABS.find((t) => t.id === activeTab);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-calcularq-blue sm:text-3xl">
            Dashboard Administrativo
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Visão geral do uso, resultados comerciais e calibração do método Calcularq.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <AdminFiltersBar onApply={handleApplyFilters} />
        </div>

        {/* Tab navigation */}
        <div className="mb-6 overflow-x-auto">
          <nav className="flex gap-1 border-b border-slate-200" aria-label="Abas do dashboard">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`
                  relative shrink-0 px-4 py-2.5 text-sm font-medium transition-colors
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-calcularq-blue focus-visible:ring-offset-2 rounded-t-lg
                  ${
                    activeTab === tab.id
                      ? "text-calcularq-blue border-b-2 border-calcularq-blue bg-white"
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                  }
                `}
              >
                {tab.label}
                {tab.v2 && (
                  <span className="ml-1.5 inline-block rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 align-middle">
                    Em breve
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab content */}
        {loading ? (
          <PageLoadingState label="Carregando dados..." compact />
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="text-sm font-medium text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => fetchData(filters)}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Tentar novamente
            </button>
          </div>
        ) : (
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
            {activeTabDef?.v2 && <V2Placeholder />}
          </div>
        )}
      </div>
    </div>
  );
}

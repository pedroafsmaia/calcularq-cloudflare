import type { AdminFilters, AdminSummaryData, AdminUsageData, AdminCommercialData, AdminCalibrationData } from "@/types/admin";

const MIN_FEEDBACK_WARNING = 30;
const MIN_FEEDBACK_LIMITATION = 50;

interface ExportProps {
  filters: AdminFilters;
  summary: AdminSummaryData | null;
  usage: AdminUsageData | null;
  commercial: AdminCommercialData | null;
  calibration: AdminCalibrationData | null;
}

function fmtNum(v: number | null | undefined): string {
  if (v == null) return "N/A";
  return v.toLocaleString("pt-BR");
}

function fmtPct(v: number | null | undefined): string {
  if (v == null) return "N/A";
  return `${(v * 100).toFixed(1)}%`;
}

function fmtCurrency(v: number | null | undefined): string {
  if (v == null) return "N/A";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtRatio(v: number | null | undefined): string {
  if (v == null) return "N/A";
  return v.toFixed(2);
}

function filterSummaryText(filters: AdminFilters): string {
  const parts: string[] = [];
  if (filters.period_start) parts.push(`De: ${filters.period_start}`);
  if (filters.period_end) parts.push(`Até: ${filters.period_end}`);
  if (filters.tipologia) parts.push(`Tipologia: ${filters.tipologia}`);
  if (filters.area_min) parts.push(`Área mínima: ${filters.area_min} m²`);
  if (filters.area_max) parts.push(`Área máxima: ${filters.area_max} m²`);
  if (filters.feedback_only === "true") parts.push("Somente com feedback");
  if (filters.reforma) parts.push(`Reforma: ${filters.reforma}`);
  if (filters.close_status) parts.push(`Status: ${filters.close_status}`);
  return parts.length > 0 ? parts.join(" | ") : "Nenhum filtro aplicado";
}

function buildSummaryReport(data: ExportProps): string {
  const { filters, summary, usage, commercial, calibration } = data;
  const now = new Date().toLocaleDateString("pt-BR");

  let md = `# Relatório Resumo — Calcularq\n\n`;
  md += `**Gerado em:** ${now}\n\n`;
  md += `## Filtros aplicados\n\n${filterSummaryText(filters)}\n\n`;

  if (summary) {
    md += `## Resumo Executivo\n\n`;
    md += `| Indicador | Valor |\n|---|---|\n`;
    md += `| Total de Usuários | ${fmtNum(summary.totalUsers)} |\n`;
    md += `| Usuários Pagantes | ${fmtNum(summary.totalPaidUsers)} |\n`;
    md += `| Cálculos Salvos | ${fmtNum(summary.totalBudgets)} |\n`;
    md += `| Feedbacks Registrados | ${fmtNum(summary.totalFeedbacks)} |\n`;
    md += `| Taxa de Feedback | ${fmtPct(summary.feedbackRate)} |\n`;
    md += `| Taxa de Fechamento | ${fmtPct(summary.closingRate)} |\n`;
    md += `| Aderência de Horas | ${fmtRatio(summary.hoursAdherence)} |\n`;
    md += `| Aderência de Preço | ${fmtRatio(summary.priceAdherence)} |\n`;
    md += `\n`;
  }

  if (usage) {
    md += `## Uso da Calculadora\n\n`;
    md += `### Tipologias\n\n| Tipologia | Contagem |\n|---|---|\n`;
    for (const [k, v] of Object.entries(usage.tipologiaDistribution)) {
      md += `| ${k} | ${fmtNum(v)} |\n`;
    }
    md += `\n### Reforma vs Obra Nova\n\n`;
    md += `- Reforma: ${fmtNum(usage.reformaDistribution.reforma)}\n`;
    md += `- Obra nova: ${fmtNum(usage.reformaDistribution.novaObra)}\n\n`;
  }

  if (commercial) {
    md += `## Resultados Comerciais\n\n`;
    md += `| Indicador | Valor |\n|---|---|\n`;
    md += `| Preço médio sugerido | ${fmtCurrency(commercial.avgSuggestedPrice)} |\n`;
    md += `| Preço médio fechado | ${fmtCurrency(commercial.avgClosedPrice)} |\n`;
    md += `| Diferença média | ${fmtCurrency(commercial.avgDifference)} |\n`;
    md += `| Desconto médio | ${fmtPct(commercial.avgDiscount)} |\n\n`;
  }

  if (calibration) {
    md += `## Sinais de Calibração\n\n`;
    const hc = calibration.hoursComparison;
    md += `- Horas sugeridas: ${fmtNum(hc.suggested)}\n`;
    md += `- Horas reais: ${fmtNum(hc.actual)}\n`;
    md += `- Diferença: ${fmtPct(hc.difference)}\n\n`;

    if (calibration.mostUnderestimated.length > 0) {
      md += `### Maiores Subestimações\n\n`;
      for (const item of calibration.mostUnderestimated) {
        md += `- ${item.label}: ${item.diffPercent > 0 ? "+" : ""}${item.diffPercent.toFixed(1)}%\n`;
      }
      md += `\n`;
    }

    if (calibration.mostOverestimated.length > 0) {
      md += `### Maiores Superestimações\n\n`;
      for (const item of calibration.mostOverestimated) {
        md += `- ${item.label}: ${item.diffPercent > 0 ? "+" : ""}${item.diffPercent.toFixed(1)}%\n`;
      }
      md += `\n`;
    }
  }

  md += `---\n\n_Relatório gerado automaticamente pelo sistema Calcularq._\n`;
  return md;
}

function buildCalibrationReport(data: ExportProps): string {
  const { filters, calibration } = data;
  const now = new Date().toLocaleDateString("pt-BR");

  let md = `# Relatório de Calibração — Calcularq\n\n`;
  md += `**Gerado em:** ${now}\n\n`;
  md += `## Filtros aplicados\n\n${filterSummaryText(filters)}\n\n`;

  if (!calibration) {
    md += `_Sem dados de calibração disponíveis._\n`;
    return md;
  }

  const hc = calibration.hoursComparison;
  md += `## Comparação de Horas\n\n`;
  md += `| Métrica | Valor |\n|---|---|\n`;
  md += `| Horas sugeridas (média) | ${fmtNum(hc.suggested)} |\n`;
  md += `| Horas reais (média) | ${fmtNum(hc.actual)} |\n`;
  md += `| Diferença | ${fmtPct(hc.difference)} |\n\n`;

  function writeComparisonTable(title: string, data: Record<string, { suggested: number | null; actual: number | null; diff: number | null }>) {
    md += `### ${title}\n\n`;
    md += `| Categoria | Sugerido | Real | Diferença |\n|---|---|---|---|\n`;
    for (const [k, v] of Object.entries(data)) {
      md += `| ${k} | ${fmtNum(v.suggested)} | ${fmtNum(v.actual)} | ${fmtPct(v.diff)} |\n`;
    }
    md += `\n`;
  }

  writeComparisonTable("Por Tipologia", calibration.differenceByTipologia);
  writeComparisonTable("Por Faixa de Área", calibration.differenceByAreaRange);
  writeComparisonTable("Por F3", calibration.differenceByF3);
  writeComparisonTable("Por F4", calibration.differenceByF4);
  writeComparisonTable("Por F5", calibration.differenceByF5);
  writeComparisonTable("Por Reforma", calibration.differenceByReforma);

  if (calibration.mostUnderestimated.length > 0) {
    md += `## Maiores Subestimações\n\n_O método sugeriu menos do que aconteceu._\n\n`;
    for (const item of calibration.mostUnderestimated) {
      md += `- ${item.label}: ${item.diffPercent > 0 ? "+" : ""}${item.diffPercent.toFixed(1)}%\n`;
    }
    md += `\n`;
  }

  if (calibration.mostOverestimated.length > 0) {
    md += `## Maiores Superestimações\n\n_O método sugeriu mais do que aconteceu._\n\n`;
    for (const item of calibration.mostOverestimated) {
      md += `- ${item.label}: ${item.diffPercent > 0 ? "+" : ""}${item.diffPercent.toFixed(1)}%\n`;
    }
    md += `\n`;
  }

  md += `---\n\n_Relatório gerado automaticamente pelo sistema Calcularq._\n`;
  return md;
}

function buildFullReport(data: ExportProps): string {
  const { filters, summary, usage, commercial, calibration } = data;
  const now = new Date().toLocaleDateString("pt-BR");

  let md = `# Relatório Completo — Calcularq\n\n`;
  md += `**Gerado em:** ${now}\n\n`;
  md += `## Filtros aplicados\n\n${filterSummaryText(filters)}\n\n`;

  if (summary) {
    md += `## Tamanho da Amostra\n\n`;
    md += `- Total de cálculos: ${fmtNum(summary.totalBudgets)}\n`;
    md += `- Com feedback: ${fmtNum(summary.totalFeedbacks)}\n\n`;
    if (summary.totalFeedbacks < MIN_FEEDBACK_WARNING) {
      md += `> ⚠️ **Alerta:** Amostra pequena (${summary.totalFeedbacks} feedbacks). Os indicadores de calibração e comerciais podem não ser representativos.\n\n`;
    }
  }

  // Include full summary
  if (summary) {
    md += `## Resumo Executivo\n\n`;
    md += `| Indicador | Valor |\n|---|---|\n`;
    md += `| Total de Usuários | ${fmtNum(summary.totalUsers)} |\n`;
    md += `| Usuários Pagantes | ${fmtNum(summary.totalPaidUsers)} |\n`;
    md += `| Cálculos Salvos | ${fmtNum(summary.totalBudgets)} |\n`;
    md += `| Feedbacks Registrados | ${fmtNum(summary.totalFeedbacks)} |\n`;
    md += `| Taxa de Feedback | ${fmtPct(summary.feedbackRate)} |\n`;
    md += `| Taxa de Fechamento | ${fmtPct(summary.closingRate)} |\n`;
    md += `| Aderência de Horas | ${fmtRatio(summary.hoursAdherence)} |\n`;
    md += `| Aderência de Preço | ${fmtRatio(summary.priceAdherence)} |\n\n`;
  }

  if (usage) {
    md += `## Uso da Calculadora\n\n`;
    md += `### Tipologias mais usadas\n\n| Tipologia | Contagem |\n|---|---|\n`;
    for (const [k, v] of Object.entries(usage.tipologiaDistribution)) {
      md += `| ${k} | ${fmtNum(v)} |\n`;
    }
    md += `\n### Faixas de área\n\n| Faixa | Contagem |\n|---|---|\n`;
    for (const [k, v] of Object.entries(usage.areaDistribution)) {
      md += `| ${k} | ${fmtNum(v)} |\n`;
    }

    md += `\n### F3\n\n| Valor | Contagem |\n|---|---|\n`;
    for (const [k, v] of Object.entries(usage.f3Distribution)) {
      md += `| ${k} | ${fmtNum(v)} |\n`;
    }
    md += `\n### F4\n\n| Valor | Contagem |\n|---|---|\n`;
    for (const [k, v] of Object.entries(usage.f4Distribution)) {
      md += `| ${k} | ${fmtNum(v)} |\n`;
    }
    md += `\n### F5\n\n| Valor | Contagem |\n|---|---|\n`;
    for (const [k, v] of Object.entries(usage.f5Distribution)) {
      md += `| ${k} | ${fmtNum(v)} |\n`;
    }

    md += `\n### Volumetria\n\n| Categoria | Contagem |\n|---|---|\n`;
    for (const [k, v] of Object.entries(usage.volumetriaDistribution)) {
      md += `| ${k} | ${fmtNum(v)} |\n`;
    }

    md += `\n### Reforma vs Obra Nova\n\n`;
    md += `- Reforma: ${fmtNum(usage.reformaDistribution.reforma)}\n`;
    md += `- Obra nova: ${fmtNum(usage.reformaDistribution.novaObra)}\n\n`;

    md += `### Evolução Mensal\n\n| Mês | Cálculos |\n|---|---|\n`;
    for (const [k, v] of Object.entries(usage.monthlyEvolution)) {
      md += `| ${k} | ${fmtNum(v)} |\n`;
    }
    md += `\n`;
  }

  if (commercial) {
    md += `## Resultados Comerciais\n\n`;
    md += `| Indicador | Valor |\n|---|---|\n`;
    md += `| Preço médio sugerido | ${fmtCurrency(commercial.avgSuggestedPrice)} |\n`;
    md += `| Preço médio fechado | ${fmtCurrency(commercial.avgClosedPrice)} |\n`;
    md += `| Diferença média | ${fmtCurrency(commercial.avgDifference)} |\n`;
    md += `| Desconto médio | ${fmtPct(commercial.avgDiscount)} |\n\n`;

    md += `### R$/m² por Tipologia\n\n| Tipologia | Sugerido | Fechado |\n|---|---|---|\n`;
    for (const [k, v] of Object.entries(commercial.pricePerSqmByTipologia)) {
      md += `| ${k} | ${fmtCurrency(v.suggested)} | ${fmtCurrency(v.closed)} |\n`;
    }
    md += `\n`;

    const feedbackLabels: Record<string, string> = {
      too_expensive: "Muito caro",
      accepted_no_questions: "Aceito sem questionar",
      accepted_after_negotiation: "Aceito após negociação",
      could_charge_more: "Poderia cobrar mais",
      did_not_close_other: "Não fechou (outros motivos)",
    };
    md += `### Distribuição de Feedbacks\n\n| Tipo | Contagem |\n|---|---|\n`;
    for (const [k, v] of Object.entries(commercial.feedbackDistribution)) {
      md += `| ${feedbackLabels[k] ?? k} | ${fmtNum(v)} |\n`;
    }
    md += `\n`;
  }

  if (calibration) {
    md += `## Sinais de Calibração\n\n`;
    const hc = calibration.hoursComparison;
    md += `### Comparação de Horas\n\n`;
    md += `| Métrica | Valor |\n|---|---|\n`;
    md += `| Horas sugeridas (média) | ${fmtNum(hc.suggested)} |\n`;
    md += `| Horas reais (média) | ${fmtNum(hc.actual)} |\n`;
    md += `| Diferença | ${fmtPct(hc.difference)} |\n\n`;

    function writeComparisonTable(title: string, tableData: Record<string, { suggested: number | null; actual: number | null; diff: number | null }>) {
      md += `### ${title}\n\n`;
      md += `| Categoria | Sugerido | Real | Diferença |\n|---|---|---|---|\n`;
      for (const [k, v] of Object.entries(tableData)) {
        md += `| ${k} | ${fmtNum(v.suggested)} | ${fmtNum(v.actual)} | ${fmtPct(v.diff)} |\n`;
      }
      md += `\n`;
    }

    writeComparisonTable("Por Tipologia", calibration.differenceByTipologia);
    writeComparisonTable("Por Faixa de Área", calibration.differenceByAreaRange);
    writeComparisonTable("Por F3", calibration.differenceByF3);
    writeComparisonTable("Por F4", calibration.differenceByF4);
    writeComparisonTable("Por F5", calibration.differenceByF5);
    writeComparisonTable("Por Reforma", calibration.differenceByReforma);

    md += `### Principais Desvios\n\n`;
    if (calibration.mostUnderestimated.length > 0) {
      md += `**Maiores Subestimações** (método sugeriu menos que o real):\n\n`;
      for (const item of calibration.mostUnderestimated) {
        md += `- ${item.label}: ${item.diffPercent > 0 ? "+" : ""}${item.diffPercent.toFixed(1)}%\n`;
      }
      md += `\n`;
    }
    if (calibration.mostOverestimated.length > 0) {
      md += `**Maiores Superestimações** (método sugeriu mais que o real):\n\n`;
      for (const item of calibration.mostOverestimated) {
        md += `- ${item.label}: ${item.diffPercent > 0 ? "+" : ""}${item.diffPercent.toFixed(1)}%\n`;
      }
      md += `\n`;
    }
  }

  // Limitations
  if (summary && summary.totalFeedbacks < MIN_FEEDBACK_LIMITATION) {
    md += `## Limitações da Amostra\n\n`;
    md += `> A base analisada contém ${fmtNum(summary.totalFeedbacks)} feedbacks. Resultados devem ser interpretados com cautela.\n\n`;
  }

  md += `## Observações Finais\n\n`;
  md += `Este relatório foi gerado automaticamente com os dados disponíveis no momento da consulta. `;
  md += `Os indicadores refletem os filtros aplicados e podem variar conforme novos dados são inseridos.\n\n`;
  md += `---\n\n_Relatório gerado automaticamente pelo sistema Calcularq._\n`;

  return md;
}

function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const btnClass =
  "rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-calcularq-blue focus:ring-offset-2 transition-colors";

export default function AdminExport({ filters, summary, usage, commercial, calibration }: ExportProps) {
  const data: ExportProps = { filters, summary, usage, commercial, calibration };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-800">Exportar Relatórios</h3>
        <p className="mt-1 text-sm text-slate-500">
          Gere relatórios em formato Markdown (.md) com os dados atuais e filtros aplicados.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          className={btnClass}
          onClick={() => downloadMarkdown(buildSummaryReport(data), "calcularq-resumo.md")}
        >
          📄 Exportar resumo em .md
        </button>

        <button
          type="button"
          className={btnClass}
          onClick={() => downloadMarkdown(buildCalibrationReport(data), "calcularq-calibracao.md")}
        >
          📐 Exportar calibração em .md
        </button>

        <button
          type="button"
          className={btnClass}
          onClick={() => downloadMarkdown(buildFullReport(data), "calcularq-completo.md")}
        >
          📊 Exportar visão filtrada em .md
        </button>
      </div>
    </div>
  );
}

export type { AdminSummaryData, AdminUsageData, AdminCommercialData, AdminCalibrationData, AdminFilters } from "@/lib/api";

// V2: Comparison between periods
export interface PeriodComparison {
  current: Record<string, number | null>;
  previous: Record<string, number | null>;
}

// V2: Cohort data
export interface CohortData {
  label: string;
  count: number;
  feedbackRate: number | null;
}

// V2: Alert types
export type AlertSeverity = "info" | "warning" | "critical";
export interface AdminAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  description: string;
}

// V2: Insight
export interface AdminInsight {
  text: string;
  category: "positive" | "neutral" | "attention";
}

// Dashboard tab
export type AdminTab = "resumo" | "uso" | "comercial" | "calibracao" | "exportacao" | "tendencias" | "alertas" | "segmentacao" | "evolucao";

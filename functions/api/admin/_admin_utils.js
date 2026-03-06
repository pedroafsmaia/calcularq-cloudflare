// Shared utilities for admin analytics endpoints

export function parseFilters(url) {
  return {
    periodStart: url.searchParams.get("period_start") || null,
    periodEnd: url.searchParams.get("period_end") || null,
    tipologia: url.searchParams.get("tipologia") || null,
    areaMin: url.searchParams.get("area_min") ? Number(url.searchParams.get("area_min")) : null,
    areaMax: url.searchParams.get("area_max") ? Number(url.searchParams.get("area_max")) : null,
    feedbackOnly: url.searchParams.get("feedback_only") === "true",
    reforma: url.searchParams.get("reforma"),
    closeStatus: url.searchParams.get("close_status") || null,
  };
}

export function parseBudgetData(row) {
  try {
    return JSON.parse(row.data);
  } catch {
    return null;
  }
}

export function applyFilters(budgets, filters) {
  return budgets.filter((b) => {
    if (filters.periodStart && b.created_at < filters.periodStart) return false;
    if (filters.periodEnd && b.created_at > filters.periodEnd) return false;

    const d = b._parsed;
    if (!d) return false;

    if (filters.tipologia && d.tipologia !== filters.tipologia) return false;
    if (filters.areaMin != null && (typeof d.area !== "number" || d.area < filters.areaMin)) return false;
    if (filters.areaMax != null && (typeof d.area !== "number" || d.area > filters.areaMax)) return false;
    if (filters.reforma === "true" && !d.reforma) return false;
    if (filters.reforma === "false" && d.reforma) return false;
    if (filters.feedbackOnly && !b.closed_at) return false;

    if (filters.closeStatus) {
      const accepted = ["accepted_no_questions", "accepted_after_negotiation"];
      if (filters.closeStatus === "closed" && !accepted.includes(d.closeFeedback)) return false;
      if (filters.closeStatus === "not_closed" && accepted.includes(d.closeFeedback)) return false;
    }

    return true;
  });
}

export function getAreaRange(area) {
  if (typeof area !== "number") return null;
  if (area <= 50) return "0-50";
  if (area <= 100) return "50-100";
  if (area <= 200) return "100-200";
  if (area <= 500) return "200-500";
  return "500+";
}

export function getFactorLevel(data, factorId) {
  if (!Array.isArray(data.factors)) return null;
  const factor = data.factors.find((f) => f.id === factorId);
  return factor ? String(factor.level) : null;
}

export function safeAvg(values) {
  if (values.length === 0) return null;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function round4(v) {
  return v != null ? Math.round(v * 10000) / 10000 : null;
}

export async function fetchFilteredBudgets(db, filters) {
  let rawBudgets = [];
  try {
    const withClosedAt = await db
      .prepare("SELECT id, data, created_at, updated_at, closed_at FROM budgets")
      .all();
    rawBudgets = withClosedAt.results || [];
  } catch (error) {
    const message = String(error?.message || "");
    if (!message.includes("no such column: closed_at")) throw error;

    // Backward compatibility for databases that have not applied migration 0003.
    const withoutClosedAt = await db
      .prepare("SELECT id, data, created_at, updated_at FROM budgets")
      .all();
    rawBudgets = (withoutClosedAt.results || []).map((row) => ({ ...row, closed_at: null }));
  }

  const budgets = (rawBudgets || []).map((b) => ({ ...b, _parsed: parseBudgetData(b) }));
  return applyFilters(budgets, filters);
}

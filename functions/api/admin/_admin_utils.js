// Shared utilities for admin analytics endpoints

const ACCEPTED_CLOSE_STATUSES = ["accepted_no_questions", "accepted_after_negotiation"];

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
      if (filters.closeStatus === "closed" && !ACCEPTED_CLOSE_STATUSES.includes(d.closeFeedback)) return false;
      if (filters.closeStatus === "not_closed" && ACCEPTED_CLOSE_STATUSES.includes(d.closeFeedback)) return false;
    }

    return true;
  });
}

export function buildBudgetsFilterQuery(filters, { includeClosedAt = true } = {}) {
  const selectClosedAt = includeClosedAt ? ", closed_at" : "";
  const where = [];
  const binds = [];

  if (filters.periodStart) {
    where.push("created_at >= ?");
    binds.push(filters.periodStart);
  }
  if (filters.periodEnd) {
    where.push("created_at <= ?");
    binds.push(filters.periodEnd);
  }
  if (filters.feedbackOnly && includeClosedAt) {
    where.push("closed_at IS NOT NULL");
  }
  if (filters.tipologia) {
    where.push("json_extract(data, '$.tipologia') = ?");
    binds.push(filters.tipologia);
  }
  if (Number.isFinite(filters.areaMin)) {
    where.push("CAST(json_extract(data, '$.area') AS REAL) >= ?");
    binds.push(filters.areaMin);
  }
  if (Number.isFinite(filters.areaMax)) {
    where.push("CAST(json_extract(data, '$.area') AS REAL) <= ?");
    binds.push(filters.areaMax);
  }
  if (filters.reforma === "true") {
    where.push("json_extract(data, '$.reforma') = 1");
  } else if (filters.reforma === "false") {
    where.push("(json_extract(data, '$.reforma') = 0 OR json_extract(data, '$.reforma') IS NULL)");
  }
  if (filters.closeStatus === "closed") {
    where.push(`json_extract(data, '$.closeFeedback') IN (${ACCEPTED_CLOSE_STATUSES.map(() => "?").join(", ")})`);
    binds.push(...ACCEPTED_CLOSE_STATUSES);
  } else if (filters.closeStatus === "not_closed") {
    where.push(`(
      json_extract(data, '$.closeFeedback') NOT IN (${ACCEPTED_CLOSE_STATUSES.map(() => "?").join(", ")})
      OR json_extract(data, '$.closeFeedback') IS NULL
    )`);
    binds.push(...ACCEPTED_CLOSE_STATUSES);
  }

  const whereSql = where.length > 0 ? ` WHERE ${where.join(" AND ")}` : "";
  return {
    sql: `SELECT id, data, created_at, updated_at${selectClosedAt} FROM budgets${whereSql}`,
    binds,
  };
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
    const query = buildBudgetsFilterQuery(filters, { includeClosedAt: true });
    const withClosedAt = await db.prepare(query.sql).bind(...query.binds).all();
    rawBudgets = withClosedAt.results || [];
  } catch (error) {
    const message = String(error?.message || "");
    const needsLegacyFallback =
      message.includes("no such column: closed_at") ||
      message.includes("no such function: json_extract");

    if (!needsLegacyFallback) throw error;

    const withoutClosedAt = await db
      .prepare("SELECT id, data, created_at, updated_at FROM budgets")
      .all();
    const legacyRows = (withoutClosedAt.results || []).map((row) => ({ ...row, closed_at: null }));
    const budgets = legacyRows.map((b) => ({ ...b, _parsed: parseBudgetData(b) }));
    return applyFilters(budgets, filters);
  }

  return (rawBudgets || []).map((b) => ({ ...b, _parsed: parseBudgetData(b) }));
}

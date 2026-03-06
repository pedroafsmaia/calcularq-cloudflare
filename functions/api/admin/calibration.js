import { jsonResponse, requireAdmin } from "../_utils.js";
import { parseFilters, fetchFilteredBudgets, getAreaRange, getFactorLevel, safeAvg, round4 } from "./_admin_utils.js";

function addToGroup(groups, key, suggested, actual) {
  if (!key) return;
  if (!groups[key]) groups[key] = { suggestedList: [], actualList: [], diffList: [] };
  groups[key].suggestedList.push(suggested);
  groups[key].actualList.push(actual);
  groups[key].diffList.push(actual - suggested);
}

function summarizeGroups(groups) {
  const result = {};
  for (const [key, vals] of Object.entries(groups)) {
    result[key] = {
      suggested: round4(safeAvg(vals.suggestedList)),
      actual: round4(safeAvg(vals.actualList)),
      diff: round4(safeAvg(vals.diffList)),
    };
  }
  return result;
}

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return jsonResponse({ success: false, message: "Método não permitido" }, { status: 405 });
  }

  const auth = await requireAdmin(context);
  if (!auth.ok) return auth.response;

  const db = context.env.DB;
  const url = new URL(context.request.url);
  const filters = parseFilters(url);

  try {
    const filtered = await fetchFilteredBudgets(db, filters);

    // Only budgets with both suggested and actual hours
    const calibrationBudgets = [];
    for (const b of filtered) {
      const d = b._parsed;
      if (!d) continue;
      const suggested = d.estimatedHours;
      const actual = d.actualHoursTotal;
      if (typeof suggested === "number" && suggested > 0 && typeof actual === "number" && actual > 0) {
        calibrationBudgets.push({ budget: b, d, suggested, actual });
      }
    }

    const allSuggested = calibrationBudgets.map((c) => c.suggested);
    const allActual = calibrationBudgets.map((c) => c.actual);
    const allDiff = calibrationBudgets.map((c) => c.actual - c.suggested);

    const byTipologia = {};
    const byAreaRange = {};
    const byF3 = {};
    const byF4 = {};
    const byF5 = {};
    const byReforma = {};

    for (const { d, suggested, actual } of calibrationBudgets) {
      addToGroup(byTipologia, d.tipologia, suggested, actual);
      addToGroup(byAreaRange, getAreaRange(d.area), suggested, actual);
      addToGroup(byF3, getFactorLevel(d, "F3"), suggested, actual);
      addToGroup(byF4, getFactorLevel(d, "F4"), suggested, actual);
      addToGroup(byF5, getFactorLevel(d, "F5"), suggested, actual);
      addToGroup(byReforma, d.reforma ? "reforma" : "novaObra", suggested, actual);
    }

    // Most underestimated: method suggested LESS than actual (actual > suggested)
    // Most overestimated: method suggested MORE than actual (actual < suggested)
    const withDiffPct = calibrationBudgets.map((c) => ({
      id: c.budget.id,
      tipologia: c.d.tipologia || null,
      area: c.d.area || null,
      reforma: !!c.d.reforma,
      suggested: c.suggested,
      actual: c.actual,
      diffPct: ((c.actual - c.suggested) / c.suggested) * 100,
    }));

    const underestimated = withDiffPct
      .filter((r) => r.diffPct > 0)
      .sort((a, b) => b.diffPct - a.diffPct)
      .slice(0, 5)
      .map((r) => ({ ...r, diffPct: round4(r.diffPct) }));

    const overestimated = withDiffPct
      .filter((r) => r.diffPct < 0)
      .sort((a, b) => a.diffPct - b.diffPct)
      .slice(0, 5)
      .map((r) => ({ ...r, diffPct: round4(r.diffPct) }));

    return jsonResponse({
      success: true,
      data: {
        hoursComparison: {
          suggested: round4(safeAvg(allSuggested)),
          actual: round4(safeAvg(allActual)),
          difference: round4(safeAvg(allDiff)),
        },
        differenceByTipologia: summarizeGroups(byTipologia),
        differenceByAreaRange: summarizeGroups(byAreaRange),
        differenceByF3: summarizeGroups(byF3),
        differenceByF4: summarizeGroups(byF4),
        differenceByF5: summarizeGroups(byF5),
        differenceByReforma: summarizeGroups(byReforma),
        mostUnderestimated: underestimated,
        mostOverestimated: overestimated,
      },
    });
  } catch (error) {
    console.error("[admin/calibration] error:", error);
    return jsonResponse({ success: false, message: "Erro ao carregar dados" }, { status: 500 });
  }
}

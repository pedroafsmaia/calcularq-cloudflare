import { jsonResponse, requireAdmin } from "../_utils.js";
import { parseFilters, fetchFilteredBudgets, getAreaRange, getFactorLevel } from "./_admin_utils.js";

function getVolumetriaRange(v) {
  if (typeof v !== "number") return null;
  if (v <= 1) return "1";
  if (v <= 2) return "2";
  if (v <= 3) return "3";
  if (v <= 5) return "4-5";
  return "6+";
}

function increment(obj, key) {
  if (key == null) return;
  obj[key] = (obj[key] || 0) + 1;
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

    const tipologiaDistribution = {};
    const areaDistribution = {};
    const f3Distribution = {};
    const f4Distribution = {};
    const f5Distribution = {};
    const volumetriaDistribution = {};
    const reformaDistribution = { reforma: 0, novaObra: 0 };
    const monthlyEvolution = {};

    for (const b of filtered) {
      const d = b._parsed;
      if (!d) continue;

      increment(tipologiaDistribution, d.tipologia);
      increment(areaDistribution, getAreaRange(d.area));
      increment(f3Distribution, getFactorLevel(d, "F3"));
      increment(f4Distribution, getFactorLevel(d, "F4"));
      increment(f5Distribution, getFactorLevel(d, "F5"));
      increment(volumetriaDistribution, getVolumetriaRange(d.volumetria));

      if (d.reforma) {
        reformaDistribution.reforma++;
      } else {
        reformaDistribution.novaObra++;
      }

      if (b.created_at) {
        const month = b.created_at.slice(0, 7);
        monthlyEvolution[month] = (monthlyEvolution[month] || 0) + 1;
      }
    }

    return jsonResponse({
      success: true,
      data: {
        tipologiaDistribution,
        areaDistribution,
        f3Distribution,
        f4Distribution,
        f5Distribution,
        volumetriaDistribution,
        reformaDistribution,
        monthlyEvolution,
      },
    });
  } catch (error) {
    console.error("[admin/usage] error:", error);
    return jsonResponse({ success: false, message: "Erro ao carregar dados" }, { status: 500 });
  }
}

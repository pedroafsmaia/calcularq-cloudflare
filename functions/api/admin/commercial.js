import { jsonResponse, requireAdmin } from "../_utils.js";
import { parseFilters, fetchFilteredBudgets, safeAvg, round4 } from "./_admin_utils.js";

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

    const suggestedPrices = [];
    const closedPrices = [];
    const differences = [];
    const discounts = [];
    const feedbackDistribution = {};
    const pricePerSqm = {};

    for (const b of filtered) {
      const d = b._parsed;
      if (!d) continue;

      const suggested = d.results?.finalSalePrice;
      if (typeof suggested === "number" && Number.isFinite(suggested)) {
        suggestedPrices.push(suggested);
      }

      if (typeof d.closedDealValue === "number" && Number.isFinite(d.closedDealValue)) {
        closedPrices.push(d.closedDealValue);
        if (typeof suggested === "number" && Number.isFinite(suggested)) {
          differences.push(d.closedDealValue - suggested);
        }
      }

      if (typeof d.commercialDiscount === "number" && Number.isFinite(d.commercialDiscount)) {
        discounts.push(d.commercialDiscount);
      }

      if (d.closeFeedback) {
        feedbackDistribution[d.closeFeedback] = (feedbackDistribution[d.closeFeedback] || 0) + 1;
      }

      const tip = d.tipologia;
      const area = d.area;
      if (tip && typeof area === "number" && area > 0) {
        if (!pricePerSqm[tip]) pricePerSqm[tip] = { suggestedValues: [], closedValues: [] };

        if (typeof suggested === "number" && Number.isFinite(suggested)) {
          pricePerSqm[tip].suggestedValues.push(suggested / area);
        }
        if (typeof d.closedDealValue === "number" && Number.isFinite(d.closedDealValue)) {
          pricePerSqm[tip].closedValues.push(d.closedDealValue / area);
        }
      }
    }

    const pricePerSqmByTipologia = {};
    for (const [tip, vals] of Object.entries(pricePerSqm)) {
      pricePerSqmByTipologia[tip] = {
        suggested: round4(safeAvg(vals.suggestedValues)),
        closed: round4(safeAvg(vals.closedValues)),
      };
    }

    return jsonResponse({
      success: true,
      data: {
        avgSuggestedPrice: round4(safeAvg(suggestedPrices)),
        avgClosedPrice: round4(safeAvg(closedPrices)),
        avgDifference: round4(safeAvg(differences)),
        avgDiscount: round4(safeAvg(discounts)),
        pricePerSqmByTipologia,
        feedbackDistribution,
      },
    });
  } catch (error) {
    console.error("[admin/commercial] error:", error);
    return jsonResponse({ success: false, message: "Erro ao carregar dados" }, { status: 500 });
  }
}

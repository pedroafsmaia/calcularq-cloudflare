import { jsonResponse, rateLimitByIp, requireAdmin } from "../_utils.js";
import { parseFilters, fetchFilteredBudgets, safeAvg, round4 } from "./_admin_utils.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return jsonResponse({ success: false, message: "Método não permitido" }, { status: 405 });
  }

  const auth = await requireAdmin(context);
  if (!auth.ok) return auth.response;

  const rate = await rateLimitByIp(context, { endpoint: "admin:summary", limit: 60, windowMs: 60_000 });
  if (!rate.ok) {
    return jsonResponse(
      { success: false, message: "Muitas consultas. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const db = context.env.DB;
  if (!db) {
    return jsonResponse({ success: false, message: "Serviço indisponível no momento" }, { status: 503 });
  }
  const url = new URL(context.request.url);
  const filters = parseFilters(url);

  try {
    const usersCount = await db.prepare("SELECT COUNT(*) as total FROM users").first();
    const paidCount = await db
      .prepare(
        "SELECT COUNT(*) as total FROM users WHERE has_paid = 1 AND stripe_customer_id IS NOT NULL AND TRIM(stripe_customer_id) <> ''"
      )
      .first();

    const filtered = await fetchFilteredBudgets(db, filters);

    const totalBudgets = filtered.length;
    const closedBudgets = filtered.filter((b) => b.closed_at);
    const totalFeedbacks = closedBudgets.length;
    const feedbackRate = totalBudgets > 0 ? totalFeedbacks / totalBudgets : 0;

    const acceptedStatuses = ["accepted_no_questions", "accepted_after_negotiation"];
    const acceptedBudgets = closedBudgets.filter((b) => b._parsed && acceptedStatuses.includes(b._parsed.closeFeedback));
    const closingRate = totalFeedbacks > 0 ? acceptedBudgets.length / totalFeedbacks : 0;

    // Hours adherence: avg(actualHoursTotal / estimatedHours)
    const hoursRatios = [];
    for (const b of closedBudgets) {
      const d = b._parsed;
      if (d && typeof d.actualHoursTotal === "number" && typeof d.estimatedHours === "number" && d.estimatedHours > 0) {
        hoursRatios.push(d.actualHoursTotal / d.estimatedHours);
      }
    }

    // Price adherence: avg(closedDealValue / finalSalePrice)
    const priceRatios = [];
    for (const b of closedBudgets) {
      const d = b._parsed;
      if (
        d &&
        typeof d.closedDealValue === "number" &&
        d.closedDealValue > 0 &&
        d.results &&
        typeof d.results.finalSalePrice === "number" &&
        d.results.finalSalePrice > 0
      ) {
        priceRatios.push(d.closedDealValue / d.results.finalSalePrice);
      }
    }

    return jsonResponse({
      success: true,
      data: {
        totalUsers: Number(usersCount?.total || 0),
        totalPaidUsers: Number(paidCount?.total || 0),
        totalBudgets,
        totalFeedbacks,
        feedbackRate: round4(feedbackRate),
        closingRate: round4(closingRate),
        hoursAdherence: round4(safeAvg(hoursRatios)),
        priceAdherence: round4(safeAvg(priceRatios)),
      },
    });
  } catch (error) {
    console.error("[admin/summary] error:", error);
    return jsonResponse({ success: false, message: "Erro ao carregar dados" }, { status: 500 });
  }
}

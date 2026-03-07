import { jsonResponse, rateLimitByIp, requireAuth } from "../_utils.js";

export async function onRequest(context) {
  if (context.request.method !== "GET") {
    return jsonResponse({ success: false, message: "Método não permitido" }, { status: 405 });
  }

  const rate = await rateLimitByIp(context, { endpoint: "user:payment-status", limit: 60, windowMs: 60_000 });
  if (!rate.ok) {
    return jsonResponse(
      { success: false, message: "Muitas tentativas. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const auth = await requireAuth(context);
  if (!auth.ok) return auth.response;

  const db = context.env.DB;
  const requirePayment = String(context.env.REQUIRE_PAYMENT || "0") === "1";
  const user = await db
    .prepare("SELECT id, has_paid, payment_date, stripe_customer_id FROM users WHERE id = ?")
    .bind(auth.userId)
    .first();

  if (!user) {
    return jsonResponse({ success: false, message: "Usuário não encontrado" }, { status: 404 });
  }

  return jsonResponse({
    userId: user.id,
    hasPaid: requirePayment ? !!user.has_paid : true,
    paymentDate: user.payment_date,
    stripeCustomerId: user.stripe_customer_id,
  });
}

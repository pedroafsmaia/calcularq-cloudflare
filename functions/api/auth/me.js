import { jsonResponse, requireAuth } from "../_utils.js";

export async function onRequest(context) {
  const auth = await requireAuth(context);
  if (!auth.ok) return auth.response;

  const db = context.env.DB;
  const requirePayment = String(context.env.REQUIRE_PAYMENT || "0") === "1";
  const user = await db.prepare("SELECT id, email, name, has_paid, payment_date, stripe_customer_id, created_at FROM users WHERE id = ?")
    .bind(auth.userId)
    .first();

  if (!user) {
    return jsonResponse({ success: false, message: "Usuário não encontrado" }, { status: 404 });
  }

  return jsonResponse({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      hasPaid: requirePayment ? !!user.has_paid : true,
      paymentDate: user.payment_date,
      stripeCustomerId: user.stripe_customer_id,
      createdAt: user.created_at,
    }
  });
}

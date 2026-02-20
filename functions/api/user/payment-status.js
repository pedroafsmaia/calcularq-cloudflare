import { jsonResponse, requireAuth } from "../_utils.js";

export async function onRequest(context) {
  const auth = await requireAuth(context);
  if (!auth.ok) return auth.response;

  const db = context.env.DB;
  const user = await db.prepare("SELECT id, has_paid, payment_date, stripe_customer_id FROM users WHERE id = ?")
    .bind(auth.userId)
    .first();

  if (!user) return jsonResponse({ success: false, message: "Usuário não encontrado" }, { status: 404 });

  return jsonResponse({
    userId: user.id,
    hasPaid: !!user.has_paid,
    paymentDate: user.payment_date,
    stripeCustomerId: user.stripe_customer_id
  });
}

import { jsonResponse, readJson, setSessionCookie, signSessionToken, hashPassword } from "../_utils.js";

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return jsonResponse({ success: false, message: "Método não permitido" }, { status: 405 });
  }

  const body = await readJson(context.request);
  const email = body?.email?.toLowerCase()?.trim();
  const password = body?.password;
  const name = (body?.name || "").trim() || "Usuário";

  if (!email || !password) {
    return jsonResponse({ success: false, message: "Email e senha são obrigatórios" }, { status: 400 });
  }

  const db = context.env.DB;

  const existing = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) {
    return jsonResponse({ success: false, message: "Este email já está cadastrado" }, { status: 409 });
  }

  const id = crypto.randomUUID();
  const password_hash = await hashPassword(password);

  // Para ambiente de teste, você pode começar com has_paid = 1 para não bloquear a calculadora.
  // Quando integrar Stripe, defina como 0 e atualize via webhook.
  const requirePayment = String(context.env.REQUIRE_PAYMENT || "0") === "1";
  const has_paid = requirePayment ? 0 : 1;
  const created_at = new Date().toISOString();

  await db.prepare(
    "INSERT INTO users (id, email, name, password_hash, has_paid, payment_date, stripe_customer_id, created_at) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)"
  ).bind(id, email, name, password_hash, has_paid, created_at).run();

  const token = await signSessionToken({ sub: id }, context.env.JWT_SECRET);
  const headers = new Headers();
  setSessionCookie(headers, token);

  const user = { id, email, name, hasPaid: !!has_paid, paymentDate: null, stripeCustomerId: null, createdAt: created_at };
  return jsonResponse({ success: true, user }, { headers });
}

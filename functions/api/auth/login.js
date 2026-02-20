import { jsonResponse, readJson, setSessionCookie, signSessionToken, verifyPassword } from "../_utils.js";

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return jsonResponse({ success: false, message: "Método não permitido" }, { status: 405 });
  }

  const body = await readJson(context.request);
  const email = body?.email?.toLowerCase()?.trim();
  const password = body?.password;

  if (!email || !password) {
    return jsonResponse({ success: false, message: "Email e senha são obrigatórios" }, { status: 400 });
  }

  const db = context.env.DB;
  const user = await db.prepare("SELECT id, email, name, password_hash, has_paid, payment_date, stripe_customer_id, created_at FROM users WHERE email = ?")
    .bind(email)
    .first();

  if (!user) {
    return jsonResponse({ success: false, message: "Credenciais inválidas" }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return jsonResponse({ success: false, message: "Credenciais inválidas" }, { status: 401 });
  }

  const token = await signSessionToken({ sub: user.id }, context.env.JWT_SECRET);
  const headers = new Headers();
  setSessionCookie(headers, token);

  const respUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    hasPaid: !!user.has_paid,
    paymentDate: user.payment_date,
    stripeCustomerId: user.stripe_customer_id,
    createdAt: user.created_at,
  };

  return jsonResponse({ success: true, user: respUser }, { headers });
}

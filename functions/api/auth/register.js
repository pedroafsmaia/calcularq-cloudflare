import {
  assertAllowedOrigin,
  hashPassword,
  jsonResponse,
  readJson,
  sanitizeText,
  setSessionCookie,
  signSessionToken,
  validateEmail,
} from "../_utils.js";

const MIN_PASSWORD_LENGTH = 8;

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return jsonResponse({ success: false, message: "Método não permitido" }, { status: 405 });
  }

  const badOrigin = assertAllowedOrigin(context);
  if (badOrigin) return badOrigin;

  const body = await readJson(context.request);
  const email = body?.email?.toLowerCase?.().trim?.();
  const password = body?.password;
  const name = sanitizeText(body?.name || "Usuário", { max: 120, allowEmpty: false });

  if (!email || !password) {
    return jsonResponse({ success: false, message: "Email e senha são obrigatórios" }, { status: 400 });
  }
  if (!validateEmail(email)) {
    return jsonResponse({ success: false, message: "Email inválido" }, { status: 400 });
  }
  if (String(password).length < MIN_PASSWORD_LENGTH) {
    return jsonResponse({ success: false, message: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` }, { status: 400 });
  }

  const db = context.env.DB;

  const existing = await db.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) {
    return jsonResponse({ success: false, message: "Este email já está cadastrado" }, { status: 409 });
  }

  const id = crypto.randomUUID();
  const password_hash = await hashPassword(password);

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

import { assertAllowedOrigin, hashPassword, hashResetToken, jsonResponse, readJson } from "../_utils.js";

const MIN_PASSWORD_LENGTH = 8;

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return jsonResponse({ success: false, message: "Método não permitido" }, { status: 405 });
  }

  const badOrigin = assertAllowedOrigin(context);
  if (badOrigin) return badOrigin;

  const body = await readJson(context.request);
  const token = body?.token;
  const newPassword = body?.newPassword;

  if (!token || !newPassword) {
    return jsonResponse({ success: false, message: "Token e nova senha são obrigatórios" }, { status: 400 });
  }
  if (String(newPassword).length < MIN_PASSWORD_LENGTH) {
    return jsonResponse({ success: false, message: `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres` }, { status: 400 });
  }

  const db = context.env.DB;
  const token_hash = await hashResetToken(token);

  const row = await db.prepare(
    "SELECT rt.id as rt_id, rt.user_id as user_id, rt.expires_at as expires_at FROM reset_tokens rt WHERE rt.token_hash = ?"
  ).bind(token_hash).first();

  if (!row) {
    return jsonResponse({ success: false, message: "Token inválido ou expirado" }, { status: 400 });
  }

  const expiresAt = new Date(row.expires_at).getTime();
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    await db.prepare("DELETE FROM reset_tokens WHERE id = ?").bind(row.rt_id).run();
    return jsonResponse({ success: false, message: "Token inválido ou expirado" }, { status: 400 });
  }

  const password_hash = await hashPassword(newPassword);

  await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(password_hash, row.user_id).run();
  await db.prepare("DELETE FROM reset_tokens WHERE id = ?").bind(row.rt_id).run();

  return jsonResponse({ success: true, message: "Senha redefinida com sucesso" });
}

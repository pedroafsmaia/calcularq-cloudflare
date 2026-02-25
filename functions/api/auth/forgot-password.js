import { assertAllowedOrigin, generateResetToken, hashResetToken, jsonResponse, readJson, validateEmail } from "../_utils.js";

const FORGOT_PASSWORD_COOLDOWN_MS = 60 * 1000;

async function sendBrevoEmail({ apiKey, senderEmail, senderName, toEmail, toName, subject, html }) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: toEmail, name: toName || toEmail }],
      subject,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Falha ao enviar email (Brevo): ${res.status} ${txt}`);
  }
}

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return jsonResponse({ success: false, message: "Método não permitido" }, { status: 405 });
  }

  const badOrigin = assertAllowedOrigin(context);
  if (badOrigin) return badOrigin;

  const body = await readJson(context.request);
  const email = body?.email?.toLowerCase?.().trim?.();

  const okResponse = (extra = {}) =>
    jsonResponse({ success: true, message: "Se o email existir, você receberá instruções para redefinir sua senha.", ...extra });

  if (!email || !validateEmail(email)) return okResponse();

  const db = context.env.DB;

  const user = await db.prepare("SELECT id, email, name FROM users WHERE email = ?").bind(email).first();
  if (!user) return okResponse();

  const latestToken = await db
    .prepare("SELECT created_at FROM reset_tokens WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")
    .bind(user.id)
    .first();

  if (latestToken?.created_at) {
    const latestCreatedAt = new Date(latestToken.created_at).getTime();
    if (Number.isFinite(latestCreatedAt) && Date.now() - latestCreatedAt < FORGOT_PASSWORD_COOLDOWN_MS) {
      return okResponse();
    }
  }

  const token = await generateResetToken();
  const token_hash = await hashResetToken(token);
  const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  await db.prepare("DELETE FROM reset_tokens WHERE user_id = ?").bind(user.id).run();

  await db.prepare(
    "INSERT INTO reset_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(crypto.randomUUID(), user.id, token_hash, expires_at, new Date().toISOString()).run();

  const frontendUrl = context.env.FRONTEND_URL || "";
  const resetUrl = frontendUrl ? `${frontendUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}` : "";

  const brevoKey = context.env.BREVO_API_KEY;
  const senderEmail = context.env.BREVO_SENDER_EMAIL || "atendimento@calcularq.com.br";
  const senderName = context.env.BREVO_SENDER_NAME || "Calcularq";

  if (brevoKey && resetUrl) {
    try {
      const subject = "Redefinição de senha - Calcularq";
      const html = `
<div style="font-family: Arial, sans-serif; background-color: #f6f6f6; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 8px;">
    <h2 style="color: #0b3a75; margin-bottom: 24px;">Redefinição de senha</h2>
    <p style="font-size: 16px; color: #333; margin-bottom: 16px;">Olá, ${user.name || "usuário"}.</p>
    <p style="font-size: 16px; color: #333; margin-bottom: 24px;">Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo (válido por 1 hora):</p>
    <div style="margin-bottom: 24px;">
      <a href="${resetUrl}" style="background-color: #0b3a75; color: #ffffff; padding: 12px 22px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Redefinir minha senha</a>
    </div>
    <p style="font-size: 14px; color: #666; margin-bottom: 24px;">Se você não solicitou essa redefinição, ignore este email.</p>
    <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">
    <p style="font-size: 12px; color: #999;">Calcularq © ${new Date().getFullYear()}</p>
  </div>
</div>`;
      await sendBrevoEmail({ apiKey: brevoKey, senderEmail, senderName, toEmail: user.email, toName: user.name, subject, html });
    } catch {
      // Mantém resposta neutra; detalhes ficam nos logs do Cloudflare
    }
  }

  const debug = String(context.env.DEBUG_EMAIL_TOKENS || "0") === "1";
  return okResponse(debug ? { debugResetUrl: resetUrl, debugToken: token } : {});
}

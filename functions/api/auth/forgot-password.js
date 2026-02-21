import { jsonResponse, readJson, generateResetToken, hashResetToken } from "../_utils.js";

async function sendBrevoEmail({ apiKey, toEmail, toName, subject, html }) {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: "Calcularq", email: "atendimento@calcularq.com.br" },
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

  const body = await readJson(context.request);
  const email = body?.email?.toLowerCase()?.trim();

  // Resposta sempre genérica (evita enumeração de emails)
  const okResponse = (extra = {}) =>
    jsonResponse({ success: true, message: "Se o email existir, você receberá instruções para redefinir sua senha.", ...extra });

  if (!email) return okResponse();

  const db = context.env.DB;

  const user = await db.prepare("SELECT id, email, name FROM users WHERE email = ?").bind(email).first();
  if (!user) return okResponse();

  const token = await generateResetToken();
  const token_hash = await hashResetToken(token);
  const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hora

  // invalida tokens antigos
  await db.prepare("DELETE FROM reset_tokens WHERE user_id = ?").bind(user.id).run();

  await db.prepare(
    "INSERT INTO reset_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(crypto.randomUUID(), user.id, token_hash, expires_at, new Date().toISOString()).run();

  const frontendUrl = context.env.FRONTEND_URL || "";
  const resetUrl = frontendUrl ? `${frontendUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}` : "";

  // Se existir BREVO_API_KEY, envia email. Se não, mantém fluxo para teste.
  const brevoKey = context.env.BREVO_API_KEY;
  if (brevoKey && resetUrl) {
    try {
      const subject = "Redefinição de senha - Calcularq";
      const html = `
        <p>Olá, ${user.name || "usuário"}.</p>
        <p>Para redefinir sua senha, clique no link abaixo (válido por 1 hora):</p>
        <p><a href="${resetUrl}">Redefinir minha senha</a></p>
        <p>Se você não solicitou isso, ignore este email.</p>
      `;
      await sendBrevoEmail({ apiKey: brevoKey, toEmail: user.email, toName: user.name, subject, html });
    } catch {
      // Não revelar detalhes para o usuário final; logs ficam no painel Cloudflare
    }
  }

  // Em ambiente de teste, você pode querer ver o link/ token sem email:
  const debug = String(context.env.DEBUG_EMAIL_TOKENS || "0") === "1";
  return okResponse(debug ? { debugResetUrl: resetUrl, debugToken: token } : {});
}

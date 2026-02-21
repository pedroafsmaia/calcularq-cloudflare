import { jsonResponse } from "../_utils.js";
import crypto from "crypto";

// Envia email via Brevo
async function sendBrevoEmail({
  apiKey,
  senderEmail,
  senderName,
  toEmail,
  toName,
  subject,
  html,
}) {
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

export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const { email } = await request.json();

    if (!email) {
      return jsonResponse(
        { message: "Se o email existir, você receberá instruções." },
        { status: 200 }
      );
    }

    const user = await env.DB
      .prepare("SELECT id, name, email FROM users WHERE email = ?")
      .bind(email)
      .first();

    // Sempre retorna resposta genérica (evita enumeração)
    if (!user) {
      return jsonResponse(
        { message: "Se o email existir, você receberá instruções." },
        { status: 200 }
      );
    }

    // Gerar token seguro
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Expiração em 1 hora
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Apagar tokens antigos
    await env.DB
      .prepare("DELETE FROM reset_tokens WHERE user_id = ?")
      .bind(user.id)
      .run();

    // Salvar novo token (hash)
    await env.DB
      .prepare(
        "INSERT INTO reset_tokens (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, datetime('now'))"
      )
      .bind(user.id, tokenHash, expiresAt)
      .run();

    const frontendBase = String(env.FRONTEND_URL || "").replace(/\/$/, "");
    const resetUrl = `${frontendBase}/reset-password?token=${rawToken}`;

    const brevoKey = env.BREVO_API_KEY;

    if (brevoKey) {
      const senderEmail =
        env.BREVO_SENDER_EMAIL || "atendimento@calcularq.com.br";
      const senderName = env.BREVO_SENDER_NAME || "Calcularq";

      try {
        const subject = "Redefinição de senha - Calcularq";

        const html = `
<div style="font-family: Arial, sans-serif; background-color: #f6f6f6; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border-radius: 8px;">
    
    <h2 style="color: #002b5b; margin-bottom: 20px;">
      Redefinição de senha
    </h2>

    <p style="font-size: 16px; color: #333;">
      Olá, ${user.name || "usuário"}.
    </p>

    <p style="font-size: 16px; color: #333;">
      Recebemos uma solicitação para redefinir sua senha.
      Clique no botão abaixo (válido por 1 hora):
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}"
         style="background-color: #fc7338;
                color: #ffffff;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                display: inline-block;">
        Redefinir minha senha
      </a>
    </div>

    <p style="font-size: 14px; color: #666;">
      Se você não solicitou essa redefinição, ignore este email.
    </p>

    <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

    <p style="font-size: 12px; color: #999; text-align: center;">
      Calcularq © ${new Date().getFullYear()}
    </p>

  </div>
</div>
`;

        await sendBrevoEmail({
          apiKey: brevoKey,
          senderEmail,
          senderName,
          toEmail: user.email,
          toName: user.name,
          subject,
          html,
        });
      } catch (err) {
        console.log(
          "Erro ao enviar email pelo Brevo:",
          err?.message || String(err)
        );
      }
    }

    // DEBUG opcional
    if (env.DEBUG_EMAIL_TOKENS === "1") {
      return jsonResponse({
        message: "DEBUG MODE",
        resetUrl,
      });
    }

    return jsonResponse(
      { message: "Se o email existir, você receberá instruções." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro forgot-password:", error);
    return jsonResponse(
      { message: "Erro ao processar solicitação." },
      { status: 500 }
    );
  }
}

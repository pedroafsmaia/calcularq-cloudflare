import { jsonResponse } from "../_utils.js";

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

    // Sempre retorna resposta genérica (anti enumeração)
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

    if (!user) {
      return jsonResponse(
        { message: "Se o email existir, você receberá instruções." },
        { status: 200 }
      );
    }

    // ===============================
    // 🔐 GERAR TOKEN (WebCrypto)
    // ===============================

    const rawTokenBytes = new Uint8Array(32);
    crypto.getRandomValues(rawTokenBytes);

    const rawToken = Array.from(rawTokenBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const tokenBuf = new TextEncoder().encode(rawToken);
    const hashBuf = await crypto.subtle.digest("SHA-256", tokenBuf);

    const tokenHash = Array.from(new Uint8Array(hashBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // Apagar tokens antigos
    await env.DB
      .prepare("DELETE FROM reset_tokens WHERE user_id = ?")
      .bind(user.id)
      .run();

    // Salvar novo token (apenas hash)
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
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 8px;">
    
    <h2 style="color: #0b3a75; margin-bottom: 24px;">
      Redefinição de senha
    </h2>

    <p style="font-size: 16px; color: #333; margin-bottom: 16px;">
      Olá, ${user.name || "usuário"}.
    </p>

    <p style="font-size: 16px; color: #333; margin-bottom: 24px;">
      Recebemos uma solicitação para redefinir sua senha.
      Clique no botão abaixo (válido por 1 hora):
    </p>

    <div style="margin-bottom: 24px;">
      <a href="${resetUrl}"
         style="background-color: #0b3a75;
                color: #ffffff;
                padding: 12px 22px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                display: inline-block;">
        Redefinir minha senha
      </a>
    </div>

    <p style="font-size: 14px; color: #666; margin-bottom: 24px;">
      Se você não solicitou essa redefinição, ignore este email.
    </p>

    <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;">

    <p style="font-size: 12px; color: #999;">
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

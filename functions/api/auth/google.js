import {
  assertAllowedOrigin,
  jsonResponse,
  readJson,
  rateLimitByIp,
  sanitizeText,
  setSessionCookie,
  signSessionToken,
  logApiError,
} from "../_utils.js";

import { createRemoteJWKSet, jwtVerify } from "jose";

const GOOGLE_JWKS_URI = "https://www.googleapis.com/oauth2/v3/certs";
const GOOGLE_ISSUER = ["https://accounts.google.com", "accounts.google.com"];

let cachedJWKS = null;

function getGoogleJWKS() {
  if (!cachedJWKS) {
    cachedJWKS = createRemoteJWKSet(new URL(GOOGLE_JWKS_URI));
  }
  return cachedJWKS;
}

export async function onRequest(context) {
  try {
    if (context.request.method !== "POST") {
      return jsonResponse({ success: false, message: "Método não permitido" }, { status: 405 });
    }

    const badOrigin = assertAllowedOrigin(context);
    if (badOrigin) return badOrigin;

    const rate = await rateLimitByIp(context, { endpoint: "auth:google", limit: 10, windowMs: 60_000 });
    if (!rate.ok) {
      return jsonResponse(
        { success: false, message: "Muitas tentativas. Tente novamente em instantes." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
      );
    }

    const body = await readJson(context.request);
    const credential = body?.credential;

    if (!credential || typeof credential !== "string") {
      return jsonResponse({ success: false, message: "Token do Google é obrigatório" }, { status: 400 });
    }

    const db = context.env.DB;
    const jwtSecret = context.env.JWT_SECRET;
    const googleClientId = context.env.GOOGLE_CLIENT_ID;
    const registrationsDisabled = String(context.env.DISABLE_REGISTRATION || "0") === "1";

    if (!jwtSecret || String(jwtSecret).trim().length < 16) {
      return jsonResponse({ success: false, message: "Serviço indisponível no momento" }, { status: 503 });
    }
    if (!db) {
      return jsonResponse({ success: false, message: "Serviço indisponível no momento" }, { status: 503 });
    }
    if (!googleClientId) {
      return jsonResponse({ success: false, message: "Login com Google não está configurado" }, { status: 503 });
    }

    // Verify the Google ID token
    let payload;
    try {
      const jwks = getGoogleJWKS();
      const result = await jwtVerify(credential, jwks, {
        issuer: GOOGLE_ISSUER,
        audience: googleClientId,
      });
      payload = result.payload;
    } catch (err) {
      logApiError("auth/google", err, { step: "token_verification" });
      return jsonResponse({ success: false, message: "Token do Google inválido" }, { status: 401 });
    }

    const googleId = payload.sub;
    const googleEmail = String(payload.email || "").toLowerCase().trim();
    const googleName = sanitizeText(payload.name || payload.given_name || "Usuário", { max: 120, allowEmpty: false });
    const emailVerified = payload.email_verified;

    if (!googleId || !googleEmail) {
      return jsonResponse({ success: false, message: "Token do Google não contém informações necessárias" }, { status: 400 });
    }

    if (!emailVerified) {
      return jsonResponse({ success: false, message: "O e-mail do Google não foi verificado" }, { status: 400 });
    }

    const requirePayment = String(context.env.REQUIRE_PAYMENT || "0") === "1";

    // Try to find user by google_id first, then by email
    let user = null;
    try {
      user = await db
        .prepare("SELECT id, email, name, has_paid, payment_date, stripe_customer_id, created_at, google_id FROM users WHERE google_id = ?")
        .bind(googleId)
        .first();
    } catch (err) {
      const message = String(err?.message || "");
      if (!message.includes("no such column: google_id")) throw err;
      // google_id column doesn't exist yet; fall through to email lookup
    }

    if (!user) {
      // Look up by email
      user = await db
        .prepare("SELECT id, email, name, has_paid, payment_date, stripe_customer_id, created_at FROM users WHERE email = ?")
        .bind(googleEmail)
        .first();

      if (user) {
        // Link Google account to existing user
        try {
          await db
            .prepare("UPDATE users SET google_id = ? WHERE id = ?")
            .bind(googleId, user.id)
            .run();
        } catch (err) {
          const message = String(err?.message || "");
          if (!message.includes("no such column: google_id")) throw err;
          // Column doesn't exist yet, skip linking
        }
      }
    }

    if (!user) {
      if (registrationsDisabled) {
        return jsonResponse({ success: false, message: "Novos cadastros estÃ£o temporariamente desativados" }, { status: 403 });
      }

      // Create new user with Google account
      const id = crypto.randomUUID();
      // Google OAuth users don't use password login; store a sentinel that never matches PBKDF2 verification
      const password_hash = "google_oauth$none$0$0$0";
      const has_paid = requirePayment ? 0 : 1;
      const created_at = new Date().toISOString();

      try {
        await db.prepare(
          "INSERT INTO users (id, email, name, password_hash, has_paid, payment_date, stripe_customer_id, created_at, google_id) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?)"
        ).bind(id, googleEmail, googleName, password_hash, has_paid, created_at, googleId).run();
      } catch (err) {
        const message = String(err?.message || "");
        if (message.includes("no such column: google_id")) {
          // Fallback: insert without google_id if column doesn't exist yet
          await db.prepare(
            "INSERT INTO users (id, email, name, password_hash, has_paid, payment_date, stripe_customer_id, created_at) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?)"
          ).bind(id, googleEmail, googleName, password_hash, has_paid, created_at).run();
        } else {
          throw err;
        }
      }

      user = { id, email: googleEmail, name: googleName, has_paid, payment_date: null, stripe_customer_id: null, created_at };
    }

    // Sign session token and set cookie
    const token = await signSessionToken({ sub: user.id }, jwtSecret);
    const headers = new Headers();
    setSessionCookie(headers, token);

    const respUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      hasPaid: requirePayment ? !!user.has_paid : true,
      paymentDate: user.payment_date,
      stripeCustomerId: user.stripe_customer_id,
      createdAt: user.created_at,
    };

    return jsonResponse({ success: true, user: respUser }, { headers });
  } catch (error) {
    logApiError("auth/google", error);
    return jsonResponse({ success: false, message: "Erro ao processar login com Google" }, { status: 500 });
  }
}

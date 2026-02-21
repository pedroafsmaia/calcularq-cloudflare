function parseStripeSignatureHeader(sigHeader) {
  // Exemplo: "t=1700000000,v1=abc,v1=def"
  const parts = sigHeader.split(",").map(s => s.trim());
  const out = { t: null, v1: [] };

  for (const p of parts) {
    const [k, v] = p.split("=");
    if (k === "t") out.t = v;
    if (k === "v1") out.v1.push(v);
  }
  return out;
}

function timingSafeEqualHex(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyStripeWebhook({ rawBody, sigHeader, secret, toleranceSec = 300 }) {
  if (!sigHeader) return { ok: false, reason: "Missing Stripe-Signature header" };
  if (!secret) return { ok: false, reason: "Missing STRIPE_WEBHOOK_SECRET" };

  const { t, v1 } = parseStripeSignatureHeader(sigHeader);
  if (!t || !v1.length) return { ok: false, reason: "Invalid Stripe-Signature format" };

  const nowSec = Math.floor(Date.now() / 1000);
  const tSec = Number(t);
  if (!Number.isFinite(tSec)) return { ok: false, reason: "Invalid timestamp in signature" };
  if (Math.abs(nowSec - tSec) > toleranceSec) {
    return { ok: false, reason: "Timestamp outside tolerance" };
  }

  const signedPayload = `${t}.${rawBody}`;
  const expected = await hmacSha256Hex(secret, signedPayload);

  const match = v1.some(sig => timingSafeEqualHex(sig, expected));
  if (!match) return { ok: false, reason: "Signature mismatch" };

  return { ok: true };
}

export async function onRequest(context) {
  const { request, env } = context;

  // GET só para debug/manual check
  if (request.method === "GET") {
    return new Response("webhook endpoint alive", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // 1) Validar assinatura Stripe usando raw body
  const sigHeader = request.headers.get("Stripe-Signature");
  const rawBody = await request.text();

  const verified = await verifyStripeWebhook({
    rawBody,
    sigHeader,
    secret: env.STRIPE_WEBHOOK_SECRET,
  });

  if (!verified.ok) {
    console.log("Stripe webhook verify failed:", verified.reason);
    return new Response(`Invalid webhook: ${verified.reason}`, { status: 400 });
  }

  // 2) Parse do evento
  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (e) {
    return new Response("Invalid JSON", { status: 400 });
  }

  const type = event?.type;

  // 3) Eventos relevantes
  if (type === "checkout.session.completed" || type === "checkout.session.async_payment_succeeded") {
    const session = event.data?.object;

    const userId = session?.client_reference_id;
    const sessionId = session?.id || null;
    const eventId = event?.id || null;

    console.log("Stripe event:", type, "eventId:", eventId, "sessionId:", sessionId, "userId:", userId);

    if (!userId) {
      return new Response("Missing client_reference_id", { status: 200 });
    }

    // 4) Atualizar usuário como pago
    // Ajuste o nome da coluna de data se necessário:
    // - Se você usa payment_date, troque paid_at -> payment_date
    // - Se não tiver coluna de data, remova a linha toda
    await env.DB.prepare(
      `UPDATE users
       SET has_paid = 1,
           paid_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).bind(String(userId)).run();

    // Opcional: log simples
    console.log("User marked as paid:", userId);
  }

  return new Response("ok", { status: 200 });
}

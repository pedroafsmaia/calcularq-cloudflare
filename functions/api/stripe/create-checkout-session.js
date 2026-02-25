import { requireAuth, jsonResponse } from "../_utils.js";

export async function onRequestPost(context) {
  try {
    const { env } = context;

    const auth = await requireAuth(context);
    if (!auth.ok) return auth.response;
    const userId = auth.userId;

    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_ID) {
      return jsonResponse({ error: "Stripe não configurado" }, { status: 500 });
    }

    const successPath = env.STRIPE_SUCCESS_PATH || "/payment/close";
    const cancelPath = env.STRIPE_CANCEL_PATH || "/payment";

    const frontendBase = String(env.FRONTEND_URL || "").replace(/\/$/, "");
    const success = String(successPath).startsWith("/") ? String(successPath) : `/${successPath}`;
    const cancel = String(cancelPath).startsWith("/") ? String(cancelPath) : `/${cancelPath}`;

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "payment",
        "line_items[0][price]": env.STRIPE_PRICE_ID,
        "line_items[0][quantity]": "1",
        success_url: `${frontendBase}${success}`,
        cancel_url: `${frontendBase}${cancel}`,
        client_reference_id: String(userId),
        customer_creation: "always",
      }),
    });

    const session = await stripeResponse.json();
    if (!stripeResponse.ok) {
      console.error("Erro ao criar sessão Stripe:", stripeResponse.status, session);
      return jsonResponse({ error: "Erro ao criar sessão Stripe" }, { status: 500 });
    }

    return jsonResponse({ url: session.url });
  } catch (error) {
    return jsonResponse({ error: error?.message || String(error) }, { status: 500 });
  }
}

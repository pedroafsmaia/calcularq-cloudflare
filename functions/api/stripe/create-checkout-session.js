import { requireAuth, jsonResponse } from "../_utils.js";

export async function onRequestPost(context) {
  try {
    const { env } = context;

    // 1) Autenticação segura — verifica e valida o JWT via cookie (igual a todos os outros endpoints)
    const auth = await requireAuth(context);
    if (!auth.ok) return auth.response;

    const userId = auth.userId;

    // 2) Verificar configuração Stripe
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_ID) {
      return jsonResponse({ error: "Stripe não configurado" }, { status: 500 });
    }

    const successPath = env.STRIPE_SUCCESS_PATH || "/payment/close";
    const cancelPath = env.STRIPE_CANCEL_PATH || "/payment";

    // 3) Criar Checkout Session (pagamento único)
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
        success_url: `${env.FRONTEND_URL}${successPath}`,
        cancel_url: `${env.FRONTEND_URL}${cancelPath}`,
        client_reference_id: String(userId),
        customer_creation: "always",
      }),
    });

    const session = await stripeResponse.json();

    if (!stripeResponse.ok) {
      return jsonResponse({ error: "Erro ao criar sessão Stripe", details: session }, { status: 500 });
    }

    return jsonResponse({ url: session.url });
  } catch (error) {
    return jsonResponse({ error: error?.message || String(error) }, { status: 500 });
  }
}

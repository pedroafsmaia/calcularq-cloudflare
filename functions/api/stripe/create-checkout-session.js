export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    // Verificar se está logado
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.userId;

    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_ID) {
      return new Response(JSON.stringify({ error: "Stripe não configurado" }), { status: 500 });
    }

    // Criar sessão no Stripe
    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        mode: "payment",
        "line_items[0][price]": env.STRIPE_PRICE_ID,
        "line_items[0][quantity]": "1",
        success_url: `${env.FRONTEND_URL}${env.STRIPE_SUCCESS_PATH}`,
        cancel_url: `${env.FRONTEND_URL}${env.STRIPE_CANCEL_PATH}`,
        client_reference_id: userId,
      }),
    });

    const session = await stripeResponse.json();

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
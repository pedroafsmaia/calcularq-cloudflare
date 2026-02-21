export async function onRequestPost(context) {
  try {
    const { request, env } = context;

    // ----------------------------
    // 1) Descobrir o userId (sessão)
    //    Primeiro tenta Authorization Bearer,
    //    depois cai para o cookie calcularq_session (seu app usa cookie)
    // ----------------------------
    let userId = null;

    // 1a) Authorization: Bearer <jwt>
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.slice("Bearer ".length);
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload.userId || payload.sub || payload.id || null;
      } catch (_) {
        // ignora e tenta cookie
      }
    }

    // 1b) Cookie: calcularq_session=<jwt>
    if (!userId) {
      const cookie = request.headers.get("Cookie") || "";
      const match = cookie.match(/(?:^|;\s*)calcularq_session=([^;]+)/);

      if (!match) {
        return new Response(JSON.stringify({ error: "Não autenticado" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      try {
        const token = decodeURIComponent(match[1]);
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload.userId || payload.sub || payload.id || null;
      } catch (e) {
        return new Response(JSON.stringify({ error: "Sessão inválida" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado na sessão" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ----------------------------
    // 2) Verificar configuração Stripe
    // ----------------------------
    if (!env.STRIPE_SECRET_KEY || !env.STRIPE_PRICE_ID) {
      return new Response(JSON.stringify({ error: "Stripe não configurado" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const successPath = env.STRIPE_SUCCESS_PATH || "/payment";
    const cancelPath = env.STRIPE_CANCEL_PATH || "/payment";

    // ----------------------------
    // 3) Criar Checkout Session (pagamento único)
    // ----------------------------
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
      }),
    });

    const session = await stripeResponse.json();

    // Se a Stripe devolveu erro, repassamos com detalhes
    if (!stripeResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Erro ao criar sessão Stripe", details: session }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error?.message || String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

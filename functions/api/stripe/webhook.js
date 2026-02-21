export async function onRequest(context) {
  const { request } = context;

  // Para teste no navegador
  if (request.method === "GET") {
    return new Response("webhook endpoint alive", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Por enquanto, só retorna OK para desbloquear o Stripe
  const body = await request.text();
  console.log("Webhook POST received. Body length:", body.length);

  return new Response("ok", { status: 200 });
}

import { jsonResponse, requireAuth } from "../_utils.js";

export async function onRequest(context) {
  const auth = await requireAuth(context);
  if (!auth.ok) return auth.response;

  // Stripe no Workers requer implementação específica (edge compatible).
  // Para o deploy de teste sem pagamentos, retornamos um erro explicativo.
  return jsonResponse({ success: false, message: "Checkout não configurado neste deploy (teste sem pagamentos)." }, { status: 501 });
}

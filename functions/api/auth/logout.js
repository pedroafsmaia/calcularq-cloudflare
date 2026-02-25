import { assertAllowedOrigin, clearSessionCookie, jsonResponse } from "../_utils.js";

export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return jsonResponse({ success: false, message: "Método não permitido" }, { status: 405 });
  }

  const badOrigin = assertAllowedOrigin(context);
  if (badOrigin) return badOrigin;

  const headers = new Headers();
  clearSessionCookie(headers);
  return jsonResponse({ success: true }, { headers });
}

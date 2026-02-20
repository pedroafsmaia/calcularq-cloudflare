import { jsonResponse, clearSessionCookie } from "../_utils.js";

export async function onRequest(context) {
  const headers = new Headers();
  clearSessionCookie(headers);
  return jsonResponse({ success: true }, { headers });
}

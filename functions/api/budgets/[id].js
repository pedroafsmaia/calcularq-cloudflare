import { assertAllowedOrigin, jsonResponse, requireAuth } from "../_utils.js";

export async function onRequest(context) {
  const auth = await requireAuth(context);
  if (!auth.ok) return auth.response;

  const url = new URL(context.request.url);
  const parts = url.pathname.split("/");
  const id = String(parts[parts.length - 1] || "").trim();
  if (!id || id.length > 120) {
    return jsonResponse({ success: false, message: "ID inválido" }, { status: 400 });
  }

  const db = context.env.DB;
  const method = context.request.method;

  if (method === "GET") {
    const budget = await db.prepare(
      "SELECT id, user_id, name, client_name, project_name, data, created_at, updated_at FROM budgets WHERE id = ? AND user_id = ?"
    ).bind(id, auth.userId).first();

    if (!budget) return jsonResponse({ success: false, message: "Não encontrado" }, { status: 404 });

    return jsonResponse({
      success: true,
      budget: {
        id: budget.id,
        userId: budget.user_id,
        name: budget.name,
        clientName: budget.client_name,
        projectName: budget.project_name,
        data: (() => { try { return JSON.parse(budget.data); } catch { return null; } })(),
        createdAt: budget.created_at,
        updatedAt: budget.updated_at,
      },
    });
  }

  if (method === "DELETE") {
    const badOrigin = assertAllowedOrigin(context);
    if (badOrigin) return badOrigin;

    await db.prepare("DELETE FROM budgets WHERE id = ? AND user_id = ?").bind(id, auth.userId).run();
    return jsonResponse({ success: true });
  }

  return jsonResponse({ success: false, message: "Método não permitido" }, { status: 405 });
}

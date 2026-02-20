import { jsonResponse, readJson, requireAuth } from "../_utils.js";

export async function onRequest(context) {
  const auth = await requireAuth(context);
  if (!auth.ok) return auth.response;

  const db = context.env.DB;
  const method = context.request.method;

  if (method === "GET") {
    const { results } = await db.prepare(
      "SELECT id, user_id, name, client_name, project_name, data, created_at, updated_at FROM budgets WHERE user_id = ? ORDER BY updated_at DESC"
    ).bind(auth.userId).all();

    const budgets = (results || []).map(b => ({
      id: b.id,
      userId: b.user_id,
      name: b.name,
      clientName: b.client_name,
      projectName: b.project_name,
      data: (() => { try { return JSON.parse(b.data); } catch { return null; } })(),
      createdAt: b.created_at,
      updatedAt: b.updated_at
    }));

    return jsonResponse({ success: true, budgets });
  }

  if (method === "POST") {
    const body = await readJson(context.request);
    if (!body?.name || !body?.data) {
      return jsonResponse({ success: false, message: "Nome e dados são obrigatórios" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const id = body?.id ? String(body.id) : crypto.randomUUID();
    const name = String(body.name).trim();
    const clientName = body.clientName ? String(body.clientName) : null;
    const projectName = body.projectName ? String(body.projectName) : null;
    const data = JSON.stringify(body.data);

    // Upsert (atualiza se existe e pertence ao usuário)
    const existing = await db.prepare("SELECT id FROM budgets WHERE id = ? AND user_id = ?").bind(id, auth.userId).first();

    if (existing) {
      await db.prepare(
        "UPDATE budgets SET name = ?, client_name = ?, project_name = ?, data = ?, updated_at = ? WHERE id = ? AND user_id = ?"
      ).bind(name, clientName, projectName, data, now, id, auth.userId).run();
    } else {
      await db.prepare(
        "INSERT INTO budgets (id, user_id, name, client_name, project_name, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(id, auth.userId, name, clientName, projectName, data, now, now).run();
    }

    const budget = await db.prepare(
      "SELECT id, user_id, name, client_name, project_name, data, created_at, updated_at FROM budgets WHERE id = ? AND user_id = ?"
    ).bind(id, auth.userId).first();

    return jsonResponse({
      success: true,
      budget: {
        id: budget.id,
        userId: budget.user_id,
        name: budget.name,
        clientName: budget.client_name,
        projectName: budget.project_name,
        data: JSON.parse(budget.data),
        createdAt: budget.created_at,
        updatedAt: budget.updated_at
      }
    });
  }

  return jsonResponse({ success: false, message: "Método não permitido" }, { status: 405 });
}

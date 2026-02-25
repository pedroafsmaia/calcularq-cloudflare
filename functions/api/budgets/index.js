import { assertAllowedOrigin, jsonResponse, readJson, requireAuth, sanitizeText } from "../_utils.js";

const MAX_BUDGETS_PER_USER = 200;
const MAX_BUDGET_JSON_BYTES = 180_000;
const MAX_NAME_LEN = 120;
const MAX_CLIENT_NAME_LEN = 120;
const MAX_PROJECT_NAME_LEN = 160;
const MAX_DESCRIPTION_LEN = 2000;

function estimateBytes(value) {
  try {
    return new TextEncoder().encode(String(value)).length;
  } catch {
    return String(value).length;
  }
}

function validateBudgetDataShape(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return "Dados do cálculo inválidos";
  }
  if (!data.results || typeof data.results !== "object") {
    return "Resultados do cálculo são obrigatórios";
  }
  if (typeof data.results.finalSalePrice !== "number" || !Number.isFinite(data.results.finalSalePrice)) {
    return "Resultado final do cálculo inválido";
  }

  const arraysToLimit = ["fixedExpenses", "personalExpenses", "variableExpenses", "factors", "areaIntervals"];
  for (const key of arraysToLimit) {
    if (data[key] !== undefined) {
      if (!Array.isArray(data[key])) return `Campo ${key} inválido`;
      if (data[key].length > 100) return `Campo ${key} excede o limite de itens`;
    }
  }

  if (typeof data.description === "string" && data.description.length > MAX_DESCRIPTION_LEN) {
    return "Descrição muito longa";
  }

  return null;
}

export async function onRequest(context) {
  const auth = await requireAuth(context);
  if (!auth.ok) return auth.response;

  const db = context.env.DB;
  const method = context.request.method;

  if (method === "GET") {
    const { results } = await db.prepare(
      "SELECT id, user_id, name, client_name, project_name, data, created_at, updated_at FROM budgets WHERE user_id = ? ORDER BY updated_at DESC"
    ).bind(auth.userId).all();

    const budgets = (results || []).map((b) => ({
      id: b.id,
      userId: b.user_id,
      name: b.name,
      clientName: b.client_name,
      projectName: b.project_name,
      data: (() => {
        try { return JSON.parse(b.data); } catch { return null; }
      })(),
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    }));

    return jsonResponse({ success: true, budgets });
  }

  if (method === "POST") {
    const badOrigin = assertAllowedOrigin(context);
    if (badOrigin) return badOrigin;

    const body = await readJson(context.request);
    if (!body?.name || !body?.data) {
      return jsonResponse({ success: false, message: "Nome e dados são obrigatórios" }, { status: 400 });
    }

    const id = body?.id ? String(body.id).trim() : crypto.randomUUID();
    if (id.length > 120) {
      return jsonResponse({ success: false, message: "ID de cálculo inválido" }, { status: 400 });
    }

    const shapeError = validateBudgetDataShape(body.data);
    if (shapeError) {
      return jsonResponse({ success: false, message: shapeError }, { status: 400 });
    }

    const data = JSON.stringify(body.data);
    if (estimateBytes(data) > MAX_BUDGET_JSON_BYTES) {
      return jsonResponse({ success: false, message: "Cálculo muito grande para salvar" }, { status: 413 });
    }

    const now = new Date().toISOString();
    const name = sanitizeText(body.name, { max: MAX_NAME_LEN, allowEmpty: false });
    const clientName = sanitizeText(body.clientName, { max: MAX_CLIENT_NAME_LEN, allowEmpty: true });
    const projectName = sanitizeText(body.projectName, { max: MAX_PROJECT_NAME_LEN, allowEmpty: true });

    if (!name) {
      return jsonResponse({ success: false, message: "Nome do cálculo é obrigatório" }, { status: 400 });
    }

    const existing = await db.prepare("SELECT id FROM budgets WHERE id = ? AND user_id = ?").bind(id, auth.userId).first();

    if (!existing) {
      const countRow = await db.prepare("SELECT COUNT(*) as total FROM budgets WHERE user_id = ?").bind(auth.userId).first();
      const total = Number(countRow?.total || 0);
      if (total >= MAX_BUDGETS_PER_USER) {
        return jsonResponse({ success: false, message: "Limite de cálculos salvos atingido" }, { status: 400 });
      }
    }

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
        updatedAt: budget.updated_at,
      },
    });
  }

  return jsonResponse({ success: false, message: "Método não permitido" }, { status: 405 });
}

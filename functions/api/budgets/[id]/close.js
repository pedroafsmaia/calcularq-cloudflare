import { assertAllowedOrigin, jsonResponse, rateLimitByIp, readJson, requireAuth } from "../../_utils.js";

const VALID_SCOPE_CHANGES = new Set(["as_planned", "moderate", "major"]);
const VALID_CLOSE_FEEDBACK = new Set([
  "too_expensive",
  "accepted_no_questions",
  "accepted_after_negotiation",
  "could_charge_more",
  "did_not_close_other",
]);
const PHASE_KEYS = ["briefing", "ep", "ap", "ex", "compat", "obra"];

function toPositiveNumber(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return value;
}

function toNonNegativeNumber(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return null;
  return value;
}

function normalizeHoursByPhase(value) {
  if (value === undefined || value === null) return { value: null, error: null };
  if (typeof value !== "object" || Array.isArray(value)) {
    return { value: null, error: "Horas por etapa inválidas" };
  }

  const result = {};
  let hasAny = false;
  for (const key of PHASE_KEYS) {
    if (value[key] === undefined || value[key] === null || value[key] === "") continue;
    const parsed = Number(value[key]);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { value: null, error: `Valor inválido em ${key}` };
    }
    result[key] = parsed;
    hasAny = true;
  }

  return { value: hasAny ? result : null, error: null };
}

function parseBudgetData(rawData) {
  try {
    const parsed = JSON.parse(rawData);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    return {};
  } catch {
    return {};
  }
}

export async function onRequest(context) {
  const auth = await requireAuth(context);
  if (!auth.ok) return auth.response;

  if (context.request.method !== "PATCH") {
    return jsonResponse({ success: false, message: "Método não permitido" }, { status: 405 });
  }

  const badOrigin = assertAllowedOrigin(context);
  if (badOrigin) return badOrigin;

  const rate = await rateLimitByIp(context, { endpoint: "budgets:close", limit: 60, windowMs: 60_000 });
  if (!rate.ok) {
    return jsonResponse(
      { success: false, message: "Muitas tentativas. Tente novamente em instantes." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const url = new URL(context.request.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const id = String(parts[parts.length - 2] || "").trim();

  if (!id || id.length > 120) {
    return jsonResponse({ success: false, message: "ID inválido" }, { status: 400 });
  }

  const body = await readJson(context.request);
  const actualHoursTotal = toPositiveNumber(body?.actualHoursTotal);
  if (!actualHoursTotal) {
    return jsonResponse({ success: false, message: "Horas totais reais devem ser maiores que zero" }, { status: 400 });
  }

  const scopeChange = String(body?.scopeChange || "").trim();
  if (!VALID_SCOPE_CHANGES.has(scopeChange)) {
    return jsonResponse({ success: false, message: "Status de escopo inválido" }, { status: 400 });
  }

  const closeFeedback = String(body?.closeFeedback || "").trim();
  if (!VALID_CLOSE_FEEDBACK.has(closeFeedback)) {
    return jsonResponse({ success: false, message: "Feedback de fechamento inválido" }, { status: 400 });
  }

  const hasClosedDealValue = body?.closedDealValue !== undefined && body?.closedDealValue !== null && body?.closedDealValue !== "";
  let closedDealValue = null;
  if (hasClosedDealValue) {
    closedDealValue = toNonNegativeNumber(Number(body.closedDealValue));
    if (closedDealValue === null) {
      return jsonResponse({ success: false, message: "Valor fechado inválido" }, { status: 400 });
    }
  }

  const normalizedByPhase = normalizeHoursByPhase(body?.actualHoursByPhase);
  if (normalizedByPhase.error) {
    return jsonResponse({ success: false, message: normalizedByPhase.error }, { status: 400 });
  }

  let hasPhaseMismatch = false;
  if (normalizedByPhase.value) {
    const phaseSum = Object.values(normalizedByPhase.value).reduce((sum, value) => sum + Number(value || 0), 0);
    hasPhaseMismatch = phaseSum < actualHoursTotal * 0.8 || phaseSum > actualHoursTotal * 1.2;
  }

  const db = context.env.DB;
  const existing = await db
    .prepare("SELECT id, user_id, name, client_name, project_name, data, created_at, updated_at FROM budgets WHERE id = ? AND user_id = ?")
    .bind(id, auth.userId)
    .first();

  if (!existing) {
    return jsonResponse({ success: false, message: "Cálculo não encontrado" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const data = parseBudgetData(existing.data);
  data.actualHoursTotal = actualHoursTotal;
  if (normalizedByPhase.value) {
    data.actualHoursByPhase = normalizedByPhase.value;
  } else {
    delete data.actualHoursByPhase;
  }
  data.scopeChange = scopeChange;
  data.closeFeedback = closeFeedback;
  data.closedAt = now;
  data.hasPhaseMismatch = hasPhaseMismatch;
  if (hasClosedDealValue && closedDealValue !== null) {
    const variableExpenses = Array.isArray(data.variableExpenses) ? data.variableExpenses : [];
    const despesasVariaveisTotal = variableExpenses.reduce((sum, expense) => {
      const value = Number(expense?.value);
      return Number.isFinite(value) ? sum + value : sum;
    }, 0);

    data.closedDealValue = closedDealValue;
    data.closedDealContext = {
      budgetId: id,
      tipologia: typeof data.tipologia === "string" ? data.tipologia : undefined,
      scoreComplexidade: Number.isFinite(Number(data.scoreComplexidade)) ? Number(data.scoreComplexidade) : undefined,
      classificacaoComplexidade: typeof data.classificacaoComplexidade === "string" ? data.classificacaoComplexidade : undefined,
      horasEscolhidas: Number.isFinite(Number(data.hFinal)) ? Number(data.hFinal) : Number.isFinite(Number(data.estimatedHours)) ? Number(data.estimatedHours) : undefined,
      descontoAplicado: Number.isFinite(Number(data.commercialDiscount)) ? Number(data.commercialDiscount) : undefined,
      despesasVariaveisTotal,
      propostaCalculada: Number.isFinite(Number(data.results?.finalSalePrice)) ? Number(data.results.finalSalePrice) : undefined,
      registradoEm: now,
    };
  }

  const serialized = JSON.stringify(data);

  try {
    await db
      .prepare("UPDATE budgets SET data = ?, closed_at = ?, updated_at = ? WHERE id = ? AND user_id = ?")
      .bind(serialized, now, now, id, auth.userId)
      .run();
  } catch {
    await db.prepare("UPDATE budgets SET data = ?, updated_at = ? WHERE id = ? AND user_id = ?").bind(serialized, now, id, auth.userId).run();
  }

  const budget = await db
    .prepare("SELECT id, user_id, name, client_name, project_name, data, created_at, updated_at FROM budgets WHERE id = ? AND user_id = ?")
    .bind(id, auth.userId)
    .first();

  return jsonResponse({
    success: true,
    budget: {
      id: budget.id,
      userId: budget.user_id,
      name: budget.name,
      clientName: budget.client_name,
      projectName: budget.project_name,
      data: parseBudgetData(budget.data),
      createdAt: budget.created_at,
      updatedAt: budget.updated_at,
    },
  });
}


import { describe, expect, it } from "vitest";
import { buildBudgetsFilterQuery } from "./_admin_utils.js";

describe("buildBudgetsFilterQuery", () => {
  it("monta SQL sem filtros", () => {
    const { sql, binds } = buildBudgetsFilterQuery({});
    expect(sql).toContain("SELECT id, data, created_at, updated_at, closed_at FROM budgets");
    expect(sql).not.toContain("WHERE");
    expect(binds).toEqual([]);
  });

  it("aplica filtros principais no WHERE", () => {
    const { sql, binds } = buildBudgetsFilterQuery({
      periodStart: "2026-01-01",
      periodEnd: "2026-02-01",
      tipologia: "comercial",
      areaMin: 100,
      areaMax: 250,
      feedbackOnly: true,
      reforma: "true",
      closeStatus: "closed",
    });

    expect(sql).toContain("created_at >= ?");
    expect(sql).toContain("created_at <= ?");
    expect(sql).toContain("closed_at IS NOT NULL");
    expect(sql).toContain("json_extract(data, '$.tipologia') = ?");
    expect(sql).toContain("CAST(json_extract(data, '$.area') AS REAL) >= ?");
    expect(sql).toContain("CAST(json_extract(data, '$.area') AS REAL) <= ?");
    expect(sql).toContain("json_extract(data, '$.reforma') = 1");
    expect(sql).toContain("json_extract(data, '$.closeFeedback') IN");
    expect(binds).toEqual([
      "2026-01-01",
      "2026-02-01",
      "comercial",
      100,
      250,
      "accepted_no_questions",
      "accepted_after_negotiation",
    ]);
  });
});

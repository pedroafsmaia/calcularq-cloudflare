import { describe, expect, it } from "vitest";

import { calculateLegacyMethod10 } from "./PricingEngineLegacy10";

const input = {
  ht_min: 55,
  margem_lucro: 0.15,
  area: 120,
  etapa: 4,
  tipologia: "residencial" as const,
  volumetria: 2,
  reforma: false,
  f3_detalhamento: 3,
  f4_tecnica: 3,
  f5_burocracia: 2,
  f6_obra: 2,
  cenario: "conservador" as const,
  A: 0.25,
};

describe("PricingEngineLegacy10", () => {
  it("preserva o comportamento do método 1.0 para cálculos reabertos", () => {
    const result = calculateLegacyMethod10(input);

    expect(result.method_version).toBe("beta");
    expect(result.h_final).toBe(result.h_cons);
    expect(result.preco_final).toBe(21545.69);
  });

  it("aplica a incerteza às horas manuais no cenário conservador", () => {
    const optimistic = calculateLegacyMethod10({ ...input, cenario: "otimista", h_usuario_manual: 100 });
    const conservative = calculateLegacyMethod10({ ...input, h_usuario_manual: 100 });

    expect(optimistic.h_final).toBe(100);
    expect(conservative.h_final).toBeGreaterThan(100);
  });
});

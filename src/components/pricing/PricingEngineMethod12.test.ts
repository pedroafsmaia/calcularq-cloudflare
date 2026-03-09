import { describe, expect, it } from "vitest";

import { calcularMethod10, type Method10Input } from "./PricingEngineMethod12";

function buildInput(overrides: Partial<Method10Input> = {}): Method10Input {
  return {
    ht_min: 55,
    margem_lucro: 0.15,
    area: 120,
    etapa: 4,
    tipologia: "residencial",
    volumetria: 2,
    reforma: false,
    f3_detalhamento: 3,
    f4_tecnica: 3,
    f5_burocracia: 2,
    f6_obra: 2,
    cenario: "conservador",
    A: 0.25,
    ...overrides,
  };
}

describe("PricingEngineMethod12 invariants", () => {
  it("aplica pr?mio t?cnico m?ximo apenas no n?vel t?cnico m?ximo", () => {
    const lowTechnical = calcularMethod10(buildInput({ f4_tecnica: 1, A: 0.35, f6_obra: 1 }));
    const maxTechnical = calcularMethod10(buildInput({ f4_tecnica: 5, A: 0.35, f6_obra: 1 }));

    expect(lowTechnical.breakdown.c_tech).toBe(0);
    expect(lowTechnical.breakdown.premio_tecnico).toBe(0);
    expect(maxTechnical.breakdown.c_tech).toBe(1);
    expect(maxTechnical.breakdown.premio_tecnico).toBe(0.35);
  });

  it("mant?m cen?rio conservador acima do otimista para a mesma entrada", () => {
    const optimistic = calcularMethod10(buildInput({ cenario: "otimista", f6_obra: 1 }));
    const conservative = calcularMethod10(buildInput({ cenario: "conservador", f6_obra: 1 }));

    expect(conservative.h_final).toBe(conservative.h_cons);
    expect(optimistic.h_final).toBe(optimistic.h50);
    expect(conservative.h_final).toBeGreaterThan(optimistic.h_final);
    expect(conservative.preco_final).toBeGreaterThan(optimistic.preco_final);
  });

  it("aplica a incerteza tamb?m sobre horas manuais no cen?rio conservador", () => {
    const optimisticManual = calcularMethod10(buildInput({ h_usuario_manual: 100, cenario: "otimista", f6_obra: 1 }));
    const conservativeManual = calcularMethod10(buildInput({ h_usuario_manual: 100, cenario: "conservador", f6_obra: 1 }));

    expect(optimisticManual.usuario_editou_horas).toBe(true);
    expect(optimisticManual.h_final).toBe(100);
    expect(conservativeManual.h_final).toBeGreaterThan(100);
  });

  it("lan?a erro para entradas inv?lidas", () => {
    expect(() => calcularMethod10(buildInput({ area: 0 }))).toThrow("Area invalida");
    expect(() => calcularMethod10(buildInput({ ht_min: 0 }))).toThrow("HT_min invalida");
    expect(() => calcularMethod10(buildInput({ margem_lucro: -0.1 }))).toThrow("Margem invalida");
    expect(() => calcularMethod10(buildInput({ etapa: 8 }))).toThrow("Etapa invalida");
  });

  it("ativa horas de obra apenas quando F6 ? maior que 1", () => {
    const withoutObra = calcularMethod10(buildInput({ f6_obra: 1 }));
    const withObra = calcularMethod10(buildInput({ f6_obra: 4 }));

    expect(withoutObra.breakdown.h_obra).toBe(0);
    expect(withObra.breakdown.h_obra).toBeGreaterThan(0);
    expect(withObra.h50).toBeGreaterThan(withoutObra.h50);
  });
});

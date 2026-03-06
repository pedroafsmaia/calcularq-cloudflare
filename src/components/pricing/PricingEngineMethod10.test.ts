import { describe, expect, it } from "vitest";

import {
  ETAPA_MULTIPLIERS,
  M_DET,
  T_TIPOLOGIA,
  V_VOLUMETRIA,
  calcularComponenteFixa,
  calcularMethod10,
  calcularProdutividade,
  type Method10Input,
} from "./PricingEngineMethod10";

const EXECUTIVO_ETAPA = ETAPA_MULTIPLIERS[4];

function oldProjectHours(input: {
  area: number;
  f3: number;
  tipologia: keyof typeof T_TIPOLOGIA;
  volumetria: number;
  etapaMultiplier: number;
}): number {
  const r = calcularProdutividade(input.area);
  const mDet = M_DET[input.f3 - 1];
  const t = T_TIPOLOGIA[input.tipologia];
  const v = V_VOLUMETRIA[input.volumetria - 1];
  return input.area * r * mDet * t * v * input.etapaMultiplier;
}

function newProjectHours(input: {
  area: number;
  f3: number;
  tipologia: keyof typeof T_TIPOLOGIA;
  volumetria: number;
  etapaMultiplier: number;
}): number {
  const hVar = oldProjectHours(input);
  const hFix = calcularComponenteFixa(input.area, input.etapaMultiplier);
  return hVar + hFix;
}

function buildInput(overrides: Partial<Method10Input> = {}): Method10Input {
  return {
    ht_min: 40,
    margem_lucro: 0.1,
    area: 80,
    etapa: 4,
    tipologia: "residencial",
    volumetria: 1,
    reforma: false,
    f3_detalhamento: 3,
    f4_tecnica: 2,
    f5_burocracia: 1,
    f6_obra: 1,
    cenario: "otimista",
    A: 0.25,
    ...overrides,
  };
}

describe("PricingEngineMethod10 (Metodo 1.2)", () => {
  it("mantem deslocamento pequeno no miolo para areas medias e grandes", () => {
    const cases = [
      { area: 50, f3: 2, f4: 1, f5: 1, volumetria: 1 },
      { area: 80, f3: 3, f4: 2, f5: 1, volumetria: 1 },
      { area: 120, f3: 4, f4: 3, f5: 2, volumetria: 2 },
      { area: 250, f3: 3, f4: 2, f5: 2, volumetria: 2 },
      { area: 500, f3: 3, f4: 3, f5: 2, volumetria: 2 },
    ] as const;

    let previousDelta = Number.POSITIVE_INFINITY;
    for (const item of cases) {
      const oldH50 = oldProjectHours({
        area: item.area,
        f3: item.f3,
        tipologia: "residencial",
        volumetria: item.volumetria,
        etapaMultiplier: EXECUTIVO_ETAPA,
      });
      const newH50 = newProjectHours({
        area: item.area,
        f3: item.f3,
        tipologia: "residencial",
        volumetria: item.volumetria,
        etapaMultiplier: EXECUTIVO_ETAPA,
      });

      const ratio = newH50 / oldH50;
      expect(newH50).toBeGreaterThan(oldH50);
      expect(ratio).toBeLessThan(1.06);

      const delta = newH50 - oldH50;
      expect(delta).toBeLessThanOrEqual(previousDelta);
      previousDelta = delta;
    }
  });

  it("corrige subestimativa em microprojetos", () => {
    const cases = [
      { area: 7, f3: 1, f4: 2, f5: 1, volumetria: 1 },
      { area: 12, f3: 4, f4: 3, f5: 2, volumetria: 1 },
      { area: 15, f3: 3, f4: 2, f5: 1, volumetria: 1 },
    ] as const;

    for (const item of cases) {
      const oldH50 = oldProjectHours({
        area: item.area,
        f3: item.f3,
        tipologia: "residencial",
        volumetria: item.volumetria,
        etapaMultiplier: EXECUTIVO_ETAPA,
      });
      const newH50 = newProjectHours({
        area: item.area,
        f3: item.f3,
        tipologia: "residencial",
        volumetria: item.volumetria,
        etapaMultiplier: EXECUTIVO_ETAPA,
      });

      expect(newH50).toBeGreaterThan(oldH50);
      expect(newH50 - oldH50).toBeGreaterThan(3);
    }
  });

  it("mantem continuidade do nucleo de horas com crescimento suave por area", () => {
    const areas = [7, 10, 15, 20, 30, 50, 80, 120];
    const values = areas.map((area) =>
      newProjectHours({
        area,
        f3: 3,
        tipologia: "residencial",
        volumetria: 1,
        etapaMultiplier: EXECUTIVO_ETAPA,
      })
    );

    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
      const slope = values[i] - values[i - 1];
      expect(slope).toBeLessThan(50);
    }
  });

  it("preserva compatibilidade: h_cons acima de h50, preco com horas arredondadas e obra ativa no F6", () => {
    const noObra = calcularMethod10(buildInput({ area: 120, f6_obra: 1, cenario: "conservador" }));
    const withObra = calcularMethod10(buildInput({ area: 120, f6_obra: 5, cenario: "conservador" }));

    expect(noObra.h_cons).toBeGreaterThan(noObra.h50);
    expect(withObra.h50).toBeGreaterThan(noObra.h50);
    expect(withObra.breakdown.h_obra).toBeGreaterThan(0);

    const cTech = (2 - 1) / 4;
    const premio = 0.25 * cTech;
    const htAjRaw = 40 * (1 + 0.1 + premio);
    expect(noObra.preco_h50).toBe(Number((noObra.h50 * htAjRaw).toFixed(2)));
    expect(noObra.preco_conservador).toBe(Number((noObra.h_cons * htAjRaw).toFixed(2)));
    expect(noObra.method_version).toBe("1.2.0");
  });

  it("gera snapshot numerico esperado para microprojeto de 7m²", () => {
    const output = calcularMethod10(
      buildInput({
        area: 7,
        etapa: 4,
        tipologia: "residencial",
        volumetria: 1,
        reforma: false,
        f3_detalhamento: 1,
        f4_tecnica: 2,
        f5_burocracia: 1,
        f6_obra: 1,
        ht_min: 40,
        margem_lucro: 0.1,
        cenario: "otimista",
      })
    );

    expect(output.breakdown.h_fix).toBeGreaterThan(10);
    expect(output.h50).toBeGreaterThanOrEqual(18);
    expect(output.h50).toBeLessThanOrEqual(20);
  });
});


import { describe, expect, it } from "vitest";

import { getMaxStepReachedFromState } from "./useCalculatorProgress";

describe("getMaxStepReachedFromState", () => {
  it("mantém na etapa 1 quando hora mínima não foi definida", () => {
    expect(
      getMaxStepReachedFromState({
        minHourlyRate: null,
        hasComplexitySelections: false,
      })
    ).toBe(1);

    expect(
      getMaxStepReachedFromState({
        minHourlyRate: 0,
        hasComplexitySelections: true,
      })
    ).toBe(1);
  });

  it("avança até etapa 2 quando já há hora mínima mas sem fatores classificados", () => {
    expect(
      getMaxStepReachedFromState({
        minHourlyRate: 24.5,
        hasComplexitySelections: false,
      })
    ).toBe(2);
  });

  it("libera até etapa 4 quando fatores de complexidade foram preenchidos", () => {
    expect(
      getMaxStepReachedFromState({
        minHourlyRate: 24.5,
        hasComplexitySelections: true,
      })
    ).toBe(4);
  });
});


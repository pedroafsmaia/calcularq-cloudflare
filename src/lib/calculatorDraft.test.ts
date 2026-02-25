import { describe, expect, it } from "vitest";

import {
  CALCULATOR_DRAFT_KEY,
  clearCalculatorDraft,
  loadCalculatorDraft,
  saveCalculatorDraft,
} from "./calculatorDraft";
import type { CalculatorDraft } from "@/types/budget";

function makeDraft(): CalculatorDraft {
  return {
    currentStep: 2,
    maxStepReached: 4,
    minHourlyRate: 42,
    useManualMinHourlyRate: false,
    fixedExpenses: [{ id: "f1", name: "Aluguel", value: 1000 }],
    personalExpenses: [{ id: "p1", name: "Moradia", value: 2000 }],
    productiveHours: 120,
    factors: [{ id: "area", weight: 2 }],
    areaIntervals: [],
    area: 140,
    selections: {
      area: 2,
      phase: 3,
      detail: 4,
      technical: 2,
      bureaucracy: 1,
      site: 5,
    },
    estimatedHours: 100,
    variableExpenses: [{ id: "v1", name: "RRT", value: 300 }],
    commercialDiscount: 10,
    savedAt: Date.now(),
  };
}

describe("calculatorDraft", () => {
  it("salva e carrega o rascunho no localStorage", () => {
    const draft = makeDraft();

    saveCalculatorDraft(draft);

    expect(loadCalculatorDraft()).toEqual(draft);
  });

  it("limpa o rascunho salvo", () => {
    saveCalculatorDraft(makeDraft());

    clearCalculatorDraft();

    expect(localStorage.getItem(CALCULATOR_DRAFT_KEY)).toBeNull();
    expect(loadCalculatorDraft()).toBeNull();
  });

  it("retorna null se o JSON estiver inválido", () => {
    localStorage.setItem(CALCULATOR_DRAFT_KEY, "{invalid-json");

    expect(loadCalculatorDraft()).toBeNull();
  });
});

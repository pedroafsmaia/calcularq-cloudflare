import type { CalculatorDraft } from "@/types/budget";

export const CALCULATOR_DRAFT_KEY = "calcularq_draft_v1";

export function saveCalculatorDraft(data: CalculatorDraft) {
  try {
    localStorage.setItem(CALCULATOR_DRAFT_KEY, JSON.stringify(data));
  } catch {
    // noop
  }
}

export function loadCalculatorDraft(): CalculatorDraft | null {
  try {
    const raw = localStorage.getItem(CALCULATOR_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as CalculatorDraft) : null;
  } catch {
    return null;
  }
}

export function clearCalculatorDraft() {
  try {
    localStorage.removeItem(CALCULATOR_DRAFT_KEY);
  } catch {
    // noop
  }
}

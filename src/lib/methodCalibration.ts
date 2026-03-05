export const METHOD_11_TECHNICAL_PREMIUM_VALUES = [0.15, 0.25, 0.35] as const;
export type Method11TechnicalPremium = (typeof METHOD_11_TECHNICAL_PREMIUM_VALUES)[number];

export const DEFAULT_METHOD_11_TECHNICAL_PREMIUM: Method11TechnicalPremium = 0.25;
const LEGACY_METHOD_10_HIGH_TECHNICAL_PREMIUM = 0.45;
const EPSILON = 1e-6;

const isCloseTo = (value: number, target: number) => Math.abs(value - target) < EPSILON;

export function isValidMethod11TechnicalPremium(value: unknown): value is Method11TechnicalPremium {
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  return METHOD_11_TECHNICAL_PREMIUM_VALUES.some((preset) => isCloseTo(value, preset));
}

export function normalizeTechnicalPremium(value: unknown): Method11TechnicalPremium {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_METHOD_11_TECHNICAL_PREMIUM;
  }
  if (isCloseTo(value, 0.15)) return 0.15;
  if (isCloseTo(value, 0.25)) return 0.25;
  if (isCloseTo(value, 0.35)) return 0.35;
  // Compatibilidade com dados antigos (método 1.0)
  if (isCloseTo(value, LEGACY_METHOD_10_HIGH_TECHNICAL_PREMIUM)) return 0.35;
  return DEFAULT_METHOD_11_TECHNICAL_PREMIUM;
}

export function technicalPremiumFromGroup(group: unknown): Method11TechnicalPremium {
  const normalizedGroup = String(group ?? "").trim().toUpperCase();
  if (normalizedGroup === "A") return 0.15;
  if (normalizedGroup === "C") return 0.35;
  return 0.25;
}

export function resolveTechnicalPremium(aValue: unknown, aTestGroup: unknown): Method11TechnicalPremium {
  if (typeof aValue === "number" && Number.isFinite(aValue)) {
    return normalizeTechnicalPremium(aValue);
  }
  return technicalPremiumFromGroup(aTestGroup);
}

export function technicalPremiumGroup(value: unknown): "A" | "B" | "C" {
  const normalized = normalizeTechnicalPremium(value);
  if (normalized <= 0.15) return "A";
  if (normalized >= 0.35) return "C";
  return "B";
}

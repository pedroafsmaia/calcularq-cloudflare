export const BETA_METHOD_VERSION = "beta";
export const VERSION_1_METHOD_VERSION = "1.0";

// "1.0.0" era a identificação técnica do método que agora chamamos de Beta.
// "1.2.0" identifica cálculos já salvos pelo método atual, antes da renomeação.
export const isBetaMethodVersion = (version?: string | null) => version === BETA_METHOD_VERSION || version === "1.0.0";

export const getMethodVersionLabel = (version?: string | null) => {
  if (isBetaMethodVersion(version)) return "Beta";
  if (version === VERSION_1_METHOD_VERSION || version === "1.2.0") return "Versão 1.0";
  return "Versão legada";
};

export const usesPercentComplexityScore = (version?: string | null) =>
  version === VERSION_1_METHOD_VERSION || version === "1.2.0";

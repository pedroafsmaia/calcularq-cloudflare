export type PricePerSqmBandId = "below" | "low" | "mid" | "high" | "above";
export type PricePerSqmKind = "extreme" | "unique" | "transition";

export const TRANSITION_EPSILON = 5; // R$/mÂ²

export function describePricePerSqm(pricePerSqm: number): {
  kind: PricePerSqmKind;
  line1: string;
  line2?: string;
  bandIds: PricePerSqmBandId[];
  intervalLabel?: string;
} {
  if (pricePerSqm < 20) {
    return {
      kind: "extreme",
      line1: "O PreÃ§o/mÂ² ficou abaixo das faixas internas de referÃªncia.",
      line2: "Abaixo de R$ 20/mÂ². O valor pode variar conforme padrÃ£o construtivo, regiÃ£o e complexidade.",
      bandIds: ["below"],
      intervalLabel: "< R$ 20/mÂ²",
    };
  }

  if (pricePerSqm > 150) {
    return {
      kind: "extreme",
      line1: "O PreÃ§o/mÂ² ficou acima das faixas internas de referÃªncia.",
      line2: "Acima de R$ 150/mÂ². O valor pode variar conforme padrÃ£o construtivo, regiÃ£o e complexidade.",
      bandIds: ["above"],
      intervalLabel: "> R$ 150/mÂ²",
    };
  }

  if (pricePerSqm >= 60 && pricePerSqm <= 80) {
    return {
      kind: "transition",
      line1: "O PreÃ§o/mÂ² estÃ¡ na transiÃ§Ã£o entre baixa e mÃ©dia complexidade.",
      line2: "Zona de transiÃ§Ã£o: R$ 60-80/mÂ². O valor pode variar conforme padrÃ£o construtivo, regiÃ£o e complexidade.",
      bandIds: ["low", "mid"],
      intervalLabel: "R$ 60-80/mÂ²",
    };
  }

  const transitionMin = 120 - TRANSITION_EPSILON;
  const transitionMax = 120 + TRANSITION_EPSILON;
  if (pricePerSqm >= transitionMin && pricePerSqm <= transitionMax) {
    return {
      kind: "transition",
      line1: "O PreÃ§o/mÂ² estÃ¡ na transiÃ§Ã£o entre mÃ©dia e alta complexidade.",
      line2: `Zona de transiÃ§Ã£o: ~R$ 120 Â± ${TRANSITION_EPSILON}/mÂ². O valor pode variar conforme padrÃ£o construtivo, regiÃ£o e complexidade.`,
      bandIds: ["mid", "high"],
      intervalLabel: `~R$ 120 Â± ${TRANSITION_EPSILON}/mÂ²`,
    };
  }

  if (pricePerSqm >= 20 && pricePerSqm < 60) {
    return {
      kind: "unique",
      line1: "O PreÃ§o/mÂ² estÃ¡ em uma faixa comum de baixa complexidade.",
      line2: "Faixa interna: R$ 20 a R$ 80/mÂ². O valor pode variar conforme padrÃ£o construtivo, regiÃ£o e complexidade.",
      bandIds: ["low"],
      intervalLabel: "R$ 20 a R$ 80/mÂ²",
    };
  }

  if (pricePerSqm > 80 && pricePerSqm < transitionMin) {
    return {
      kind: "unique",
      line1: "O PreÃ§o/mÂ² estÃ¡ em uma faixa comum de mÃ©dia complexidade.",
      line2: "Faixa interna: R$ 60 a R$ 120/mÂ². O valor pode variar conforme padrÃ£o construtivo, regiÃ£o e complexidade.",
      bandIds: ["mid"],
      intervalLabel: "R$ 60 a R$ 120/mÂ²",
    };
  }

  return {
    kind: "unique",
    line1: "O PreÃ§o/mÂ² estÃ¡ em uma faixa comum de alta complexidade.",
    line2: "Faixa interna: R$ 120 a R$ 150/mÂ². O valor pode variar conforme padrÃ£o construtivo, regiÃ£o e complexidade.",
    bandIds: ["high"],
    intervalLabel: "R$ 120 a R$ 150/mÂ²",
  };
}


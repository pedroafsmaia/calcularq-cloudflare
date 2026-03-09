export type PricePerSqmBandId = "below" | "low" | "mid" | "high" | "above";
export type PricePerSqmKind = "extreme" | "unique" | "transition";

export const TRANSITION_EPSILON = 5; // R$/m²

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
      line1: "O Preço/m² ficou abaixo das faixas internas de referência.",
      line2: "Abaixo de R$ 20/m². O valor pode variar conforme padrão construtivo, região e complexidade.",
      bandIds: ["below"],
      intervalLabel: "< R$ 20/m²",
    };
  }

  if (pricePerSqm > 150) {
    return {
      kind: "extreme",
      line1: "O Preço/m² ficou acima das faixas internas de referência.",
      line2: "Acima de R$ 150/m². O valor pode variar conforme padrão construtivo, região e complexidade.",
      bandIds: ["above"],
      intervalLabel: "> R$ 150/m²",
    };
  }

  if (pricePerSqm >= 60 && pricePerSqm <= 80) {
    return {
      kind: "transition",
      line1: "O Preço/m² está na zona de transição entre faixas de menor e média complexidade.",
      line2: "Zona de transição: R$ 60-80/m². O valor pode variar conforme padrão construtivo, região e complexidade.",
      bandIds: ["low", "mid"],
      intervalLabel: "R$ 60-80/m²",
    };
  }

  const transitionMin = 120 - TRANSITION_EPSILON;
  const transitionMax = 120 + TRANSITION_EPSILON;
  if (pricePerSqm >= transitionMin && pricePerSqm <= transitionMax) {
    return {
      kind: "transition",
      line1: "O Preço/m² está na zona de transição entre faixas de média e maior complexidade.",
      line2: `Zona de transição: ~R$ 120 ± ${TRANSITION_EPSILON}/m². O valor pode variar conforme padrão construtivo, região e complexidade.`,
      bandIds: ["mid", "high"],
      intervalLabel: `~R$ 120 ± ${TRANSITION_EPSILON}/m²`,
    };
  }

  if (pricePerSqm >= 20 && pricePerSqm < 60) {
    return {
      kind: "unique",
      line1: "O Preço/m² está em uma faixa de referência comum para casos de menor complexidade.",
      line2: "Faixa interna: R$ 20 a R$ 80/m². O valor pode variar conforme padrão construtivo, região e complexidade.",
      bandIds: ["low"],
      intervalLabel: "R$ 20 a R$ 80/m²",
    };
  }

  if (pricePerSqm > 80 && pricePerSqm < transitionMin) {
    return {
      kind: "unique",
      line1: "O Preço/m² está em uma faixa de referência comum para casos de complexidade intermediária.",
      line2: "Faixa interna: R$ 60 a R$ 120/m². O valor pode variar conforme padrão construtivo, região e complexidade.",
      bandIds: ["mid"],
      intervalLabel: "R$ 60 a R$ 120/m²",
    };
  }

  return {
    kind: "unique",
    line1: "O Preço/m² está em uma faixa de referência comum para casos de maior complexidade.",
    line2: "Faixa interna: R$ 120 a R$ 150/m². O valor pode variar conforme padrão construtivo, região e complexidade.",
    bandIds: ["high"],
    intervalLabel: "R$ 120 a R$ 150/m²",
  };
}


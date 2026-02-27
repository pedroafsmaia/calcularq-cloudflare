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
      line1: "Este Preço/m² está abaixo das faixas internas de referência.",
      line2: "Abaixo de R$ 20/m².",
      bandIds: ["below"],
      intervalLabel: "< R$ 20/m²",
    };
  }

  if (pricePerSqm > 150) {
    return {
      kind: "extreme",
      line1: "Este Preço/m² está acima das faixas internas de referência.",
      line2: "Acima de R$ 150/m².",
      bandIds: ["above"],
      intervalLabel: "> R$ 150/m²",
    };
  }

  if (pricePerSqm >= 60 && pricePerSqm <= 80) {
    return {
      kind: "transition",
      line1: "Este Preço/m² fica na transição entre baixa e média complexidade.",
      line2: "Zona de transição: R$ 60–80/m².",
      bandIds: ["low", "mid"],
      intervalLabel: "R$ 60–80/m²",
    };
  }

  const transitionMin = 120 - TRANSITION_EPSILON;
  const transitionMax = 120 + TRANSITION_EPSILON;
  if (pricePerSqm >= transitionMin && pricePerSqm <= transitionMax) {
    return {
      kind: "transition",
      line1: "Este Preço/m² fica na transição entre média e alta complexidade.",
      line2: `Zona de transição: ~R$ 120 ± ${TRANSITION_EPSILON}/m².`,
      bandIds: ["mid", "high"],
      intervalLabel: `~R$ 120 ± ${TRANSITION_EPSILON}/m²`,
    };
  }

  if (pricePerSqm >= 20 && pricePerSqm < 60) {
    return {
      kind: "unique",
      line1: "Este Preço/m² é comum em projetos de baixa complexidade.",
      line2: "Faixa interna: R$ 20 a R$ 80/m².",
      bandIds: ["low"],
      intervalLabel: "R$ 20 a R$ 80/m²",
    };
  }

  if (pricePerSqm > 80 && pricePerSqm < transitionMin) {
    return {
      kind: "unique",
      line1: "Este Preço/m² é comum em projetos de média complexidade.",
      line2: "Faixa interna: R$ 60 a R$ 120/m².",
      bandIds: ["mid"],
      intervalLabel: "R$ 60 a R$ 120/m²",
    };
  }

  return {
    kind: "unique",
    line1: "Este Preço/m² é comum em projetos de alta complexidade.",
    line2: "Faixa interna: R$ 120 a R$ 150/m².",
    bandIds: ["high"],
    intervalLabel: "R$ 120 a R$ 150/m²",
  };
}


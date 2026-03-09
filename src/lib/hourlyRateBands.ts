export type HourlyRateBandKind = "extreme" | "unique" | "transition";

export function describeHourlyRate(hourlyRate: number): {
  kind: HourlyRateBandKind;
  label: string;
  line1: string;
  line2?: string;
  intervalLabel: string;
} {
  if (hourlyRate < 45) {
    return {
      kind: "extreme",
      label: "Abaixo da faixa jÃºnior",
      line1: "A hora ajustada ficou abaixo das faixas internas de referÃªncia.",
      line2: "Abaixo de R$ 45/h (jÃºnior: R$ 45-85/h).",
      intervalLabel: "< R$ 45/h",
    };
  }

  if (hourlyRate > 200) {
    return {
      kind: "extreme",
      label: "Acima da faixa sÃªnior",
      line1: "A hora ajustada ficou acima das faixas internas de referÃªncia.",
      line2: "Acima de R$ 200/h (sÃªnior: R$ 130-200/h).",
      intervalLabel: "> R$ 200/h",
    };
  }

  if (hourlyRate >= 75 && hourlyRate <= 85) {
    return {
      kind: "transition",
      label: "TransiÃ§Ã£o jÃºnior-pleno",
      line1: "A hora ajustada estÃ¡ na transiÃ§Ã£o entre jÃºnior e pleno.",
      line2: "Zona de transiÃ§Ã£o: R$ 75-85/h.",
      intervalLabel: "R$ 75-85/h",
    };
  }

  if (hourlyRate >= 120 && hourlyRate <= 130) {
    return {
      kind: "transition",
      label: "TransiÃ§Ã£o pleno-sÃªnior",
      line1: "A hora ajustada estÃ¡ na transiÃ§Ã£o entre pleno e sÃªnior.",
      line2: "Zona de transiÃ§Ã£o: R$ 120-130/h.",
      intervalLabel: "R$ 120-130/h",
    };
  }

  if (hourlyRate >= 45 && hourlyRate < 75) {
    return {
      kind: "unique",
      label: "Faixa jÃºnior",
      line1: "A hora ajustada estÃ¡ em uma faixa comum de perfil jÃºnior.",
      line2: "Faixa de referÃªncia: R$ 45-85/h.",
      intervalLabel: "R$ 45-85/h",
    };
  }

  if (hourlyRate > 85 && hourlyRate < 120) {
    return {
      kind: "unique",
      label: "Faixa pleno",
      line1: "A hora ajustada estÃ¡ em uma faixa comum de perfil pleno.",
      line2: "Faixa de referÃªncia: R$ 85-130/h.",
      intervalLabel: "R$ 85-130/h",
    };
  }

  return {
    kind: "unique",
    label: "Faixa sÃªnior",
    line1: "A hora ajustada estÃ¡ em uma faixa comum de perfil sÃªnior.",
    line2: "Faixa de referÃªncia: R$ 130-200/h.",
    intervalLabel: "R$ 130-200/h",
  };
}


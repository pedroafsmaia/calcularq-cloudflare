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
      label: "Abaixo da faixa júnior",
      line1: "A hora ajustada ficou abaixo das faixas internas de referência.",
      line2: "Abaixo de R$ 45/h (júnior: R$ 45-85/h).",
      intervalLabel: "< R$ 45/h",
    };
  }

  if (hourlyRate > 200) {
    return {
      kind: "extreme",
      label: "Acima da faixa sênior",
      line1: "A hora ajustada ficou acima das faixas internas de referência.",
      line2: "Acima de R$ 200/h (sênior: R$ 130-200/h).",
      intervalLabel: "> R$ 200/h",
    };
  }

  if (hourlyRate >= 75 && hourlyRate <= 85) {
    return {
      kind: "transition",
      label: "Transição júnior-pleno",
      line1: "A hora ajustada está na transição entre júnior e pleno.",
      line2: "Zona de transição: R$ 75-85/h.",
      intervalLabel: "R$ 75-85/h",
    };
  }

  if (hourlyRate >= 120 && hourlyRate <= 130) {
    return {
      kind: "transition",
      label: "Transição pleno-sênior",
      line1: "A hora ajustada está na transição entre pleno e sênior.",
      line2: "Zona de transição: R$ 120-130/h.",
      intervalLabel: "R$ 120-130/h",
    };
  }

  if (hourlyRate >= 45 && hourlyRate < 75) {
    return {
      kind: "unique",
      label: "Faixa júnior",
      line1: "A hora ajustada está em uma faixa de referência compatível com perfil júnior.",
      line2: "Faixa de referência: R$ 45-85/h.",
      intervalLabel: "R$ 45-85/h",
    };
  }

  if (hourlyRate > 85 && hourlyRate < 120) {
    return {
      kind: "unique",
      label: "Faixa pleno",
      line1: "A hora ajustada está em uma faixa de referência compatível com perfil pleno.",
      line2: "Faixa de referência: R$ 85-130/h.",
      intervalLabel: "R$ 85-130/h",
    };
  }

  return {
    kind: "unique",
    label: "Faixa sênior",
    line1: "A hora ajustada está em uma faixa de referência compatível com perfil sênior.",
    line2: "Faixa de referência: R$ 130-200/h.",
    intervalLabel: "R$ 130-200/h",
  };
}


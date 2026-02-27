export type PricePerSqmBandId = "below" | "low" | "mid" | "high" | "above";

type PricePerSqmBand = {
  id: PricePerSqmBandId;
  min: number | null;
  max: number | null;
  name: string;
  intervalLabel: string;
};

export const PRICE_PER_SQM_BANDS: PricePerSqmBand[] = [
  { id: "below", min: null, max: 20, name: "Abaixo da referência", intervalLabel: "< R$ 20/m²" },
  { id: "low", min: 20, max: 80, name: "Baixa complexidade", intervalLabel: "R$ 20 a R$ 80/m²" },
  { id: "mid", min: 80, max: 120, name: "Média complexidade", intervalLabel: "R$ 80 a R$ 120/m²" },
  { id: "high", min: 120, max: 150, name: "Alta complexidade", intervalLabel: "R$ 120 a R$ 150/m²" },
  { id: "above", min: 150, max: null, name: "Acima da referência", intervalLabel: "> R$ 150/m²" },
];

export function getPricePerSqmBand(pricePerSqm: number): PricePerSqmBandId {
  if (pricePerSqm < 20) return "below";
  if (pricePerSqm < 80) return "low";
  if (pricePerSqm < 120) return "mid";
  if (pricePerSqm <= 150) return "high";
  return "above";
}

export function getPricePerSqmBandLabel(bandId: PricePerSqmBandId): Pick<PricePerSqmBand, "name" | "intervalLabel"> {
  const band = PRICE_PER_SQM_BANDS.find((item) => item.id === bandId);
  if (!band) return { name: "Referência interna", intervalLabel: "Faixa não definida" };
  return { name: band.name, intervalLabel: band.intervalLabel };
}

type ExpectedBandInput = {
  stageLevel: number | null | undefined;
  globalComplexity: number;
};

export function getExpectedPricePerSqmBand({ stageLevel, globalComplexity }: ExpectedBandInput): PricePerSqmBandId {
  if (typeof stageLevel === "number" && Number.isFinite(stageLevel) && stageLevel > 0) {
    if (stageLevel <= 2) return "low";
    if (stageLevel <= 4) return "mid";
    return "high";
  }

  if (globalComplexity < 2.2) return "low";
  if (globalComplexity <= 3.3) return "mid";
  return "high";
}


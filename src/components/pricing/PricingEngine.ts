export interface Factor {
  id: string;
  name: string;
  description: string;
  options: {
    value: number;
    label: string;
    description?: string;
  }[];
  weight: number;
  isArea?: boolean; // Para identificar o fator de área que usa régua de intervalos
}

export interface AreaInterval {
  min: number;
  max: number | null; // null significa "acima de"
  level: number;
}

export const DEFAULT_AREA_INTERVALS: AreaInterval[] = [
  { min: 0, max: 49, level: 1 },
  { min: 50, max: 149, level: 2 },
  { min: 150, max: 499, level: 3 },
  { min: 500, max: 999, level: 4 },
  { min: 1000, max: null, level: 5 },
];

export const DEFAULT_FACTORS: Factor[] = [
  {
    id: "area",
    name: "Área de Projeto",
    description: "Estimativa da metragem total de intervenção.",
    weight: 1.0,
    isArea: true,
    options: [
      { value: 1, label: "Até 49m²", description: "Nível 1" },
      { value: 2, label: "50 a 149m²", description: "Nível 2" },
      { value: 3, label: "150 a 499m²", description: "Nível 3" },
      { value: 4, label: "500 a 999m²", description: "Nível 4" },
      { value: 5, label: "Acima de 1000m²", description: "Nível 5" },
    ],
  },
  {
    id: "stage",
    name: "Etapa de Projeto",
    description: "Define até qual fase do ciclo de desenvolvimento o arquiteto desenvolverá o projeto.",
    weight: 1.0,
    options: [
      { value: 1, label: "Consultoria", description: "Nível 1" },
      { value: 2, label: "Estudo Preliminar", description: "Nível 2" },
      { value: 3, label: "Anteprojeto", description: "Nível 3" },
      { value: 4, label: "Projeto Executivo", description: "Nível 4" },
      { value: 5, label: "Coordenação de Complementares", description: "Nível 5" },
    ],
  },
  {
    id: "detail",
    name: "Nível de Detalhamento",
    description: "Mede a quantidade de desenhos e o esforço criativo exigido.",
    weight: 1.0,
    options: [
      { value: 1, label: "Mínimo", description: "Nível 1" },
      { value: 2, label: "Básico", description: "Nível 2" },
      { value: 3, label: "Médio", description: "Nível 3" },
      { value: 4, label: "Alto", description: "Nível 4" },
      { value: 5, label: "Máximo", description: "Nível 5" },
    ],
  },
  {
    id: "technical",
    name: "Exigência Técnica",
    description: "Define a rigidez das normas, leis e o volume de estudo técnico necessário.",
    weight: 1.0,
    options: [
      { value: 1, label: "Mínima", description: "Nível 1" },
      { value: 2, label: "Baixa", description: "Nível 2" },
      { value: 3, label: "Média", description: "Nível 3" },
      { value: 4, label: "Alta", description: "Nível 4" },
      { value: 5, label: "Máxima", description: "Nível 5" },
    ],
  },
  {
    id: "bureaucratic",
    name: "Exigência Burocrática",
    description: "Mede a carga administrativa e a gestão de aprovações em órgãos públicos.",
    weight: 1.0,
    options: [
      { value: 1, label: "Mínima", description: "Nível 1" },
      { value: 2, label: "Baixa", description: "Nível 2" },
      { value: 3, label: "Média", description: "Nível 3" },
      { value: 4, label: "Alta", description: "Nível 4" },
      { value: 5, label: "Máxima", description: "Nível 5" },
    ],
  },
  {
    id: "monitoring",
    name: "Dedicação à Obra",
    description: "Frequência de visitas e nível de responsabilidade no canteiro.",
    weight: 1.0,
    options: [
      { value: 1, label: "Levantamento", description: "Nível 1" },
      { value: 2, label: "Pontual", description: "Nível 2" },
      { value: 3, label: "Por Etapas", description: "Nível 3" },
      { value: 4, label: "Acompanhamento", description: "Nível 4" },
      { value: 5, label: "Gestão", description: "Nível 5" },
    ],
  },
];

export function calculateAreaLevel(
  area: number,
  intervals: AreaInterval[]
): number {
  for (const interval of intervals) {
    if (interval.max === null) {
      if (area >= interval.min) return interval.level;
    } else {
      if (area >= interval.min && area <= interval.max) {
        return interval.level;
      }
    }
  }
  return 1; // Default
}

export function calculateGlobalComplexity(
  factors: Factor[],
  selections: Record<string, number>
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  factors.forEach((factor) => {
    const selection = selections[factor.id];
    if (selection !== undefined) {
      weightedSum += selection * factor.weight;
      totalWeight += factor.weight;
    }
  });

  if (totalWeight === 0) return 0;
  return weightedSum / totalWeight;
}

export function calculateProjectValue(
  minHourlyRate: number,
  estimatedHours: number,
  globalComplexity: number,
  variableExpenses: number = 0
): {
  globalComplexity: number;
  adjustedHourlyRate: number;
  projectPrice: number;
  finalSalePrice: number;
  complexityMultiplier: number;
} {
  const complexityMultiplier = globalComplexity;
  const adjustedHourlyRate = minHourlyRate * complexityMultiplier;
  const projectPrice = adjustedHourlyRate * estimatedHours;
  const finalSalePrice = projectPrice + variableExpenses;

  return {
    globalComplexity: Number(globalComplexity.toFixed(2)),
    adjustedHourlyRate: Number(adjustedHourlyRate.toFixed(2)),
    projectPrice: Number(projectPrice.toFixed(2)),
    finalSalePrice: Number(finalSalePrice.toFixed(2)),
    complexityMultiplier: Number(complexityMultiplier.toFixed(2)),
  };
}

export function validateInputs(
  minHourlyRate: number,
  estimatedHours: number
): string[] {
  const errors: string[] = [];

  if (minHourlyRate <= 0) {
    errors.push("A hora técnica mínima deve ser maior que zero");
  }

  if (estimatedHours <= 0) {
    errors.push("As horas estimadas devem ser maiores que zero");
  }

  return errors;
}

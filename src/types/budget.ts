export type ExpenseItem = {
  id: string;
  name: string;
  value: number;
};

export type BudgetFactorData = {
  id: string;
  name: string;
  weight: number;
  level: number;
};

export type BudgetAreaIntervalData = {
  min: number;
  max: number | null;
  level: number;
};

export type BudgetResultsData = {
  globalComplexity: number;
  adjustedHourlyRate: number;
  projectPrice: number;
  finalSalePrice: number;
};

export type BudgetData = {
  description?: string;
  minHourlyRate: number;
  useManualMinHourlyRate?: boolean;
  area?: number | null;
  factors: BudgetFactorData[];
  areaIntervals: BudgetAreaIntervalData[];
  selections: Record<string, number>;
  estimatedHours: number;
  fixedExpenses?: ExpenseItem[];
  personalExpenses?: ExpenseItem[];
  proLabore?: number;
  productiveHours?: number;
  commercialDiscount?: number;
  variableExpenses: ExpenseItem[];
  results: BudgetResultsData;
};

export type CalculatorDraft = {
  minHourlyRate?: number | null;
  useManualMinHourlyRate?: boolean;
  fixedExpenses?: ExpenseItem[];
  personalExpenses?: ExpenseItem[];
  proLabore?: number;
  productiveHours?: number;
  factors?: Array<Pick<BudgetFactorData, "id" | "weight">>;
  areaIntervals?: BudgetAreaIntervalData[];
  area?: number | null;
  selections?: Record<string, number>;
  estimatedHours?: number;
  commercialDiscount?: number;
  variableExpenses?: ExpenseItem[];
  currentStep?: number;
  maxStepReached?: number;
  savedAt?: number;
};

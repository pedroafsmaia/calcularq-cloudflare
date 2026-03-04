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

export type BudgetScopeChange =
  | "as_planned"
  | "moderate"
  | "major"
  | "como_previsto"
  | "mudou_muito";

export type BudgetCloseFeedback =
  | "too_expensive"
  | "accepted_no_questions"
  | "accepted_after_negotiation"
  | "could_charge_more"
  | "did_not_close_other";

export type BudgetTipologia = "residencial" | "comercial" | "institucional" | "industrial" | "saude";
export type BudgetCenario = "conservador" | "otimista";

export type BudgetActualHoursByPhase = {
  briefing?: number;
  ep?: number;
  ap?: number;
  ex?: number;
  compat?: number;
  obra?: number;
};

export type BudgetData = {
  description?: string;
  minHourlyRate: number;
  useManualMinHourlyRate?: boolean;
  margemLucro?: number;
  cenarioEscolhido?: BudgetCenario;
  tipologia?: BudgetTipologia;
  volumetria?: number;
  reforma?: boolean;
  h50Metodo?: number;
  hConsMetodo?: number;
  hUsuarioManual?: number;
  hFinal?: number;
  scoreComplexidade?: number;
  classificacaoComplexidade?: string;
  aTestGroup?: "A" | "B" | "C";
  aValue?: number;
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
  methodVersion?: string;
  suggestedH50?: number;
  suggestedH80?: number;
  actualHoursTotal?: number;
  actualHoursByPhase?: BudgetActualHoursByPhase;
  scopeChange?: BudgetScopeChange;
  closeFeedback?: BudgetCloseFeedback;
  closedAt?: string;
  hasPhaseMismatch?: boolean;
  profitProfile?: "portfolio" | "estabelecido" | "referencia";
};

export type CalculatorDraft = {
  minHourlyRate?: number | null;
  useManualMinHourlyRate?: boolean;
  profitMargin?: number;
  technicalPremium?: number;
  fixedExpenses?: ExpenseItem[];
  personalExpenses?: ExpenseItem[];
  proLabore?: number;
  productiveHours?: number;
  factors?: Array<Pick<BudgetFactorData, "id" | "weight">>;
  areaIntervals?: BudgetAreaIntervalData[];
  area?: number | null;
  selections?: Record<string, number>;
  estimatedHours?: number;
  cenarioEscolhido?: BudgetCenario;
  hUsuarioManual?: number | null;
  commercialDiscount?: number;
  variableExpenses?: ExpenseItem[];
  currentStep?: number;
  maxStepReached?: number;
  savedAt?: number;
  profitProfile?: "portfolio" | "estabelecido" | "referencia";
};

import type { Budget } from "@/lib/api";
import type { BudgetData } from "@/types/budget";

export const DEMO_METHOD_VERSION = "v3_demo_3_1_1";

const MIN_RATIO = 0.5;
const MAX_RATIO = 2.0;
const MIN_KUSER = 0.75;
const MAX_KUSER = 1.4;
const RECENCY_HALF_LIFE_DAYS = 120;

export type DemoCalibrationSnapshot = {
  kUser: number;
  sampleCount: number;
  updatedAt: string;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const toFinitePositive = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value <= 0) return null;
  return value;
};

const recencyWeight = (updatedAt: string, nowMs: number) => {
  const updatedAtMs = Number(new Date(updatedAt).getTime());
  if (!Number.isFinite(updatedAtMs) || updatedAtMs <= 0) return 1;
  const ageDays = Math.max(0, (nowMs - updatedAtMs) / (1000 * 60 * 60 * 24));
  return Math.pow(0.5, ageDays / RECENCY_HALF_LIFE_DAYS);
};

export const isDemoMethodVersion = (methodVersion?: string | null) =>
  typeof methodVersion === "string" && methodVersion.startsWith("v3_demo");

export const isDemoBudgetData = (data?: Partial<BudgetData> | null) =>
  isDemoMethodVersion(data?.methodVersion);

export function calculateKUserFromClosedDemoBudgets(
  budgets: Budget[],
  nowMs: number = Date.now()
): DemoCalibrationSnapshot | null {
  let weightedRatioSum = 0;
  let weightedCount = 0;
  let sampleCount = 0;

  for (const budget of budgets) {
    const data = budget.data;
    if (!isDemoBudgetData(data)) continue;
    if (!data.closedAt) continue;
    if (data.scopeChange === "major") continue;

    const actualHours = toFinitePositive(data.actualHoursTotal);
    const suggestedH50 = toFinitePositive(data.suggestedH50);
    if (!actualHours || !suggestedH50) continue;

    const rawRatio = actualHours / suggestedH50;
    const ratio = clamp(rawRatio, MIN_RATIO, MAX_RATIO);
    const weight = recencyWeight(budget.updatedAt, nowMs);

    weightedRatioSum += ratio * weight;
    weightedCount += weight;
    sampleCount += 1;
  }

  if (!sampleCount || weightedCount <= 0) return null;

  const kUserRaw = weightedRatioSum / weightedCount;
  const kUser = clamp(kUserRaw, MIN_KUSER, MAX_KUSER);

  return {
    kUser: Number(kUser.toFixed(3)),
    sampleCount,
    updatedAt: new Date(nowMs).toISOString(),
  };
}

export const demoCalibrationStorageKey = (userId: string) =>
  `calcularq_demo_k_user_${userId}`;

export function loadStoredDemoCalibration(userId: string): DemoCalibrationSnapshot | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = localStorage.getItem(demoCalibrationStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoCalibrationSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    if (typeof parsed.kUser !== "number" || !Number.isFinite(parsed.kUser) || parsed.kUser <= 0) return null;
    if (typeof parsed.sampleCount !== "number" || !Number.isFinite(parsed.sampleCount) || parsed.sampleCount < 1) {
      return null;
    }
    if (typeof parsed.updatedAt !== "string") return null;
    return {
      kUser: clamp(parsed.kUser, MIN_KUSER, MAX_KUSER),
      sampleCount: Math.max(1, Math.round(parsed.sampleCount)),
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function saveDemoCalibration(userId: string, snapshot: DemoCalibrationSnapshot) {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(demoCalibrationStorageKey(userId), JSON.stringify(snapshot));
  } catch {
    // ignore localStorage quota/permission errors
  }
}

export function syncDemoCalibrationFromBudgets(userId: string, budgets: Budget[]): DemoCalibrationSnapshot | null {
  const snapshot = calculateKUserFromClosedDemoBudgets(budgets);
  if (!snapshot) return null;
  saveDemoCalibration(userId, snapshot);
  return snapshot;
}

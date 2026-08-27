import type { Method10Input, Method10Output, TipologiaMethod10 } from "./PricingEngineMethod12";
import { BETA_METHOD_VERSION } from "@/lib/methodVersion";

const LEGACY_METHOD_VERSION = BETA_METHOD_VERSION;
const M_DET = [0.85, 1, 1.12, 1.25, 1.4] as const;
const V_VOLUMETRIA = [1, 1.08, 1.15, 1.22, 1.3] as const;
const T_TIPOLOGIA: Record<TipologiaMethod10, number> = {
  residencial: 1,
  comercial: 1,
  institucional: 1,
  industrial: 1,
  saude: 1.25,
};

const clampLevel = (value: number) => Math.max(1, Math.min(5, Math.round(value)));
const normalizeLevel = (value: number) => (clampLevel(value) - 1) / 4;

const calculateProductivity = (area: number) => {
  const rMin = 0.9;
  const rMax = 1.85;
  return rMin + (rMax - rMin) / (1 + Math.pow(area / 350, 1.2));
};

const calculateScore = (input: {
  area: number;
  detail: number;
  technical: number;
  bureaucratic: number;
  volumetry: number;
  tipology: TipologiaMethod10;
  reform: boolean;
}) => {
  let areaScore = 20;
  if (input.area > 49) areaScore = 35;
  if (input.area > 149) areaScore = 50;
  if (input.area > 499) areaScore = 70;
  if (input.area > 999) areaScore = 85;

  const tipologyScore: Record<TipologiaMethod10, number> = {
    residencial: 20,
    comercial: 40,
    institucional: 60,
    industrial: 70,
    saude: 100,
  };

  return Math.round(
    areaScore * 0.15 +
      (normalizeLevel(input.detail) * 100) * 0.2 +
      (normalizeLevel(input.technical) * 100) * 0.2 +
      (normalizeLevel(input.bureaucratic) * 100) * 0.15 +
      (normalizeLevel(input.volumetry) * 100) * 0.15 +
      tipologyScore[input.tipology] * 0.1 +
      (input.reform ? 100 : 0) * 0.05
  );
};

export function calculateLegacyMethod10(input: Method10Input): Method10Output {
  if (!Number.isFinite(input.area) || input.area <= 0) throw new Error("Area invalida");
  if (!Number.isFinite(input.ht_min) || input.ht_min <= 0) throw new Error("HT_min invalida");
  if (!Number.isFinite(input.margem_lucro) || input.margem_lucro < 0) throw new Error("Margem invalida");

  const detail = clampLevel(input.f3_detalhamento);
  const technical = clampLevel(input.f4_tecnica);
  const bureaucratic = clampLevel(input.f5_burocracia);
  const volumetry = clampLevel(input.volumetria);
  const premium = Number.isFinite(input.A) ? Number(input.A) : 0.35;
  const productivity = calculateProductivity(input.area);
  const detailMultiplier = M_DET[detail - 1];
  const tipologyMultiplier = T_TIPOLOGIA[input.tipologia];
  const volumetryMultiplier = V_VOLUMETRIA[volumetry - 1];
  const h50 = input.area * productivity * detailMultiplier * tipologyMultiplier * volumetryMultiplier;
  const hasCommercialTipology = ["comercial", "institucional", "industrial"].includes(input.tipologia);

  const uncertainty =
    0.2 +
    0.05 * normalizeLevel(technical) +
    0.25 * normalizeLevel(bureaucratic) +
    (hasCommercialTipology ? 0.03 : 0) +
    (input.reforma ? (technical + bureaucratic < 7 ? 0.15 : 0.25) : 0);
  const hCons = h50 * (1 + uncertainty);
  const hasManualHours = Number.isFinite(input.h_usuario_manual) && Number(input.h_usuario_manual) > 0;
  const manualHours = hasManualHours ? Number(input.h_usuario_manual) : 0;
  const hFinal = hasManualHours ? (input.cenario === "conservador" ? manualHours * (1 + uncertainty) : manualHours) : input.cenario === "conservador" ? hCons : h50;
  const technicalComplexity = normalizeLevel(technical);
  const technicalPremium = premium * technicalComplexity;
  const adjustedHourlyRate = input.ht_min * (1 + input.margem_lucro + technicalPremium);
  const score = calculateScore({
    area: input.area,
    detail,
    technical,
    bureaucratic,
    volumetry,
    tipology: input.tipologia,
    reform: input.reforma,
  });

  const classify = score <= 20 ? "Muito Baixa" : score <= 40 ? "Baixa a Media" : score <= 60 ? "Media" : score <= 80 ? "Media a Alta" : "Muito Alta";
  const price = hFinal * adjustedHourlyRate;

  return {
    h50: Number(h50.toFixed(2)),
    h_cons: Number(hCons.toFixed(2)),
    h_final: Number(hFinal.toFixed(2)),
    ht_aj: Number(adjustedHourlyRate.toFixed(2)),
    preco_h50: Number((h50 * adjustedHourlyRate).toFixed(2)),
    preco_conservador: Number((hCons * adjustedHourlyRate).toFixed(2)),
    preco_final: Number(price.toFixed(2)),
    preco_m2: Number((price / input.area).toFixed(2)),
    score_complexidade: score,
    classificacao_complexidade: classify,
    u_total: Number(uncertainty.toFixed(4)),
    method_version: LEGACY_METHOD_VERSION,
    cenario_usado: input.cenario,
    usuario_editou_horas: hasManualHours,
    breakdown: {
      r_area: Number(productivity.toFixed(4)),
      m_det: detailMultiplier,
      t_tipologia: tipologyMultiplier,
      v_volumetria: volumetryMultiplier,
      e_etapa: 0,
      h_var: 0,
      h_fix: 0,
      h_projeto: Number(h50.toFixed(2)),
      h_obra: 0,
      u_base: 0.2,
      u_f4: Number((0.05 * normalizeLevel(technical)).toFixed(4)),
      u_f5: Number((0.25 * normalizeLevel(bureaucratic)).toFixed(4)),
      u_tipologia: hasCommercialTipology ? 0.03 : 0,
      u_reforma: input.reforma ? (technical + bureaucratic < 7 ? 0.15 : 0.25) : 0,
      c_tech: Number(technicalComplexity.toFixed(4)),
      margem_lucro_aplicada: input.margem_lucro,
      premio_tecnico: Number(technicalPremium.toFixed(4)),
    },
  };
}

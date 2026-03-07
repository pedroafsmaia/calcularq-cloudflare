import { DEFAULT_METHOD_11_TECHNICAL_PREMIUM, isValidMethod11TechnicalPremium } from "@/lib/methodCalibration";

export const METHOD_12_VERSION = "1.2.0";

export const METHOD_12_PARAMS = {
  r_min: 0.55,
  r_max: 1.2,
  k: 250,
  p: 1.4,
  hfix_alpha: 18,
  hfix_a0: 15,
  hfix_q: 1.8,
} as const;

export const M_DET = [0.85, 1.0, 1.1, 1.22, 1.35] as const;
export const V_VOLUMETRIA = [1.0, 1.08, 1.15, 1.22, 1.3] as const;

export const ETAPA_MULTIPLIERS = {
  1: 0.05,   // Consultoria/Briefing
  2: 0.15,   // Estudo Preliminar
  3: 0.40,   // Anteprojeto
  4: 0.85,   // Projeto Executivo
  5: 1.00,   // Compatibilização
} as const;

export const F6_OBRA_MULTIPLIERS = {
  1: 0.00,   // Levantamento
  2: 0.05,   // Pontual
  3: 0.10,   // Por Etapa
  4: 0.20,   // Acompanhamento
  5: 0.35,   // Gestão
} as const;

export const T_TIPOLOGIA = {
  residencial: 1.0,
  comercial: 1.1,
  institucional: 1.2,
  industrial: 1.0,
  saude: 1.4,
} as const;

export type TipologiaMethod10 = keyof typeof T_TIPOLOGIA;
export type CenarioMethod10 = "conservador" | "otimista";

export interface Method10Input {
  ht_min: number;
  margem_lucro: number;
  area: number;
  etapa: number;
  tipologia: TipologiaMethod10;
  volumetria: number;
  reforma: boolean;
  f3_detalhamento: number;
  f4_tecnica: number;
  f5_burocracia: number;
  f6_obra?: number;
  cenario: CenarioMethod10;
  h_usuario_manual?: number;
  A?: number;
}

export interface Method10Output {
  h50: number;
  h_cons: number;
  h_final: number;
  ht_aj: number;
  preco_h50: number;
  preco_conservador: number;
  preco_final: number;
  preco_m2: number;
  score_complexidade: number;
  classificacao_complexidade: string;
  u_total: number;
  method_version: string;
  cenario_usado: CenarioMethod10;
  usuario_editou_horas: boolean;
  breakdown: {
    r_area: number;
    m_det: number;
    t_tipologia: number;
    v_volumetria: number;
    e_etapa: number;
    h_var: number;
    h_fix: number;
    h_projeto: number;
    h_obra: number;
    u_base: number;
    u_f4: number;
    u_f5: number;
    u_tipologia: number;
    u_reforma: number;
    c_tech: number;
    margem_lucro_aplicada: number;
    premio_tecnico: number;
  };
}

const clampLevel = (value: number) => Math.max(1, Math.min(5, Math.round(value)));

const normalizeLevel = (value: number) => (clampLevel(value) - 1) / 4;

export function tipologiaFromLevel(level: number): TipologiaMethod10 {
  const safe = clampLevel(level);
  if (safe === 1) return "residencial";
  if (safe === 2) return "comercial";
  if (safe === 3) return "institucional";
  if (safe === 4) return "industrial";
  return "saude";
}

export function reformFromLevel(level: number): boolean {
  return clampLevel(level) > 1;
}

export function calcularProdutividade(area: number): number {
  const { r_min, r_max, k, p } = METHOD_12_PARAMS;
  return r_min + (r_max - r_min) / (1 + Math.pow(area / k, p));
}

export function calcularComponenteFixa(
  area: number,
  eEtapa: number,
  params: Pick<typeof METHOD_12_PARAMS, "hfix_alpha" | "hfix_a0" | "hfix_q"> = METHOD_12_PARAMS
): number {
  if (!Number.isFinite(area) || area <= 0) return 0;
  if (!Number.isFinite(eEtapa) || eEtapa <= 0) return 0;
  return (params.hfix_alpha * eEtapa) / (1 + Math.pow(area / params.hfix_a0, params.hfix_q));
}

export function calcularScoreComplexidade(input: {
  area: number;
  f3: number;
  f4: number;
  f5: number;
  volumetria: number;
  tipologia: TipologiaMethod10;
  reforma: boolean;
  etapa: number;
}): number {
  const normalizar = (nivel: number) => ((clampLevel(nivel) - 1) / 4) * 100;

  let scoreArea = 20;
  if (input.area > 60) scoreArea = 35;
  if (input.area > 140) scoreArea = 50;
  if (input.area > 400) scoreArea = 70;
  if (input.area > 1000) scoreArea = 85;

  const scoreTipologia: Record<TipologiaMethod10, number> = {
    residencial: 20,
    comercial: 40,
    institucional: 60,
    industrial: 70,
    saude: 100,
  };

  const scores = {
    area: scoreArea,
    detalhamento: normalizar(input.f3),
    tecnica: normalizar(input.f4),
    burocracia: normalizar(input.f5),
    volumetria: normalizar(input.volumetria),
    tipologia: scoreTipologia[input.tipologia] ?? 50,
    etapa: normalizar(input.etapa),
    reforma: input.reforma ? 100 : 0,
  };

  const pesos = {
    area: 0.15,
    detalhamento: 0.20,
    tecnica: 0.20,
    burocracia: 0.12,
    volumetria: 0.12,
    tipologia: 0.08,
    etapa: 0.08,
    reforma: 0.05,
  };

  const score =
    scores.area * pesos.area +
    scores.detalhamento * pesos.detalhamento +
    scores.tecnica * pesos.tecnica +
    scores.burocracia * pesos.burocracia +
    scores.volumetria * pesos.volumetria +
    scores.tipologia * pesos.tipologia +
    scores.etapa * pesos.etapa +
    scores.reforma * pesos.reforma;

  return Math.round(score);
}

export function classificarComplexidade(score: number): string {
  if (score <= 20) return "Muito Baixa";
  if (score <= 40) return "Baixa a Média";
  if (score <= 60) return "Média";
  if (score <= 80) return "Média a Alta";
  return "Muito Alta";
}

export function calcularMethod10(input: Method10Input): Method10Output {
  // Validações básicas
  if (!Number.isFinite(input.area) || input.area <= 0) throw new Error("Area invalida");
  if (!Number.isFinite(input.ht_min) || input.ht_min <= 0) throw new Error("HT_min invalida");
  if (!Number.isFinite(input.margem_lucro) || input.margem_lucro < 0) throw new Error("Margem invalida");
  if (![1, 2, 3, 4, 5].includes(input.etapa)) throw new Error("Etapa invalida");

  const area = input.area;
  const etapa = clampLevel(input.etapa);
  const f3 = clampLevel(input.f3_detalhamento);
  const f4 = clampLevel(input.f4_tecnica);
  const f5 = clampLevel(input.f5_burocracia);
  const volumetria = clampLevel(input.volumetria);
  
  // Parâmetro A no método 1.1: apenas 0.15, 0.25 ou 0.35
  const rawA = Number(input.A);
  const A = isValidMethod11TechnicalPremium(rawA) ? rawA : DEFAULT_METHOD_11_TECHNICAL_PREMIUM;

  const r_area = calcularProdutividade(area);
  const m_det = M_DET[f3 - 1];
  const t_tipologia = T_TIPOLOGIA[input.tipologia] ?? 1;
  const v_volumetria = V_VOLUMETRIA[volumetria - 1];
  const e_etapa = ETAPA_MULTIPLIERS[clampLevel(input.etapa) as 1 | 2 | 3 | 4 | 5] ?? 1.0;

  const h_var = area * r_area * m_det * t_tipologia * v_volumetria * e_etapa;
  const h_fix = calcularComponenteFixa(area, e_etapa);
  const h_projeto = h_var + h_fix;

  // Calcular horas de obra (F6) se aplicável
  let h_obra = 0;
  if (input.f6_obra && input.f6_obra > 1) {
    const f6 = clampLevel(input.f6_obra);
    const t_f6 = F6_OBRA_MULTIPLIERS[f6 as 1 | 2 | 3 | 4 | 5] ?? 0;
    
    // H_obra = t(F6) x H_Executivo
    // H_Executivo = H50 quando etapa=4, ou proporcional
    const h_executivo_var = area * r_area * m_det * t_tipologia * v_volumetria * 0.85;
    const h_executivo_fix = calcularComponenteFixa(area, 0.85);
    const h_executivo = h_executivo_var + h_executivo_fix;
    h_obra = t_f6 * h_executivo;
  }

  const h50_total = h_projeto + h_obra;

  const u_base = 0.15;
  const u_f4 = 0.05 * normalizeLevel(f4);
  const u_f5 = 0.2 * normalizeLevel(f5);
  const u_tipologia = input.tipologia === "industrial" ? 0.02 : 0;
  const u_reforma = input.reforma ? (f4 + f5 < 7 ? 0.15 : 0.2) : 0;
  const u_total = u_base + u_f4 + u_f5 + u_tipologia + u_reforma;
  const h_cons = h50_total * (1 + u_total);

  let usuario_editou_horas = false;
  let h_final = input.cenario === "conservador" ? h_cons : h50_total;
  if (Number.isFinite(input.h_usuario_manual) && Number(input.h_usuario_manual) > 0) {
    usuario_editou_horas = true;
    const manual = Number(input.h_usuario_manual);
    h_final = input.cenario === "conservador" ? manual * (1 + u_total) : manual;
  }

  // Arredondar horas antes de calcular preços
  const h50_rounded = Math.round(h50_total);
  const h_cons_rounded = Math.round(h_cons);
  const h_final_rounded = Math.round(h_final);

  const c_tech = normalizeLevel(f4);
  const premio_tecnico = A * c_tech;
  const ht_aj = input.ht_min * (1 + input.margem_lucro + premio_tecnico);

  // Calcular preços com horas arredondadas
  const preco_h50 = h50_rounded * ht_aj;
  const preco_conservador = h_cons_rounded * ht_aj;
  const preco_final = h_final_rounded * ht_aj;

  const score_complexidade = calcularScoreComplexidade({
    area,
    f3,
    f4,
    f5,
    volumetria,
    tipologia: input.tipologia,
    reforma: input.reforma,
    etapa,
  });

  return {
    h50: h50_rounded,
    h_cons: h_cons_rounded,
    h_final: h_final_rounded,
    ht_aj: Number(ht_aj.toFixed(2)),
    preco_h50: Number(preco_h50.toFixed(2)),
    preco_conservador: Number(preco_conservador.toFixed(2)),
    preco_final: Number(preco_final.toFixed(2)),
    preco_m2: Number((preco_final / area).toFixed(2)),
    score_complexidade,
    classificacao_complexidade: classificarComplexidade(score_complexidade),
    u_total: Number(u_total.toFixed(4)),
    method_version: METHOD_12_VERSION,
    cenario_usado: input.cenario,
    usuario_editou_horas,
    breakdown: {
      r_area: Number(r_area.toFixed(4)),
      m_det,
      t_tipologia,
      v_volumetria,
      e_etapa,
      h_var: Number(h_var.toFixed(4)),
      h_fix: Number(h_fix.toFixed(4)),
      h_projeto: Math.round(h_projeto),
      h_obra: Math.round(h_obra),
      u_base,
      u_f4: Number(u_f4.toFixed(4)),
      u_f5: Number(u_f5.toFixed(4)),
      u_tipologia,
      u_reforma,
      c_tech: Number(c_tech.toFixed(4)),
      margem_lucro_aplicada: input.margem_lucro,
      premio_tecnico: Number(premio_tecnico.toFixed(4)),
    },
  };
}



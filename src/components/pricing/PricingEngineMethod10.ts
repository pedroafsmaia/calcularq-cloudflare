export const METHOD_10_VERSION = "1.0.0";

export const M_DET = [0.85, 1.0, 1.12, 1.25, 1.4] as const;
export const V_VOLUMETRIA = [1.0, 1.08, 1.15, 1.22, 1.3] as const;

export const T_TIPOLOGIA = {
  residencial: 1.0,
  comercial: 1.0,
  institucional: 1.0,
  industrial: 1.0,
  saude: 1.25,
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
  const r_min = 0.9;
  const r_max = 1.85;
  const k = 350;
  const p = 1.2;
  return r_min + (r_max - r_min) / (1 + Math.pow(area / k, p));
}

export function calcularScoreComplexidade(input: {
  area: number;
  f3: number;
  f4: number;
  f5: number;
  volumetria: number;
  tipologia: TipologiaMethod10;
  reforma: boolean;
}): number {
  const normalizar = (nivel: number) => ((clampLevel(nivel) - 1) / 4) * 100;

  let scoreArea = 20;
  if (input.area > 49) scoreArea = 35;
  if (input.area > 149) scoreArea = 50;
  if (input.area > 499) scoreArea = 70;
  if (input.area > 999) scoreArea = 85;

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
    reforma: input.reforma ? 100 : 0,
  };

  const pesos = {
    area: 0.15,
    detalhamento: 0.2,
    tecnica: 0.2,
    burocracia: 0.15,
    volumetria: 0.15,
    tipologia: 0.1,
    reforma: 0.05,
  };

  const score =
    scores.area * pesos.area +
    scores.detalhamento * pesos.detalhamento +
    scores.tecnica * pesos.tecnica +
    scores.burocracia * pesos.burocracia +
    scores.volumetria * pesos.volumetria +
    scores.tipologia * pesos.tipologia +
    scores.reforma * pesos.reforma;

  return Math.round(score);
}

export function classificarComplexidade(score: number): string {
  if (score <= 20) return "Muito Baixa";
  if (score <= 40) return "Baixa a Media";
  if (score <= 60) return "Media";
  if (score <= 80) return "Media a Alta";
  return "Muito Alta";
}

export function calcularMethod10(input: Method10Input): Method10Output {
  if (!Number.isFinite(input.area) || input.area <= 0) throw new Error("Area invalida");
  if (!Number.isFinite(input.ht_min) || input.ht_min <= 0) throw new Error("HT_min invalida");
  if (!Number.isFinite(input.margem_lucro) || input.margem_lucro < 0) throw new Error("Margem invalida");

  const area = input.area;
  const f3 = clampLevel(input.f3_detalhamento);
  const f4 = clampLevel(input.f4_tecnica);
  const f5 = clampLevel(input.f5_burocracia);
  const volumetria = clampLevel(input.volumetria);
  const A = Number.isFinite(input.A) ? Number(input.A) : 0.35;

  const r_area = calcularProdutividade(area);
  const m_det = M_DET[f3 - 1];
  const t_tipologia = T_TIPOLOGIA[input.tipologia] ?? 1;
  const v_volumetria = V_VOLUMETRIA[volumetria - 1];

  const h50 = area * r_area * m_det * t_tipologia * v_volumetria;

  const u_base = 0.2;
  const u_f4 = 0.05 * normalizeLevel(f4);
  const u_f5 = 0.25 * normalizeLevel(f5);
  const u_tipologia =
    input.tipologia === "comercial" || input.tipologia === "institucional" || input.tipologia === "industrial" ? 0.03 : 0;
  const u_reforma = input.reforma ? (f4 + f5 < 7 ? 0.15 : 0.25) : 0;
  const u_total = u_base + u_f4 + u_f5 + u_tipologia + u_reforma;
  const h_cons = h50 * (1 + u_total);

  let usuario_editou_horas = false;
  let h_final = input.cenario === "conservador" ? h_cons : h50;
  if (Number.isFinite(input.h_usuario_manual) && Number(input.h_usuario_manual) > 0) {
    usuario_editou_horas = true;
    const manual = Number(input.h_usuario_manual);
    h_final = input.cenario === "conservador" ? manual * (1 + u_total) : manual;
  }

  const c_tech = normalizeLevel(f4);
  const premio_tecnico = A * c_tech;
  const ht_aj = input.ht_min * (1 + input.margem_lucro + premio_tecnico);

  const preco_h50 = h50 * ht_aj;
  const preco_conservador = h_cons * ht_aj;
  const preco_final = h_final * ht_aj;

  const score_complexidade = calcularScoreComplexidade({
    area,
    f3,
    f4,
    f5,
    volumetria,
    tipologia: input.tipologia,
    reforma: input.reforma,
  });

  return {
    h50: Number(h50.toFixed(2)),
    h_cons: Number(h_cons.toFixed(2)),
    h_final: Number(h_final.toFixed(2)),
    ht_aj: Number(ht_aj.toFixed(2)),
    preco_h50: Number(preco_h50.toFixed(2)),
    preco_conservador: Number(preco_conservador.toFixed(2)),
    preco_final: Number(preco_final.toFixed(2)),
    preco_m2: Number((preco_final / area).toFixed(2)),
    score_complexidade,
    classificacao_complexidade: classificarComplexidade(score_complexidade),
    u_total: Number(u_total.toFixed(4)),
    method_version: METHOD_10_VERSION,
    cenario_usado: input.cenario,
    usuario_editou_horas,
    breakdown: {
      r_area: Number(r_area.toFixed(4)),
      m_det,
      t_tipologia,
      v_volumetria,
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

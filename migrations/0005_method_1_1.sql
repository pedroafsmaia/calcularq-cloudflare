-- Migration 0005: Metodo Calcularq 1.1
-- Registro de parametros calibrados no versionamento do metodo

INSERT INTO method_versions (version, params, calibrated_from_n)
SELECT
  '1.1.0',
  '{"r_min":0.55,"r_max":1.20,"k":250,"p":1.4,"M_det":[0.85,1.00,1.10,1.22,1.35],"T_tipologia":{"residencial":1.00,"comercial":1.10,"institucional":1.20,"industrial":1.00,"saude":1.40},"V_volumetria":[1.00,1.08,1.15,1.22,1.30],"A":0.25,"A_default":0.25,"A_groups":{"A":0.15,"B":0.25,"C":0.35},"u_base_min":0.15,"u_f4_weight":0.05,"u_f5_weight":0.20,"u_tip_industrial":0.02,"u_reforma_low":0.15,"u_reforma_high":0.20,"u_reforma_threshold_sum_f4_f5":7}',
  0
WHERE NOT EXISTS (
  SELECT 1 FROM method_versions WHERE version = '1.1.0'
);

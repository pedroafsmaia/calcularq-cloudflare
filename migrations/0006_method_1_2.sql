-- Migration 0006: Metodo Calcularq 1.2
-- Registro de parametros calibrados no versionamento do metodo

INSERT INTO method_versions (version, params, calibrated_from_n)
SELECT
  '1.2.0',
  '{"r_min":0.55,"r_max":1.20,"k":250,"p":1.4,"hfix_alpha":18,"hfix_a0":15,"hfix_q":1.8,"M_det":[0.85,1.00,1.10,1.22,1.35],"T_tipologia":{"residencial":1.00,"comercial":1.10,"institucional":1.20,"industrial":1.00,"saude":1.40},"V_volumetria":[1.00,1.08,1.15,1.22,1.30],"A":0.25,"A_default":0.25,"A_groups":{"A":0.15,"B":0.25,"C":0.35}}',
  0
WHERE NOT EXISTS (
  SELECT 1 FROM method_versions WHERE version = '1.2.0'
);


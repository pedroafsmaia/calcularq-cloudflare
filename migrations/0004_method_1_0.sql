-- Migration 0004: Metodo Calcularq 1.0
-- Campos adicionais para rastreio/calibracao do metodo

ALTER TABLE budgets ADD COLUMN margem_lucro REAL;
ALTER TABLE budgets ADD COLUMN cenario_escolhido TEXT;
ALTER TABLE budgets ADD COLUMN tipologia TEXT;
ALTER TABLE budgets ADD COLUMN volumetria INTEGER;
ALTER TABLE budgets ADD COLUMN reforma INTEGER DEFAULT 0;
ALTER TABLE budgets ADD COLUMN h50_metodo REAL;
ALTER TABLE budgets ADD COLUMN h_cons_metodo REAL;
ALTER TABLE budgets ADD COLUMN h_usuario_manual REAL;
ALTER TABLE budgets ADD COLUMN score_complexidade INTEGER;
ALTER TABLE budgets ADD COLUMN a_test_group TEXT;
ALTER TABLE budgets ADD COLUMN a_value REAL;
ALTER TABLE budgets ADD COLUMN actual_hours_total REAL;
ALTER TABLE budgets ADD COLUMN actual_hours_by_phase TEXT;
ALTER TABLE budgets ADD COLUMN scope_change TEXT;

ALTER TABLE users ADD COLUMN a_test_group TEXT;

CREATE TABLE IF NOT EXISTS method_versions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version TEXT NOT NULL,
  params TEXT NOT NULL,
  calibrated_from_n INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS calibration_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version_from TEXT NOT NULL,
  version_to TEXT NOT NULL,
  changes TEXT NOT NULL,
  auto_approved INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_score_complexidade ON budgets(user_id, score_complexidade);

INSERT INTO method_versions (version, params, calibrated_from_n)
SELECT
  '1.0.0',
  '{"r_min":0.90,"r_max":1.85,"k":350,"p":1.2,"M_det":[0.85,1.00,1.12,1.25,1.40],"T_tipologia":{"residencial":1.00,"comercial":1.00,"institucional":1.00,"industrial":1.00,"saude":1.25},"V_volumetria":[1.00,1.08,1.15,1.22,1.30],"A":0.35,"u_base_min":0.20}',
  0
WHERE NOT EXISTS (
  SELECT 1 FROM method_versions WHERE version = '1.0.0'
);

-- Add closed_at marker for post-project feedback workflow
ALTER TABLE budgets ADD COLUMN closed_at TEXT;

CREATE INDEX IF NOT EXISTS idx_budgets_user_closed ON budgets(user_id, closed_at);

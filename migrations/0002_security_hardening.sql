CREATE TABLE IF NOT EXISTS request_rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  window_start_ms INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_request_rate_limits_updated_at
  ON request_rate_limits(updated_at);

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT,
  created_at TEXT NOT NULL
);

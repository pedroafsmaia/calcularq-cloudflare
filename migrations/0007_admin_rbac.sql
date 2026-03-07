-- Migration 0007: RBAC admin via users.is_admin
-- Mantém compatibilidade com fallback em ADMIN_EMAIL no backend.

ALTER TABLE users ADD COLUMN is_admin INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);

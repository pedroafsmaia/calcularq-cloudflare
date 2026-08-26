-- Records explicit acceptance for accounts created after the legal-document update.
-- Existing users remain unchanged and are not required to accept again automatically.
ALTER TABLE users ADD COLUMN terms_accepted_at TEXT;
ALTER TABLE users ADD COLUMN terms_version TEXT;
ALTER TABLE users ADD COLUMN privacy_version TEXT;

-- Optional, manual-only maintenance for accounts incorrectly marked as paid
-- while the free mode was previously active. Do not run automatically.
--
-- Confirmed schema: users.has_paid, users.payment_date and
-- users.stripe_customer_id are defined in migrations/0001_init.sql.
UPDATE users
SET has_paid = 0,
    payment_date = NULL
WHERE has_paid = 1
  AND (stripe_customer_id IS NULL OR TRIM(stripe_customer_id) = '');

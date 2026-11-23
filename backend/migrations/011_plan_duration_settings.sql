ALTER TABLE plans
  ADD COLUMN IF NOT EXISTS duration_days INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS warning_before_expiry_days INTEGER NOT NULL DEFAULT 7;

ALTER TABLE plans
  DROP COLUMN IF EXISTS max_users,
  DROP COLUMN IF EXISTS max_tickets;

ALTER TABLE plans
  DROP CONSTRAINT IF EXISTS plans_duration_days_check,
  DROP CONSTRAINT IF EXISTS plans_warning_before_expiry_days_check;

ALTER TABLE plans
  ADD CONSTRAINT plans_duration_days_check CHECK (duration_days > 0),
  ADD CONSTRAINT plans_warning_before_expiry_days_check
    CHECK (warning_before_expiry_days >= 0 AND warning_before_expiry_days < duration_days);

UPDATE plans
SET duration_days = 50,
    warning_before_expiry_days = 10,
    updated_at = now()
WHERE plan_code = 'demo';

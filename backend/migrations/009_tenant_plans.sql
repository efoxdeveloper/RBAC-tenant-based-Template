ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS legal_name TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS email CITEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS tax_number TEXT;

UPDATE tenants
SET legal_name = COALESCE(legal_name, name),
    display_name = COALESCE(display_name, name),
    updated_at = now()
WHERE legal_name IS NULL OR display_name IS NULL;

CREATE TABLE IF NOT EXISTS plans (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plan_code TEXT NOT NULL UNIQUE,
  plan_name TEXT NOT NULL,
  description TEXT,
  max_users INTEGER,
  max_tickets INTEGER,
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT plans_max_users_check CHECK (max_users IS NULL OR max_users >= 0),
  CONSTRAINT plans_max_tickets_check CHECK (max_tickets IS NULL OR max_tickets >= 0)
);

CREATE TABLE IF NOT EXISTS tenant_addresses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id BIGINT UNIQUE NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id BIGINT NOT NULL REFERENCES plans(id),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('trialing', 'active', 'cancelled', 'expired', 'suspended')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_ends_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tenant_current_subscription_unique
  ON tenant_subscriptions (tenant_id)
  WHERE status IN ('trialing', 'active');

INSERT INTO plans (
  plan_code,
  plan_name,
  description,
  max_users,
  max_tickets,
  features
)
VALUES (
  'demo',
  'Demo',
  'Demo plan for evaluation and initial onboarding.',
  5,
  100,
  '{"reports": true, "page_permissions": true}'::jsonb
)
ON CONFLICT (plan_code) DO UPDATE SET
  plan_name = EXCLUDED.plan_name,
  description = EXCLUDED.description,
  max_users = EXCLUDED.max_users,
  max_tickets = EXCLUDED.max_tickets,
  features = EXCLUDED.features,
  updated_at = now();

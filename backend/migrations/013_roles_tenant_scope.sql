ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS tenant_id BIGINT REFERENCES tenants(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE roles
  DROP CONSTRAINT IF EXISTS roles_role_key_key;

ALTER TABLE roles
  DROP CONSTRAINT IF EXISTS roles_platform_tenant_check;

ALTER TABLE roles
  ADD CONSTRAINT roles_platform_tenant_check
  CHECK (scope <> 'platform' OR tenant_id IS NULL);

CREATE UNIQUE INDEX IF NOT EXISTS roles_platform_role_key_unique
  ON roles (role_key)
  WHERE tenant_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS roles_tenant_role_key_unique
  ON roles (tenant_id, role_key)
  WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS roles_tenant_id_idx ON roles (tenant_id);

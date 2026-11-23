CREATE TABLE IF NOT EXISTS pages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  page_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  route TEXT NOT NULL UNIQUE,
  icon_key TEXT,
  parent_id BIGINT REFERENCES pages(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_menu_item BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS page_actions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  page_id BIGINT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  action_key TEXT NOT NULL,
  action_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (page_id, action_key)
);

CREATE TABLE IF NOT EXISTS role_page_permissions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  page_action_id BIGINT NOT NULL REFERENCES page_actions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (role_id, page_action_id)
);

CREATE INDEX IF NOT EXISTS pages_parent_id_idx ON pages (parent_id);
CREATE INDEX IF NOT EXISTS page_actions_page_id_idx ON page_actions (page_id);
CREATE INDEX IF NOT EXISTS role_page_permissions_role_id_idx
  ON role_page_permissions (role_id);

INSERT INTO pages (
  page_key,
  display_name,
  route,
  icon_key,
  sort_order
)
VALUES (
  'page-master',
  'Page Master',
  '/app/page-master',
  'page-master',
  100
)
ON CONFLICT (page_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  route = EXCLUDED.route,
  icon_key = EXCLUDED.icon_key,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO page_actions (page_id, action_key, action_name)
SELECT
  p.id,
  action.action_key,
  action.action_name
FROM pages AS p
CROSS JOIN (
  VALUES
    ('view', 'View'),
    ('create', 'Create'),
    ('update', 'Update'),
    ('delete', 'Delete')
) AS action(action_key, action_name)
WHERE p.page_key = 'page-master'
ON CONFLICT (page_id, action_key) DO UPDATE SET
  action_name = EXCLUDED.action_name;

INSERT INTO role_page_permissions (role_id, page_action_id)
SELECT
  r.id,
  pa.id
FROM roles AS r
JOIN pages AS p ON p.page_key = 'page-master'
JOIN page_actions AS pa ON pa.page_id = p.id
WHERE r.role_key = 'superadmin'
  AND r.scope = 'platform'
ON CONFLICT (role_id, page_action_id) DO NOTHING;

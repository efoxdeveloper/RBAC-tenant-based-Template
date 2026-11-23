INSERT INTO pages (
  page_key,
  display_name,
  route,
  icon_key,
  page_type,
  sort_order
)
VALUES (
  'permissions',
  'Permissions',
  '/app/permissions',
  'admin-panel-settings',
  'tenant',
  60
)
ON CONFLICT (page_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  route = EXCLUDED.route,
  icon_key = EXCLUDED.icon_key,
  page_type = EXCLUDED.page_type,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO page_actions (page_id, action_key, action_name)
SELECT p.id, action.action_key, action.action_name
FROM pages AS p
CROSS JOIN (
  VALUES
    ('view', 'View'),
    ('update', 'Update')
) AS action(action_key, action_name)
WHERE p.page_key = 'permissions'
ON CONFLICT (page_id, action_key) DO UPDATE SET action_name = EXCLUDED.action_name;

INSERT INTO role_page_permissions (role_id, page_action_id)
SELECT r.id, pa.id
FROM roles AS r
JOIN pages AS p ON p.page_key = 'permissions'
JOIN page_actions AS pa ON pa.page_id = p.id
WHERE r.role_key IN ('superadmin', 'administrator')
  AND ((r.role_key = 'superadmin' AND r.scope = 'platform')
    OR (r.role_key = 'administrator' AND r.scope = 'tenant'))
ON CONFLICT (role_id, page_action_id) DO NOTHING;

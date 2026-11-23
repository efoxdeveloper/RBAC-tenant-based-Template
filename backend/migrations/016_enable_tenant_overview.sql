UPDATE pages
SET page_type = 'tenant',
    display_name = 'Overview',
    updated_at = now()
WHERE page_key = 'dashboard';

INSERT INTO page_actions (page_id, action_key, action_name)
SELECT p.id, 'view', 'View'
FROM pages AS p
WHERE p.page_key = 'dashboard'
ON CONFLICT (page_id, action_key) DO NOTHING;

INSERT INTO role_page_permissions (role_id, page_action_id)
SELECT r.id, pa.id
FROM roles AS r
JOIN pages AS p ON p.page_key = 'dashboard'
JOIN page_actions AS pa
  ON pa.page_id = p.id
 AND pa.action_key = 'view'
WHERE r.role_key = 'administrator'
  AND r.scope = 'tenant'
ON CONFLICT (role_id, page_action_id) DO NOTHING;

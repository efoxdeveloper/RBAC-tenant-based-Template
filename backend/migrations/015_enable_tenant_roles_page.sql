UPDATE pages
SET page_type = 'tenant',
    updated_at = now()
WHERE page_key = 'roles';

INSERT INTO role_page_permissions (role_id, page_action_id)
SELECT r.id, pa.id
FROM roles AS r
JOIN pages AS p ON p.page_key = 'roles'
JOIN page_actions AS pa ON pa.page_id = p.id
WHERE r.role_key = 'administrator'
  AND r.scope = 'tenant'
ON CONFLICT (role_id, page_action_id) DO NOTHING;

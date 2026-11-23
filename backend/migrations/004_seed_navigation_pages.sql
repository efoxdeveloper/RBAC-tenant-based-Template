INSERT INTO pages (page_key, display_name, route, icon_key, sort_order)
VALUES
  ('dashboard', 'Overview', '/app/dashboard', 'dashboard', 10),
  ('inbox', 'Inbox', '/app/inbox', 'inbox', 20),
  ('tickets', 'Tickets', '/app/tickets', 'tickets', 30),
  ('customers', 'Customers', '/app/customers', 'customers', 40),
  ('reports', 'Reports', '/app/reports', 'reports', 50),
  ('settings', 'Settings', '/app/settings', 'settings', 60)
ON CONFLICT (page_key) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  route = EXCLUDED.route,
  icon_key = EXCLUDED.icon_key,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO page_actions (page_id, action_key, action_name)
SELECT p.id, 'view', 'View'
FROM pages AS p
WHERE p.page_key IN ('dashboard', 'inbox', 'tickets', 'customers', 'reports', 'settings')
ON CONFLICT (page_id, action_key) DO NOTHING;

INSERT INTO role_page_permissions (role_id, page_action_id)
SELECT r.id, pa.id
FROM roles AS r
JOIN pages AS p
  ON p.page_key IN ('dashboard', 'inbox', 'tickets', 'customers', 'reports', 'settings')
JOIN page_actions AS pa
  ON pa.page_id = p.id
 AND pa.action_key = 'view'
WHERE r.role_key = 'superadmin'
  AND r.scope = 'platform'
ON CONFLICT (role_id, page_action_id) DO NOTHING;

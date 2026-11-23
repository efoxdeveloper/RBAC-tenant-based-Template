UPDATE pages
SET
  is_active = false,
  is_menu_item = false,
  updated_at = now()
WHERE page_key IN ('inbox', 'tickets', 'customers', 'reports');

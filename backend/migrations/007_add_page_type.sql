ALTER TABLE pages
  ADD COLUMN IF NOT EXISTS page_type TEXT NOT NULL DEFAULT 'tenant';

ALTER TABLE pages
  ADD CONSTRAINT pages_page_type_check
  CHECK (page_type IN ('platform', 'tenant'));

UPDATE pages
SET page_type = 'platform', updated_at = now()
WHERE page_key = 'page-master';

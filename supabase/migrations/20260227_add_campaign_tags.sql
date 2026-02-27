ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS tags text[] DEFAULT ARRAY[]::text[];

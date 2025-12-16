-- Create brand_logos table
CREATE TABLE IF NOT EXISTS brand_logos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    image_url TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add unique constraint on name safely
DO $$
BEGIN
    IF NOT EXISTS (select 1 from pg_constraint where conname = 'brand_logos_name_key') THEN
        ALTER TABLE brand_logos ADD CONSTRAINT brand_logos_name_key UNIQUE (name);
    END IF;
END $$;

-- Enable RLS
ALTER TABLE brand_logos ENABLE ROW LEVEL SECURITY;

-- Policies (Re-create safely)
DROP POLICY IF EXISTS "Public Read Access" ON brand_logos;
CREATE POLICY "Public Read Access" ON brand_logos FOR SELECT USING (true);

-- Migrate existing data from site_settings (safe to run multiple times due to ON CONFLICT)
INSERT INTO brand_logos (name, image_url, "order")
SELECT
    value->>'name',
    value->>'imageUrl',
    REGEXP_REPLACE(value->>'order', '[^0-9]', '0', 'g')::int -- Ensure integer
FROM site_settings, jsonb_array_elements(brand_logos)
WHERE id = 1 AND brand_logos IS NOT NULL
ON CONFLICT (name) DO UPDATE SET
    image_url = EXCLUDED.image_url,
    "order" = EXCLUDED."order";


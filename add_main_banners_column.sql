-- Add main_banners column to site_settings table
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS main_banners JSONB DEFAULT '[]'::jsonb;

-- Comment: This column will store an array of banner objects: { id, imageUrl, link, order }

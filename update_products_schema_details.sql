-- Add details column to products table for storing colors, sizes, etc.
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN products.details IS 'Stores product variants like colors, sizes, and other details in JSON format';

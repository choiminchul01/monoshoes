-- Add visibility toggle columns to site_settings table
-- Run this in Supabase SQL Editor

ALTER TABLE site_settings
ADD COLUMN IF NOT EXISTS show_owner_name BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_business_license BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_mail_order_license BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_address BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_cs_phone BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_cs_hours BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS show_cs_email BOOLEAN DEFAULT true;

-- Update existing row to have all fields visible by default
UPDATE site_settings SET
    show_owner_name = true,
    show_business_license = true,
    show_mail_order_license = true,
    show_address = true,
    show_cs_phone = true,
    show_cs_hours = true,
    show_cs_email = true
WHERE id = 1;

-- Create partner_inquiries table for partnership page inquiries
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS partner_inquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    inquiry_type VARCHAR(100),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'replied', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_partner_inquiries_status ON partner_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_partner_inquiries_created_at ON partner_inquiries(created_at DESC);

-- Enable RLS
ALTER TABLE partner_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public form)
CREATE POLICY "Anyone can insert partner inquiries"
ON partner_inquiries FOR INSERT
TO public
WITH CHECK (true);

-- Only authenticated users (admins) can view
CREATE POLICY "Authenticated users can view partner inquiries"
ON partner_inquiries FOR SELECT
TO authenticated
USING (true);

-- Only authenticated users can update
CREATE POLICY "Authenticated users can update partner inquiries"
ON partner_inquiries FOR UPDATE
TO authenticated
USING (true);

-- Only authenticated users can delete
CREATE POLICY "Authenticated users can delete partner inquiries"
ON partner_inquiries FOR DELETE
TO authenticated
USING (true);

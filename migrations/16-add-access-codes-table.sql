-- Add Access Codes table for code generation and management
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS ra_cadet_access_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  order_id UUID REFERENCES ra_cadet_orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT -- Track who created the code (admin user)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ra_cadet_access_codes_code ON ra_cadet_access_codes(code);
CREATE INDEX IF NOT EXISTS idx_ra_cadet_access_codes_used ON ra_cadet_access_codes(used);

-- Enable Row Level Security
ALTER TABLE ra_cadet_access_codes ENABLE ROW LEVEL SECURITY;

-- Policies for access codes
CREATE POLICY "ra_cadet_access_codes are viewable by everyone"
  ON ra_cadet_access_codes FOR SELECT
  USING (true);

CREATE POLICY "ra_cadet_access_codes are insertable"
  ON ra_cadet_access_codes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "ra_cadet_access_codes are updatable"
  ON ra_cadet_access_codes FOR UPDATE
  USING (true);

-- Verify table was created
SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE tablename = 'ra_cadet_access_codes';


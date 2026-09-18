-- Add email column to access codes table to track who used each code
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE ra_cadet_access_codes
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_ra_cadet_access_codes_email ON ra_cadet_access_codes(email);

-- Verify the column was added
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'ra_cadet_access_codes'
ORDER BY ordinal_position;


-- Consolidate T-Shirts: Remove LIFT product and combine inventory into RA
-- Run this SQL in your Supabase SQL Editor

-- First, get current RA inventory
-- Then delete LIFT t-shirt product
DELETE FROM ra_cadet_products
WHERE category = 'tshirt' AND program = 'LIFT';

-- Update RA t-shirt inventory (combining both programs)
-- RA: XS: 5, S: 14, M: 14, L: 20, XL: 20, 2XL: 15, 3XL: 5, 4XL: 3
-- LIFT: XS: 5, S: 14, M: 14, L: 20, XL: 20, 2XL: 15, 3XL: 5, 4XL: 3
-- Combined: XS: 10, S: 28, M: 28, L: 40, XL: 40, 2XL: 30, 3XL: 10, 4XL: 6
-- Total: 192

UPDATE ra_cadet_products
SET 
  inventory_by_size = '{"XS": 10, "S": 28, "M": 28, "L": 40, "XL": 40, "2XL": 30, "3XL": 10, "4XL": 6}'::jsonb,
  inventory = 192
WHERE category = 'tshirt' AND program = 'RA';

-- Verify the update
SELECT 
  name,
  program,
  customer_item_number,
  thumbnail_url,
  inventory_by_size,
  inventory
FROM ra_cadet_products
WHERE category = 'tshirt'
ORDER BY program;

-- Should only return 1 row (RA product)


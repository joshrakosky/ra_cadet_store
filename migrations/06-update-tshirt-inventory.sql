-- Update T-Shirt Inventory for RA and LIFT
-- Run this SQL in your Supabase SQL Editor
-- Inventory: XS: 5, S: 14, M: 14, L: 20, XL: 20, 2XL: 15, 3XL: 5, 4XL: 3
-- Total: 96

-- Update Republic Airways T-Shirt Inventory
UPDATE ra_cadet_products
SET 
  inventory_by_size = '{"XS": 5, "S": 14, "M": 14, "L": 20, "XL": 20, "2XL": 15, "3XL": 5, "4XL": 3}'::jsonb,
  inventory = 96
WHERE category = 'tshirt' AND program = 'RA';

-- Update LIFT Academy T-Shirt Inventory
UPDATE ra_cadet_products
SET 
  inventory_by_size = '{"XS": 5, "S": 14, "M": 14, "L": 20, "XL": 20, "2XL": 15, "3XL": 5, "4XL": 3}'::jsonb,
  inventory = 96
WHERE category = 'tshirt' AND program = 'LIFT';

-- Verify the updates
SELECT 
  name,
  program,
  inventory_by_size,
  inventory
FROM ra_cadet_products
WHERE category = 'tshirt'
ORDER BY program;


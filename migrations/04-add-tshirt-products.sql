-- Add T-Shirt Products for Republic Airways New Hires
-- Run this SQL in your Supabase SQL Editor
-- Each program has ONE product with all sizes available

-- Remove existing t-shirt products if they exist (uncomment to reset)
-- DELETE FROM ra_cadet_products WHERE category = 'tshirt';

-- Republic Airways T-Shirt Product (all sizes)
INSERT INTO ra_cadet_products (
  name,
  category,
  program,
  requires_size,
  available_sizes,
  customer_item_number,
  thumbnail_url,
  inventory_by_size,
  inventory
) 
SELECT 
  'Republic Airways New Hire T-Shirt',
  'tshirt',
  'RA',
  true,
  ARRAY['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'],
  'RA-NH-TEE',
  '/images/RA-NH-TEE.png',
  '{"XS": 10, "S": 20, "M": 30, "L": 25, "XL": 20, "2XL": 15, "3XL": 10, "4XL": 5}'::jsonb,
  135
WHERE NOT EXISTS (
  SELECT 1 FROM ra_cadet_products 
  WHERE category = 'tshirt' AND program = 'RA'
);

-- LIFT Academy T-Shirt Product (all sizes)
INSERT INTO ra_cadet_products (
  name,
  category,
  program,
  requires_size,
  available_sizes,
  customer_item_number,
  thumbnail_url,
  inventory_by_size,
  inventory
)
SELECT 
  'LIFT Academy New Hire T-Shirt',
  'tshirt',
  'LIFT',
  true,
  ARRAY['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'],
  'LIFT-NH-TEE',
  '/images/LIFT-NH-TEE.png',
  '{"XS": 10, "S": 20, "M": 30, "L": 25, "XL": 20, "2XL": 15, "3XL": 10, "4XL": 5}'::jsonb,
  135
WHERE NOT EXISTS (
  SELECT 1 FROM ra_cadet_products 
  WHERE category = 'tshirt' AND program = 'LIFT'
);

-- Verify the products were added
SELECT 
  id,
  name,
  category,
  program,
  customer_item_number,
  thumbnail_url,
  inventory_by_size,
  inventory
FROM ra_cadet_products
WHERE category = 'tshirt'
ORDER BY program;

-- Note: 
-- - Update inventory_by_size values as needed for actual inventory
-- - SKUs for individual sizes will be: RA-NH-TEE-XS, RA-NH-TEE-S, etc. (handled in order processing)
-- - Thumbnail images should be placed in /public/images/:
--   - RA-NH-TEE.png (or .jpg, .svg, .webp)
--   - LIFT-NH-TEE.png (or .jpg, .svg, .webp)

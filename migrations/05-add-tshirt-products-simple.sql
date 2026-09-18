-- Simple version - Add T-Shirt Products
-- Run this in Supabase SQL Editor

-- Republic Airways T-Shirt
INSERT INTO ra_cadet_products (
  name, category, program, requires_size, available_sizes, customer_item_number, thumbnail_url, inventory_by_size, inventory
) VALUES (
  'Republic Airways New Hire T-Shirt',
  'tshirt',
  'RA',
  true,
  ARRAY['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'],
  'RA-NH-TEE',
  '/images/RA-NH-TEE.png',
  '{"XS": 10, "S": 20, "M": 30, "L": 25, "XL": 20, "2XL": 15, "3XL": 10, "4XL": 5}'::jsonb,
  135
);

-- LIFT Academy T-Shirt
INSERT INTO ra_cadet_products (
  name, category, program, requires_size, available_sizes, customer_item_number, thumbnail_url, inventory_by_size, inventory
) VALUES (
  'LIFT Academy New Hire T-Shirt',
  'tshirt',
  'LIFT',
  true,
  ARRAY['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'],
  'LIFT-NH-TEE',
  '/images/LIFT-NH-TEE.png',
  '{"XS": 10, "S": 20, "M": 30, "L": 25, "XL": 20, "2XL": 15, "3XL": 10, "4XL": 5}'::jsonb,
  135
);


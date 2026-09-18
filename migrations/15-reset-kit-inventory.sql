-- Reset Kit and T-Shirt Inventory back to original values after testing
-- Run this SQL in your Supabase SQL Editor
-- Resets inventory values for all 8 kits (4 RA + 4 LIFT) and t-shirts

-- RA New Hire Kit 1 - 12 available
UPDATE ra_cadet_products
SET inventory = 12
WHERE customer_item_number = 'RA-KIT-NEWHIRE-1';

-- RA New Hire Kit 2 - 10 available
UPDATE ra_cadet_products
SET inventory = 10
WHERE customer_item_number = 'RA-KIT-NEWHIRE-2';

-- RA New Hire Kit 3 - 10 available
UPDATE ra_cadet_products
SET inventory = 10
WHERE customer_item_number = 'RA-KIT-NEWHIRE-3';

-- RA New Hire Kit 4 - 10 available
UPDATE ra_cadet_products
SET inventory = 10
WHERE customer_item_number = 'RA-KIT-NEWHIRE-4';

-- LIFT New Hire Kit 1 - 12 available
UPDATE ra_cadet_products
SET inventory = 12
WHERE customer_item_number = 'LIFT-KIT-NEWHIRE-1';

-- LIFT New Hire Kit 2 - 10 available
UPDATE ra_cadet_products
SET inventory = 10
WHERE customer_item_number = 'LIFT-KIT-NEWHIRE-2';

-- LIFT New Hire Kit 3 - 10 available
UPDATE ra_cadet_products
SET inventory = 10
WHERE customer_item_number = 'LIFT-KIT-NEWHIRE-3';

-- LIFT New Hire Kit 4 - 10 available
UPDATE ra_cadet_products
SET inventory = 10
WHERE customer_item_number = 'LIFT-KIT-NEWHIRE-4';

-- Reset T-Shirt Inventory (RA t-shirt used for both RA and LIFT programs)
-- Inventory: XS: 10, S: 28, M: 28, L: 40, XL: 40, 2XL: 30, 3XL: 10, 4XL: 6
-- Total: 192
UPDATE ra_cadet_products
SET 
  inventory_by_size = '{"XS": 10, "S": 28, "M": 28, "L": 40, "XL": 40, "2XL": 30, "3XL": 10, "4XL": 6}'::jsonb,
  inventory = 192
WHERE category = 'tshirt' AND program = 'RA';

-- Verify the inventory was reset
SELECT 
  id,
  name,
  category,
  program,
  customer_item_number,
  inventory,
  inventory_by_size,
  created_at
FROM ra_cadet_products
WHERE category IN ('kit', 'tshirt')
ORDER BY category, program, customer_item_number;


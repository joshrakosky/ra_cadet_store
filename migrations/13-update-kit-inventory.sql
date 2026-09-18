-- Update Kit Inventory for RA and LIFT Academy kits
-- Run this SQL in your Supabase SQL Editor
-- Updates inventory values for all 8 kits (4 RA + 4 LIFT)

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

-- Verify the inventory was updated
SELECT 
  id,
  name,
  category,
  program,
  customer_item_number,
  inventory,
  created_at
FROM ra_cadet_products
WHERE category = 'kit'
ORDER BY program, customer_item_number;


-- Update Kit Inventory to 25 for all Republic Airways and LIFT Academy kits
-- Run this SQL in your Supabase SQL Editor

UPDATE ra_cadet_products
SET inventory = 25
WHERE category = 'kit';

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


-- Verify T-Shirt Products Exist
-- Run this to check if t-shirt products are in the database

SELECT 
  id,
  name,
  category,
  program,
  customer_item_number,
  thumbnail_url,
  available_sizes,
  inventory_by_size,
  inventory,
  created_at
FROM ra_cadet_products
WHERE category = 'tshirt'
ORDER BY program, name;

-- Should return 2 rows (one for RA, one for LIFT)


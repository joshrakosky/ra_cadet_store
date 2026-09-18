-- Update Heritage Backpack name to "Mercer+Mettle Pack"
-- Run this SQL in your Supabase SQL Editor
-- This updates the product name in kit_items JSONB arrays

-- Update LIFT Kit 1 - Replace "Heritage Backpack" with "Mercer+Mettle Pack"
UPDATE ra_cadet_products
SET kit_items = (
  SELECT jsonb_agg(
    CASE 
      WHEN item->>'name' = 'LIFT Academy Heritage Backpack' 
      THEN jsonb_set(item, '{name}', '"LIFT Academy Mercer+Mettle Pack"')
      ELSE item
    END
  )
  FROM jsonb_array_elements(kit_items) AS item
)
WHERE customer_item_number = 'LIFT-KIT-NEWHIRE-1'
  AND kit_items::text LIKE '%Heritage Backpack%';

-- Update RA Kit 1 - Replace "Heritage Backpack" with "Mercer+Mettle Pack"
UPDATE ra_cadet_products
SET kit_items = (
  SELECT jsonb_agg(
    CASE 
      WHEN item->>'name' = 'Republic Airways Heritage Backpack' 
      THEN jsonb_set(item, '{name}', '"Republic Airways Mercer+Mettle Pack"')
      ELSE item
    END
  )
  FROM jsonb_array_elements(kit_items) AS item
)
WHERE customer_item_number = 'RA-KIT-NEWHIRE-1'
  AND kit_items::text LIKE '%Heritage Backpack%';

-- Verify the updates
SELECT 
  id,
  name,
  program,
  customer_item_number,
  kit_items
FROM ra_cadet_products
WHERE customer_item_number IN ('LIFT-KIT-NEWHIRE-1', 'RA-KIT-NEWHIRE-1')
ORDER BY program, customer_item_number;

-- Note:
-- Product names updated from "Heritage Backpack" to "Mercer+Mettle Pack"
-- Thumbnail URLs remain the same (LIFT-KIT-NH-BACKPACK.png, RA-KIT-NH-BACKPACK.png)


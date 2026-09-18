-- Update Heritage Backpack SKUs to new BACKPACK SKUs
-- Run this SQL in your Supabase SQL Editor
-- This updates existing kit_items to use the new BACKPACK thumbnail names

-- Update LIFT Kit 1 - Replace HERITAGE with BACKPACK
UPDATE ra_cadet_products
SET kit_items = (
  SELECT jsonb_agg(
    CASE 
      WHEN item->>'thumbnail_url' = '/images/LIFT-KIT-NH-HERITAGE.png' 
      THEN jsonb_set(item, '{thumbnail_url}', '"\/images\/LIFT-KIT-NH-BACKPACK.png"')
      ELSE item
    END
  )
  FROM jsonb_array_elements(kit_items) AS item
)
WHERE customer_item_number = 'LIFT-KIT-NEWHIRE-1'
  AND kit_items::text LIKE '%LIFT-KIT-NH-HERITAGE%';

-- Update RA Kit 1 - Replace HERITAGE with BACKPACK
UPDATE ra_cadet_products
SET kit_items = (
  SELECT jsonb_agg(
    CASE 
      WHEN item->>'thumbnail_url' = '/images/RA-KIT-NH-HERITAGE.png' 
      THEN jsonb_set(item, '{thumbnail_url}', '"\/images\/RA-KIT-NH-BACKPACK.png"')
      ELSE item
    END
  )
  FROM jsonb_array_elements(kit_items) AS item
)
WHERE customer_item_number = 'RA-KIT-NEWHIRE-1'
  AND kit_items::text LIKE '%RA-KIT-NH-HERITAGE%';

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
-- Thumbnail images should be renamed/placed in /public/images/:
--   - LIFT-KIT-NH-BACKPACK.png (replaces LIFT-KIT-NH-HERITAGE.png)
--   - RA-KIT-NH-BACKPACK.png (replaces RA-KIT-NH-HERITAGE.png)


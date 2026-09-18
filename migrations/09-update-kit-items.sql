-- Update kit_items for all Republic Airways and LIFT Academy kits
-- Run this SQL in your Supabase SQL Editor
-- This sets the common items for each kit (2-3 kit-specific items will be added later)

-- Republic Airways Kits - Common items for all RA kits
UPDATE ra_cadet_products
SET kit_items = '[
  {"name": "Republic Airways New Hire Lanyard", "thumbnail_url": "/images/RA-KIT-NH-LANYARD.png"},
  {"name": "Clear Badge Holder", "thumbnail_url": "/images/RA-KIT-BADGE.png"},
  {"name": "BEST Card", "thumbnail_url": "/images/RA-KIT-BEST.png"}
]'::jsonb
WHERE category = 'kit' 
  AND program = 'RA';

-- LIFT Academy Kits - Common items for all LIFT kits
UPDATE ra_cadet_products
SET kit_items = '[
  {"name": "LIFT Academy New Hire Lanyard", "thumbnail_url": "/images/LIFT-KIT-NH-LANYARD.png"},
  {"name": "Clear Badge Holder", "thumbnail_url": "/images/RA-KIT-BADGE.png"},
  {"name": "BEST Card", "thumbnail_url": "/images/RA-KIT-BEST.png"}
]'::jsonb
WHERE category = 'kit' 
  AND program = 'LIFT';

-- Verify the kit_items were updated
SELECT 
  id,
  name,
  program,
  customer_item_number,
  kit_items,
  inventory
FROM ra_cadet_products
WHERE category = 'kit'
ORDER BY program, customer_item_number;

-- Note:
-- - Thumbnail images should be placed in /public/images/:
--   - RA-KIT-NH-LANYARD.png (updated SKU)
--   - LIFT-KIT-NH-LANYARD.png (updated SKU)
--   - RA-KIT-BADGE.png
--   - RA-KIT-BEST.png
-- - Kit-specific items (2-3 per kit) will be added later
-- - See update-kit-items-with-specifics.sql for LIFT kit-specific items
-- - To add kit-specific items, update individual kits by customer_item_number:
--   UPDATE ra_cadet_products
--   SET kit_items = kit_items || '[
--     {"name": "Kit Specific Item 1", "thumbnail_url": "/images/item1.png"},
--     {"name": "Kit Specific Item 2", "thumbnail_url": "/images/item2.png"}
--   ]'::jsonb
--   WHERE customer_item_number = 'RA-KIT-NEWHIRE-1';


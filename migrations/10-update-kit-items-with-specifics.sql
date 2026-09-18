-- Update kit_items with corrected lanyard SKUs and add kit-specific items
-- Run this SQL in your Supabase SQL Editor

-- First, update common items with corrected lanyard SKUs for RA kits
UPDATE ra_cadet_products
SET kit_items = '[
  {"name": "Republic Airways New Hire Lanyard", "thumbnail_url": "/images/RA-KIT-NH-LANYARD.png"},
  {"name": "Clear Badge Holder", "thumbnail_url": "/images/RA-KIT-BADGE.png"},
  {"name": "BEST Card", "thumbnail_url": "/images/RA-KIT-BEST.png"}
]'::jsonb
WHERE category = 'kit' 
  AND program = 'RA';

-- Update common items with corrected lanyard SKU for LIFT kits
UPDATE ra_cadet_products
SET kit_items = '[
  {"name": "LIFT Academy New Hire Lanyard", "thumbnail_url": "/images/LIFT-KIT-NH-LANYARD.png"},
  {"name": "Clear Badge Holder", "thumbnail_url": "/images/RA-KIT-BADGE.png"},
  {"name": "BEST Card", "thumbnail_url": "/images/RA-KIT-BEST.png"}
]'::jsonb
WHERE category = 'kit' 
  AND program = 'LIFT';

-- LIFT Kit 1 - Add kit-specific items
UPDATE ra_cadet_products
SET kit_items = kit_items || '[
  {"name": "LIFT Academy Mercer+Mettle Pack", "thumbnail_url": "/images/LIFT-KIT-NH-BACKPACK.png"},
  {"name": "LIFT Academy Neoskin RFID Passport Holder", "thumbnail_url": "/images/LIFT-KIT-NH-PASSPORT.png"}
]'::jsonb
WHERE customer_item_number = 'LIFT-KIT-NEWHIRE-1';

-- LIFT Kit 2 - Add kit-specific items
UPDATE ra_cadet_products
SET kit_items = kit_items || '[
  {"name": "LIFT Academy Snap2 Magnetic Wallet", "thumbnail_url": "/images/LIFT-KIT-NH-WALLET.png"},
  {"name": "LIFT Academy Built2Work Bag", "thumbnail_url": "/images/LIFT-KIT-NH-BUILT2WORK.png"},
  {"name": "LIFT Academy Perth Bottle", "thumbnail_url": "/images/LIFT-KIT-NH-PERTH.png"}
]'::jsonb
WHERE customer_item_number = 'LIFT-KIT-NEWHIRE-2';

-- LIFT Kit 3 - Add kit-specific items
UPDATE ra_cadet_products
SET kit_items = kit_items || '[
  {"name": "LIFT Academy Carry-All Toiletry Bag", "thumbnail_url": "/images/LIFT-KIT-NH-TOILETRY.png"},
  {"name": "LIFT Academy Manicure Set", "thumbnail_url": "/images/LIFT-KIT-NH-MANICURE.png"},
  {"name": "LIFT Academy Collapsible Bottle", "thumbnail_url": "/images/LIFT-KIT-NH-COLLAPSE.png"},
  {"name": "LIFT Academy Workflow Travel Caddy", "thumbnail_url": "/images/LIFT-KIT-NH-CADDY.png"}
]'::jsonb
WHERE customer_item_number = 'LIFT-KIT-NEWHIRE-3';

-- LIFT Kit 4 - Add kit-specific items
UPDATE ra_cadet_products
SET kit_items = kit_items || '[
  {"name": "LIFT Academy The Slim Power Bank", "thumbnail_url": "/images/LIFT-KIT-NH-POWERBANK.png"},
  {"name": "LIFT Academy Terra Tone Earbuds", "thumbnail_url": "/images/LIFT-KIT-NH-EARBUDS.png"}
]'::jsonb
WHERE customer_item_number = 'LIFT-KIT-NEWHIRE-4';

-- RA Kit 1 - Add kit-specific items
UPDATE ra_cadet_products
SET kit_items = kit_items || '[
  {"name": "Republic Airways Mercer+Mettle Pack", "thumbnail_url": "/images/RA-KIT-NH-BACKPACK.png"},
  {"name": "Republic Airways Neoskin RFID Passport Holder", "thumbnail_url": "/images/RA-KIT-NH-PASSPORT.png"}
]'::jsonb
WHERE customer_item_number = 'RA-KIT-NEWHIRE-1';

-- RA Kit 2 - Add kit-specific items
UPDATE ra_cadet_products
SET kit_items = kit_items || '[
  {"name": "Republic Airways Snap 2 Magnetic Wallet", "thumbnail_url": "/images/RA-KIT-NH-WALLET.png"},
  {"name": "Republic Airways Built2Work Bag", "thumbnail_url": "/images/RA-KIT-NH-BUILT2WORK.png"},
  {"name": "Republic Airways Perth Bottle", "thumbnail_url": "/images/RA-KIT-NH-PERTH.png"}
]'::jsonb
WHERE customer_item_number = 'RA-KIT-NEWHIRE-2';

-- RA Kit 3 - Add kit-specific items
UPDATE ra_cadet_products
SET kit_items = kit_items || '[
  {"name": "Republic Airways Carry-All Toiletry Bag", "thumbnail_url": "/images/RA-KIT-NH-TOILETRY.png"},
  {"name": "Republic Airways Manicure Set", "thumbnail_url": "/images/RA-KIT-NH-MANICURE.png"},
  {"name": "Republic Airways Collapsible Bottle", "thumbnail_url": "/images/RA-KIT-NH-COLLAPSE.png"},
  {"name": "Republic Airways Workflow Travel Caddy", "thumbnail_url": "/images/RA-KIT-NH-CADDY.png"}
]'::jsonb
WHERE customer_item_number = 'RA-KIT-NEWHIRE-3';

-- RA Kit 4 - Add kit-specific items
UPDATE ra_cadet_products
SET kit_items = kit_items || '[
  {"name": "Republic Airways The Slim Power Bank", "thumbnail_url": "/images/RA-KIT-NH-POWERBANK.png"},
  {"name": "Republic Airways Terra Tone Earbuds", "thumbnail_url": "/images/RA-KIT-NH-EARBUDS.png"}
]'::jsonb
WHERE customer_item_number = 'RA-KIT-NEWHIRE-4';

-- Verify the kit_items were updated correctly
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
-- Thumbnail images should be placed in /public/images/:
-- Common items:
--   - RA-KIT-NH-LANYARD.png (updated)
--   - LIFT-KIT-NH-LANYARD.png (updated)
--   - RA-KIT-BADGE.png
--   - RA-KIT-BEST.png
-- LIFT Kit 1:
--   - LIFT-KIT-NH-BACKPACK.png
--   - LIFT-KIT-NH-PASSPORT.png
-- LIFT Kit 2:
--   - LIFT-KIT-NH-WALLET.png
--   - LIFT-KIT-NH-BUILT2WORK.png
--   - LIFT-KIT-NH-PERTH.png
-- LIFT Kit 3:
--   - LIFT-KIT-NH-TOILETRY.png
--   - LIFT-KIT-NH-MANICURE.png
--   - LIFT-KIT-NH-COLLAPSE.png
--   - LIFT-KIT-NH-CADDY.png
-- LIFT Kit 4:
--   - LIFT-KIT-NH-POWERBANK.png
--   - LIFT-KIT-NH-EARBUDS.png
-- RA Kit 1:
--   - RA-KIT-NH-BACKPACK.png
--   - RA-KIT-NH-PASSPORT.png
-- RA Kit 2:
--   - RA-KIT-NH-WALLET.png
--   - RA-KIT-NH-BUILT2WORK.png
--   - RA-KIT-NH-PERTH.png
-- RA Kit 3:
--   - RA-KIT-NH-TOILETRY.png
--   - RA-KIT-NH-MANICURE.png
--   - RA-KIT-NH-COLLAPSE.png
--   - RA-KIT-NH-CADDY.png
-- RA Kit 4:
--   - RA-KIT-NH-POWERBANK.png
--   - RA-KIT-NH-EARBUDS.png


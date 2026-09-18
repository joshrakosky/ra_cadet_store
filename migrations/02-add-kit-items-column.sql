-- Add kit_items column to store products included in each kit
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE ra_cadet_products
ADD COLUMN IF NOT EXISTS kit_items JSONB;

-- Example structure for kit_items JSONB:
-- [
--   { "name": "Product Name 1", "thumbnail_url": "/images/product1.png" },
--   { "name": "Product Name 2", "thumbnail_url": "/images/product2.png" },
--   { "name": "Product Name 3", "thumbnail_url": "/images/product3.png" }
-- ]

-- Note: Update kit_items for each kit product with the products included in that kit
-- Example update:
-- UPDATE ra_cadet_products
-- SET kit_items = '[
--   {"name": "Product 1", "thumbnail_url": "/images/product1.png"},
--   {"name": "Product 2", "thumbnail_url": "/images/product2.png"}
-- ]'::jsonb
-- WHERE customer_item_number = 'RA-KIT-NEWHIRE-1';


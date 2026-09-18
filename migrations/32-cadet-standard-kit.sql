-- Cadet Standard kit: allow order line items without a product catalog row,
-- then seed the four Standard kit SKUs. MX kit products come later.
-- Run in Supabase SQL Editor after the base cadet schema.

ALTER TABLE ra_cadet_order_items
  ALTER COLUMN product_id DROP NOT NULL;

INSERT INTO ra_cadet_products (
  name, category, program, requires_size, available_sizes, customer_item_number, inventory
)
SELECT 'Cadet T-Shirt', 'tshirt', 'Standard', true, ARRAY['S','M','L','XL','2XL'], 'RA-KIT-CADET-TEE', 0
WHERE NOT EXISTS (
  SELECT 1 FROM ra_cadet_products WHERE customer_item_number = 'RA-KIT-CADET-TEE'
);

INSERT INTO ra_cadet_products (
  name, category, program, requires_size, customer_item_number, inventory
)
SELECT 'Nike Backpack', 'kit', 'Standard', false, 'RA-KIT-CADET-BACKPACK', 0
WHERE NOT EXISTS (
  SELECT 1 FROM ra_cadet_products WHERE customer_item_number = 'RA-KIT-CADET-BACKPACK'
);

INSERT INTO ra_cadet_products (
  name, category, program, requires_size, customer_item_number, inventory
)
SELECT 'Gel Pen', 'kit', 'Standard', false, 'RA-PR-PEN-GEL', 0
WHERE NOT EXISTS (
  SELECT 1 FROM ra_cadet_products WHERE customer_item_number = 'RA-PR-PEN-GEL'
);

INSERT INTO ra_cadet_products (
  name, category, program, requires_size, customer_item_number, inventory
)
SELECT 'Lanyard', 'kit', 'Standard', false, 'RA-PR-LANYARD-REC', 0
WHERE NOT EXISTS (
  SELECT 1 FROM ra_cadet_products WHERE customer_item_number = 'RA-PR-LANYARD-REC'
);

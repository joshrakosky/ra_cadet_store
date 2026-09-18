-- Migration 27: SKU alignment and inventory update
-- Applies official SKU mappings, inventory balances, and historical order_items backfill.
-- Run AFTER migration 26 (add-component-sku.sql).
-- Data source: Official inventory as of migration date.

-- =============================================================================
-- 1. T-SHIRT: Update product SKU and inventory
-- =============================================================================
-- Old: RA-NH-TEE (RA product used for both RA and LIFT programs per migration 07)
-- New: RANH-AP-DM130

UPDATE ra_cadet_products
SET
  customer_item_number = 'RANH-AP-DM130',
  inventory_by_size = '{"XS": 5, "S": 21, "M": 0, "L": -1, "XL": 22, "2XL": 17, "3XL": 14, "4XL": 8}'::jsonb,
  inventory = 86
WHERE category = 'tshirt' AND program = 'RA';

-- =============================================================================
-- 2. T-SHIRT: Historical backfill for order_items
-- =============================================================================
-- Update past t-shirt order rows from RA-NH-TEE-{size} to RANH-AP-DM130-{size}

UPDATE ra_cadet_order_items oi
SET customer_item_number = 'RANH-AP-DM130-' || oi.size
WHERE oi.product_id IN (SELECT id FROM ra_cadet_products WHERE category = 'tshirt' AND program = 'RA')
  AND oi.size IS NOT NULL
  AND (oi.customer_item_number LIKE 'RA-NH-TEE-%' OR oi.customer_item_number LIKE 'LIFT-NH-TEE-%');

-- =============================================================================
-- 3. COMPONENTS: Upsert SKU and inventory into ra_cadet_component_inventory
-- =============================================================================
-- component_name matches kit_items[].name from ra_cadet_products

INSERT INTO ra_cadet_component_inventory (component_name, inventory, sku, updated_at)
VALUES
  -- Shared (RA and LIFT kits)
  ('Republic Airways New Hire Lanyard', -60, 'RA-PR-LANYARD', NOW()),
  ('LIFT Academy New Hire Lanyard', 238, 'LIFT-PR-LANYARD', NOW()),
  ('Clear Badge Holder', 178, 'RA-PR-BH1110', NOW()),
  ('BEST Card', 678, 'RA-PR-2201PY', NOW()),
  -- RA Kit 1
  ('Republic Airways Mercer+Mettle Pack', -39, 'RA-AP-MMB200', NOW()),
  ('Republic Airways Neoskin RFID Passport Holder', -14, 'RA-PR-ST155', NOW()),
  -- RA Kit 2
  ('Republic Airways Snap 2 Magnetic Wallet', 46, 'RA-PR-6604', NOW()),
  ('Republic Airways Built2Work Bag', 46, 'RA-PR-1430-58', NOW()),
  ('Republic Airways Perth Bottle', 21, 'RA-PR-SM-6975', NOW()),
  -- RA Kit 3
  ('Republic Airways Carry-All Toiletry Bag', 22, 'RA-PR-WBA-CY23', NOW()),
  ('Republic Airways Manicure Set', 22, 'RA-PR-MS6', NOW()),
  ('Republic Airways Collapsible Bottle', 22, 'RA-PR-1628-53', NOW()),
  ('Republic Airways Workflow Travel Caddy', 22, 'RA-PR-97019', NOW()),
  -- RA Kit 4
  ('Republic Airways The Slim Power Bank', 61, 'RA-PR-98380', NOW()),
  ('Republic Airways Terra Tone Earbuds', 61, 'RA-PR-98320', NOW()),
  -- LIFT Kit 1
  ('LIFT Academy Mercer+Mettle Pack', 7, 'LIFT-AP-MMB200', NOW()),
  ('LIFT Academy Neoskin RFID Passport Holder', 120, 'LIFT-PR-ST155', NOW()),
  -- LIFT Kit 2
  ('LIFT Academy Snap2 Magnetic Wallet', 35, 'LIFT-PR-6604', NOW()),
  ('LIFT Academy Built2Work Bag', 35, 'LIFT-PR-1430-58', NOW()),
  ('LIFT Academy Perth Bottle', 70, 'LIFT-PR-SM-6975', NOW()),
  -- LIFT Kit 3
  ('LIFT Academy Carry-All Toiletry Bag', 48, 'LIFT-PR-WBA-CY23', NOW()),
  ('LIFT Academy Manicure Set', 23, 'LIFT-PR-MS6', NOW()),
  ('LIFT Academy Collapsible Bottle', 46, 'LIFT-PR-1628-53', NOW()),
  ('LIFT Academy Workflow Travel Caddy', 8, 'LIFT-PR-97019', NOW()),
  -- LIFT Kit 4
  ('LIFT Academy The Slim Power Bank', 10, 'LIFT-PR-98380', NOW()),
  ('LIFT Academy Terra Tone Earbuds', 10, 'LIFT-PR-98320', NOW())
ON CONFLICT (component_name) DO UPDATE SET
  inventory = EXCLUDED.inventory,
  sku = EXCLUDED.sku,
  updated_at = EXCLUDED.updated_at;

-- Note: Clear Badge Holder mapped to RA-PR-BH1110 (Sealable Vertical Card Holder) per official inventory.
-- BEST Card shared across RA/LIFT; single inventory 678.

-- =============================================================================
-- 4. COMPONENTS: Historical backfill for order_items
-- =============================================================================
-- Update past component rows (customer_item_number was NULL) with SKU from component_inventory

UPDATE ra_cadet_order_items oi
SET customer_item_number = c.sku
FROM ra_cadet_component_inventory c
WHERE oi.product_name = c.component_name
  AND oi.size IS NULL
  AND c.sku IS NOT NULL
  AND (oi.customer_item_number IS NULL OR oi.customer_item_number = '');

-- =============================================================================
-- Verify
-- =============================================================================
-- SELECT name, customer_item_number, inventory_by_size, inventory
-- FROM ra_cadet_products WHERE category = 'tshirt';

-- SELECT component_name, sku, inventory FROM ra_cadet_component_inventory ORDER BY component_name;

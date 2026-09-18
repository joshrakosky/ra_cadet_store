-- Migration 29: LANH-/RANH- official SKUs (catalog only — no order_items history updates)
-- Thumbnail paths and kit_items image names are unchanged.
-- Run in Supabase SQL Editor after migration 28.

-- =============================================================================
-- 1. T-shirt base SKU (size suffix still applied in app: RANH-AP-TEE-{SIZE})
-- =============================================================================

UPDATE ra_cadet_products
SET customer_item_number = 'RANH-AP-TEE'
WHERE category = 'tshirt' AND program = 'RA';

-- =============================================================================
-- 2. Component inventory SKUs (keyed by component_name = kit_items[].name)
-- =============================================================================

UPDATE ra_cadet_component_inventory SET sku = 'LANH-PR-EARBUDS'
  WHERE component_name = 'LIFT Academy Terra Tone Earbuds';
UPDATE ra_cadet_component_inventory SET sku = 'LANH-PR-POWER'
  WHERE component_name = 'LIFT Academy The Slim Power Bank';
UPDATE ra_cadet_component_inventory SET sku = 'LANH-AP-CADDY'
  WHERE component_name = 'LIFT Academy Workflow Travel Caddy';
UPDATE ra_cadet_component_inventory SET sku = 'LANH-PR-MANICURE'
  WHERE component_name = 'LIFT Academy Manicure Set';
UPDATE ra_cadet_component_inventory SET sku = 'LANH-PR-TOILETRY'
  WHERE component_name = 'LIFT Academy Carry-All Toiletry Bag';
UPDATE ra_cadet_component_inventory SET sku = 'LANH-PR-PERTH'
  WHERE component_name = 'LIFT Academy Perth Bottle';
UPDATE ra_cadet_component_inventory SET sku = 'LANH-AP-WORKBAG'
  WHERE component_name = 'LIFT Academy Built2Work Bag';
UPDATE ra_cadet_component_inventory SET sku = 'LANH-PR-WALLET'
  WHERE component_name = 'LIFT Academy Snap2 Magnetic Wallet';
UPDATE ra_cadet_component_inventory SET sku = 'LANH-PR-PASSPORT'
  WHERE component_name = 'LIFT Academy Neoskin RFID Passport Holder';
UPDATE ra_cadet_component_inventory SET sku = 'LANH-AP-MMB200'
  WHERE component_name = 'LIFT Academy Mercer+Mettle Pack';
UPDATE ra_cadet_component_inventory SET sku = 'LANH-PR-LANYARD'
  WHERE component_name = 'LIFT Academy New Hire Lanyard';
UPDATE ra_cadet_component_inventory SET sku = 'LANH-PR-COLLAPSE'
  WHERE component_name = 'LIFT Academy Collapsible Bottle';

UPDATE ra_cadet_component_inventory SET sku = 'RANH-PR-EARBUDS'
  WHERE component_name = 'Republic Airways Terra Tone Earbuds';
UPDATE ra_cadet_component_inventory SET sku = 'RANH-PR-POWER'
  WHERE component_name = 'Republic Airways The Slim Power Bank';
UPDATE ra_cadet_component_inventory SET sku = 'RANH-AP-CADDY'
  WHERE component_name = 'Republic Airways Workflow Travel Caddy';
UPDATE ra_cadet_component_inventory SET sku = 'RANH-PR-MANICURE'
  WHERE component_name = 'Republic Airways Manicure Set';
UPDATE ra_cadet_component_inventory SET sku = 'RANH-PR-TOILETRY'
  WHERE component_name = 'Republic Airways Carry-All Toiletry Bag';
UPDATE ra_cadet_component_inventory SET sku = 'RANH-PR-PERTH'
  WHERE component_name = 'Republic Airways Perth Bottle';
UPDATE ra_cadet_component_inventory SET sku = 'RANH-AP-WORKBAG'
  WHERE component_name = 'Republic Airways Built2Work Bag';
UPDATE ra_cadet_component_inventory SET sku = 'RANH-PR-WALLET'
  WHERE component_name = 'Republic Airways Snap 2 Magnetic Wallet';
UPDATE ra_cadet_component_inventory SET sku = 'RANH-PR-PASSPORT'
  WHERE component_name = 'Republic Airways Neoskin RFID Passport Holder';
UPDATE ra_cadet_component_inventory SET sku = 'RANH-AP-MMB200'
  WHERE component_name = 'Republic Airways Mercer+Mettle Pack';
UPDATE ra_cadet_component_inventory SET sku = 'RANH-PR-LANYARD'
  WHERE component_name = 'Republic Airways New Hire Lanyard';
UPDATE ra_cadet_component_inventory SET sku = 'RANH-PR-COLLAPSE'
  WHERE component_name = 'Republic Airways Collapsible Bottle';

UPDATE ra_cadet_component_inventory SET sku = 'RANH-BD-BEST'
  WHERE component_name = 'BEST Card';
UPDATE ra_cadet_component_inventory SET sku = 'RANH-BD-CLEAR'
  WHERE component_name = 'Clear Badge Holder';

-- =============================================================================
-- Verify (optional)
-- =============================================================================
-- SELECT component_name, sku FROM ra_cadet_component_inventory ORDER BY component_name;
-- SELECT name, customer_item_number FROM ra_cadet_products WHERE category = 'tshirt';

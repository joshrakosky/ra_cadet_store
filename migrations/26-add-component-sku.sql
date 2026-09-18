-- Add optional SKU column to component inventory for display/import alignment with official inventory system.
-- component_name remains the source of truth for matching kit_items; sku is additive.

ALTER TABLE ra_cadet_component_inventory
  ADD COLUMN IF NOT EXISTS sku TEXT;

COMMENT ON COLUMN ra_cadet_component_inventory.sku IS 'Optional SKU for display and import; component_name remains the key for kit matching.';

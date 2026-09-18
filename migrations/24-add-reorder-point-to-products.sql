-- Add reorder point to products for inventory alerts; used by admin Kit Inventory modal.
-- When inventory falls at or below this value, reorder can be triggered (future integration).

ALTER TABLE ra_cadet_products
  ADD COLUMN IF NOT EXISTS reorder_point INTEGER;

COMMENT ON COLUMN ra_cadet_products.reorder_point IS 'Reorder threshold; alert or reorder when inventory falls at or below this value.';

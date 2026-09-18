-- Component-level inventory for kit items (Clear Badge Holder, Collapsible Bottle, etc.).
-- Matches the product names used in kit_items and in the distribution summary export.
-- Inventory is managed here; order flow still uses kit-level inventory (can be integrated later).

CREATE TABLE IF NOT EXISTS ra_cadet_component_inventory (
  component_name TEXT PRIMARY KEY,
  inventory INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE ra_cadet_component_inventory IS 'Inventory per kit component name (from kit_items); aligns with distribution summary product names.';

-- Allow RLS and policies for admin access (same pattern as products)
ALTER TABLE ra_cadet_component_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ra_cadet_component_inventory are viewable by everyone"
  ON ra_cadet_component_inventory FOR SELECT
  USING (true);

CREATE POLICY "ra_cadet_component_inventory are insertable"
  ON ra_cadet_component_inventory FOR INSERT
  WITH CHECK (true);

CREATE POLICY "ra_cadet_component_inventory are updatable"
  ON ra_cadet_component_inventory FOR UPDATE
  USING (true);

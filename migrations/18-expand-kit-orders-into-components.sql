-- Expand existing kit orders into individual component line items
-- This migration breaks down kit order items into their individual components
-- for better picking workflow and reporting
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Insert component rows for each kit order item
-- For each kit order item, we'll create separate rows for each component in kit_items
INSERT INTO ra_cadet_order_items (
  order_id,
  product_id,
  product_name,
  customer_item_number,
  color,
  size,
  created_at
)
SELECT 
  oi.order_id,
  oi.product_id, -- Keep reference to the kit product
  kit_component->>'name' AS product_name, -- Component name from kit_items JSONB
  NULL AS customer_item_number, -- Components don't have SKUs
  NULL AS color, -- Components don't have colors
  NULL AS size, -- Components don't have sizes
  oi.created_at -- Preserve original order date
FROM ra_cadet_order_items oi
INNER JOIN ra_cadet_products p ON oi.product_id = p.id
CROSS JOIN LATERAL jsonb_array_elements(p.kit_items) AS kit_component
WHERE p.category = 'kit'
  AND p.kit_items IS NOT NULL
  AND jsonb_array_length(p.kit_items) > 0
  -- Only process kit items that haven't been expanded yet
  -- (check if component rows already exist for this order_item)
  AND NOT EXISTS (
    SELECT 1 
    FROM ra_cadet_order_items oi2
    WHERE oi2.order_id = oi.order_id
      AND oi2.product_id = oi.product_id
      AND oi2.product_name = kit_component->>'name'
      AND oi2.customer_item_number IS NULL
      AND oi2.color IS NULL
      AND oi2.size IS NULL
  );

-- Step 2: Delete the original kit rows (now that we have component rows)
-- This keeps the order_items table clean with only expanded components
-- Comment out this section if you want to keep the original kit rows for historical purposes
DELETE FROM ra_cadet_order_items oi
WHERE EXISTS (
  SELECT 1
  FROM ra_cadet_products p
  WHERE p.id = oi.product_id
    AND p.category = 'kit'
    AND p.kit_items IS NOT NULL
    AND jsonb_array_length(p.kit_items) > 0
)
-- Only delete if component rows exist for this kit order
AND EXISTS (
  SELECT 1
  FROM ra_cadet_order_items oi2
  INNER JOIN ra_cadet_products p2 ON oi2.product_id = p2.id
  WHERE oi2.order_id = oi.order_id
    AND oi2.product_id = oi.product_id
    AND p2.category = 'kit'
    AND p2.kit_items IS NOT NULL
    AND jsonb_array_length(p2.kit_items) > 0
    -- Check that at least one component row exists
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements(p2.kit_items) AS kit_comp
      WHERE EXISTS (
        SELECT 1
        FROM ra_cadet_order_items oi3
        WHERE oi3.order_id = oi2.order_id
          AND oi3.product_id = oi2.product_id
          AND oi3.product_name = kit_comp->>'name'
          AND oi3.customer_item_number IS NULL
          AND oi3.color IS NULL
          AND oi3.size IS NULL
      )
    )
);

-- Verification query: Check the results
-- This shows how many component rows were created per kit order
SELECT 
  o.order_number,
  oi.product_name AS kit_name,
  COUNT(DISTINCT oi2.id) AS component_count,
  STRING_AGG(DISTINCT oi2.product_name, ', ' ORDER BY oi2.product_name) AS components
FROM ra_cadet_orders o
INNER JOIN ra_cadet_order_items oi ON o.id = oi.order_id
INNER JOIN ra_cadet_products p ON oi.product_id = p.id
LEFT JOIN ra_cadet_order_items oi2 ON oi2.order_id = oi.order_id 
  AND oi2.product_id = oi.product_id
  AND oi2.customer_item_number IS NULL
  AND oi2.color IS NULL
  AND oi2.size IS NULL
WHERE p.category = 'kit'
GROUP BY o.order_number, oi.product_name, oi.id
ORDER BY o.order_number;

-- Note:
-- - Component rows keep the same product_id (pointing to the kit) for reference
-- - Component rows have NULL for customer_item_number, color, and size
-- - Original kit rows are deleted to keep the table clean
-- - If you need to keep original kit rows, comment out Step 2


-- RECOVERY: Restore deleted kit order items and properly expand them into components
-- Run this SQL in your Supabase SQL Editor

-- FIRST: Diagnostic query - see what we're working with
-- Check which orders are missing kit items
SELECT 
  o.order_number,
  o.program,
  o.created_at,
  COUNT(DISTINCT CASE WHEN p.category = 'tshirt' THEN oi.id END) AS has_tshirt,
  COUNT(DISTINCT CASE WHEN p.category = 'kit' THEN oi.id END) AS has_kit,
  COUNT(DISTINCT CASE WHEN p.category = 'kit' AND oi.customer_item_number IS NULL THEN oi.id END) AS has_components
FROM ra_cadet_orders o
LEFT JOIN ra_cadet_order_items oi ON o.id = oi.order_id
LEFT JOIN ra_cadet_products p ON oi.product_id = p.id
GROUP BY o.order_number, o.program, o.created_at
HAVING COUNT(DISTINCT CASE WHEN p.category = 'tshirt' THEN oi.id END) > 0
  AND COUNT(DISTINCT CASE WHEN p.category = 'kit' THEN oi.id END) = 0
ORDER BY o.created_at DESC;

-- Step 1: Restore kit order items based on actual orders
-- Using the order data provided, restore the correct kits for each order
INSERT INTO ra_cadet_order_items (
  order_id,
  product_id,
  product_name,
  customer_item_number,
  color,
  size,
  created_at
)
SELECT DISTINCT
  o.id AS order_id,
  p.id AS product_id,
  p.name AS product_name,
  p.customer_item_number,
  NULL AS color,
  NULL AS size,
  o.created_at
FROM ra_cadet_orders o
INNER JOIN ra_cadet_products p ON p.category = 'kit' 
  AND p.program = o.program
  AND (
    -- Map order numbers to their actual kits based on export data
    (o.order_number = 'RANH-007' AND p.customer_item_number = 'RA-KIT-NEWHIRE-1') OR
    (o.order_number = 'RANH-006' AND p.customer_item_number = 'RA-KIT-NEWHIRE-1') OR
    (o.order_number = 'RANH-005' AND p.customer_item_number = 'RA-KIT-NEWHIRE-3') OR
    (o.order_number = 'RANH-004' AND p.customer_item_number = 'RA-KIT-NEWHIRE-1') OR
    (o.order_number = 'RANH-003' AND p.customer_item_number = 'RA-KIT-NEWHIRE-1') OR
    (o.order_number = 'RANH-002' AND p.customer_item_number = 'RA-KIT-NEWHIRE-1') OR
    (o.order_number = 'RANH-001' AND p.customer_item_number = 'RA-KIT-NEWHIRE-1') OR
    -- Default to Kit 1 for any other RA orders not listed above
    (o.program = 'RA' AND p.customer_item_number = 'RA-KIT-NEWHIRE-1' AND NOT EXISTS (
      SELECT 1 FROM ra_cadet_orders o2 
      WHERE o2.order_number IN ('RANH-007', 'RANH-006', 'RANH-005', 'RANH-004', 'RANH-003', 'RANH-002', 'RANH-001')
      AND o2.id = o.id
    )) OR
    -- Default to Kit 1 for LIFT orders
    (o.program = 'LIFT' AND p.customer_item_number = 'LIFT-KIT-NEWHIRE-1')
  )
-- Only restore if order has a t-shirt but no kit items
WHERE EXISTS (
  SELECT 1
  FROM ra_cadet_order_items oi_tshirt
  INNER JOIN ra_cadet_products p_tshirt ON oi_tshirt.product_id = p_tshirt.id
  WHERE oi_tshirt.order_id = o.id
    AND p_tshirt.category = 'tshirt'
)
-- And order doesn't have any kit items (neither kit rows nor component rows)
AND NOT EXISTS (
  SELECT 1
  FROM ra_cadet_order_items oi_kit
  INNER JOIN ra_cadet_products p_kit ON oi_kit.product_id = p_kit.id
  WHERE oi_kit.order_id = o.id
    AND p_kit.category = 'kit'
);

-- Step 2: Clean up any duplicate component rows that might exist
-- Use a CTE to identify duplicates and keep only the first one (by created_at)
WITH duplicate_components AS (
  SELECT 
    oi.id,
    ROW_NUMBER() OVER (
      PARTITION BY oi.order_id, oi.product_id, oi.product_name 
      ORDER BY oi.created_at ASC, oi.id ASC
    ) AS rn
  FROM ra_cadet_order_items oi
  WHERE EXISTS (
    SELECT 1
    FROM ra_cadet_products p
    WHERE p.id = oi.product_id
      AND p.category = 'kit'
      AND p.kit_items IS NOT NULL
  )
  AND oi.customer_item_number IS NULL
  AND oi.color IS NULL
  AND oi.size IS NULL
  AND oi.product_name IN (
    SELECT kit_comp->>'name'
    FROM ra_cadet_products p2
    CROSS JOIN LATERAL jsonb_array_elements(p2.kit_items) AS kit_comp
    WHERE p2.category = 'kit'
      AND p2.kit_items IS NOT NULL
  )
)
DELETE FROM ra_cadet_order_items oi
WHERE oi.id IN (
  SELECT id FROM duplicate_components WHERE rn > 1
);

-- Step 3: Insert component rows for all kit orders (including restored ones)
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
  oi.product_id,
  kit_component->>'name' AS product_name,
  NULL AS customer_item_number,
  NULL AS color,
  NULL AS size,
  oi.created_at
FROM ra_cadet_order_items oi
INNER JOIN ra_cadet_products p ON oi.product_id = p.id
CROSS JOIN LATERAL jsonb_array_elements(p.kit_items) AS kit_component
WHERE p.category = 'kit'
  AND p.kit_items IS NOT NULL
  AND jsonb_array_length(p.kit_items) > 0
  -- Only insert if component doesn't already exist
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

-- Step 4: Delete the kit rows now that components exist (but keep them if components don't exist)
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
    -- Verify ALL component rows exist (count matches)
    AND (
      SELECT COUNT(*)
      FROM jsonb_array_elements(p2.kit_items) AS kit_comp
    ) = (
      SELECT COUNT(*)
      FROM ra_cadet_order_items oi3
      WHERE oi3.order_id = oi2.order_id
        AND oi3.product_id = oi2.product_id
        AND oi3.product_name = (SELECT kit_comp2->>'name' FROM jsonb_array_elements(p2.kit_items) AS kit_comp2 WHERE kit_comp2->>'name' = oi3.product_name LIMIT 1)
        AND oi3.customer_item_number IS NULL
        AND oi3.color IS NULL
        AND oi3.size IS NULL
    )
)
-- Make sure we're deleting a kit row (has customer_item_number), not a component row
AND oi.customer_item_number IS NOT NULL;

-- Final verification: Check results
SELECT 
  o.order_number,
  o.program,
  COUNT(DISTINCT oi.id) AS total_items,
  COUNT(DISTINCT CASE WHEN p.category = 'tshirt' THEN oi.id END) AS tshirt_count,
  COUNT(DISTINCT CASE WHEN p.category = 'kit' AND oi.customer_item_number IS NOT NULL THEN oi.id END) AS kit_rows,
  COUNT(DISTINCT CASE WHEN p.category = 'kit' AND oi.customer_item_number IS NULL THEN oi.id END) AS component_rows,
  STRING_AGG(DISTINCT oi.product_name, ', ' ORDER BY oi.product_name) FILTER (WHERE p.category = 'kit' AND oi.customer_item_number IS NULL) AS components
FROM ra_cadet_orders o
LEFT JOIN ra_cadet_order_items oi ON o.id = oi.order_id
LEFT JOIN ra_cadet_products p ON oi.product_id = p.id
GROUP BY o.order_number, o.program
ORDER BY o.order_number;

-- IMPORTANT NOTE:
-- This migration restores kits based on the actual order data provided:
-- - RANH-007: RA-KIT-NEWHIRE-1
-- - RANH-006: RA-KIT-NEWHIRE-1
-- - RANH-005: RA-KIT-NEWHIRE-3
-- - RANH-004: RA-KIT-NEWHIRE-1
-- - RANH-003: RA-KIT-NEWHIRE-1
-- - RANH-002: RA-KIT-NEWHIRE-1
-- - RANH-001: RA-KIT-NEWHIRE-1
-- Any other orders default to Kit 1 for their program.

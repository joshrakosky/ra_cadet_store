-- Add DELETE policies for orders and UPDATE policies for products
-- Run this SQL in your Supabase SQL Editor
-- This allows admin to cancel orders and update inventory

-- Allow DELETE on orders (for order cancellation)
CREATE POLICY "ra_cadet_orders are deletable"
  ON ra_cadet_orders FOR DELETE
  USING (true);

-- Allow UPDATE on products (for inventory restoration)
CREATE POLICY "ra_cadet_products are updatable"
  ON ra_cadet_products FOR UPDATE
  USING (true);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('ra_cadet_orders', 'ra_cadet_products')
ORDER BY tablename, policyname;


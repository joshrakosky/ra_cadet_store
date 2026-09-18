-- Update shipping address default to 2 Brickyard Ln
-- Run this SQL in your Supabase SQL Editor

-- Update the default value for new orders
ALTER TABLE ra_cadet_orders 
ALTER COLUMN shipping_address SET DEFAULT '2 Brickyard Ln';

-- Note: This only affects new orders. Existing orders will keep their current address.
-- If you want to update existing orders, uncomment the following:
-- UPDATE ra_cadet_orders 
-- SET shipping_address = '2 Brickyard Ln' 
-- WHERE shipping_address = '1 Brickyard Ln';

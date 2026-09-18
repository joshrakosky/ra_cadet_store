-- Add status column to orders table
-- Status values: 'Pending' (default), 'Backorder', 'Fulfillment', 'Delivered'

ALTER TABLE ra_cadet_orders 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending' 
CHECK (status IN ('Pending', 'Backorder', 'Fulfillment', 'Delivered'));

-- Create index for status column for better query performance
CREATE INDEX IF NOT EXISTS idx_ra_cadet_orders_status ON ra_cadet_orders(status);

-- Update existing orders to have 'Pending' status if they don't have one
UPDATE ra_cadet_orders 
SET status = 'Pending' 
WHERE status IS NULL;

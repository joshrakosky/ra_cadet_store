-- Add class date and class type to orders for new hire training class tracking.
-- class_type: Corporate | Pilot | Maintenance | Flight Attendant

ALTER TABLE ra_cadet_orders
  ADD COLUMN IF NOT EXISTS class_date DATE,
  ADD COLUMN IF NOT EXISTS class_type TEXT;

COMMENT ON COLUMN ra_cadet_orders.class_date IS 'User-selected class/training date';
COMMENT ON COLUMN ra_cadet_orders.class_type IS 'Corporate | Pilot | Maintenance | Flight Attendant';

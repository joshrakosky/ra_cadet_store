-- Add Kit Products for Republic Airways New Hires
-- Run this SQL in your Supabase SQL Editor
-- 4 kits per program (RA and LIFT)

-- Republic Airways Kits
INSERT INTO ra_cadet_products (
  name,
  category,
  program,
  requires_size,
  requires_color,
  customer_item_number,
  thumbnail_url,
  inventory,
  description
) VALUES
-- RA Kit 1
('Republic Airways New Hire Kit 1', 'kit', 'RA', false, false, 'RA-KIT-NEWHIRE-1', '/images/RA-KIT-NEWHIRE-1.png', 50, 'Republic Airways New Hire Kit 1'),
-- RA Kit 2
('Republic Airways New Hire Kit 2', 'kit', 'RA', false, false, 'RA-KIT-NEWHIRE-2', '/images/RA-KIT-NEWHIRE-2.png', 50, 'Republic Airways New Hire Kit 2'),
-- RA Kit 3
('Republic Airways New Hire Kit 3', 'kit', 'RA', false, false, 'RA-KIT-NEWHIRE-3', '/images/RA-KIT-NEWHIRE-3.png', 50, 'Republic Airways New Hire Kit 3'),
-- RA Kit 4
('Republic Airways New Hire Kit 4', 'kit', 'RA', false, false, 'RA-KIT-NEWHIRE-4', '/images/RA-KIT-NEWHIRE-4.png', 50, 'Republic Airways New Hire Kit 4'),

-- LIFT Academy Kits
-- LIFT Kit 1
('LIFT Academy New Hire Kit 1', 'kit', 'LIFT', false, false, 'LIFT-KIT-NEWHIRE-1', '/images/LIFT-KIT-NEWHIRE-1.png', 50, 'LIFT Academy New Hire Kit 1'),
-- LIFT Kit 2
('LIFT Academy New Hire Kit 2', 'kit', 'LIFT', false, false, 'LIFT-KIT-NEWHIRE-2', '/images/LIFT-KIT-NEWHIRE-2.png', 50, 'LIFT Academy New Hire Kit 2'),
-- LIFT Kit 3
('LIFT Academy New Hire Kit 3', 'kit', 'LIFT', false, false, 'LIFT-KIT-NEWHIRE-3', '/images/LIFT-KIT-NEWHIRE-3.png', 50, 'LIFT Academy New Hire Kit 3'),
-- LIFT Kit 4
('LIFT Academy New Hire Kit 4', 'kit', 'LIFT', false, false, 'LIFT-KIT-NEWHIRE-4', '/images/LIFT-KIT-NEWHIRE-4.png', 50, 'LIFT Academy New Hire Kit 4');

-- Verify the kits were added
SELECT 
  id,
  name,
  category,
  program,
  customer_item_number,
  thumbnail_url,
  inventory,
  created_at
FROM ra_cadet_products
WHERE category = 'kit'
ORDER BY program, customer_item_number;

-- Note:
-- - Update inventory values as needed
-- - Thumbnail images should be placed in /public/images/:
--   - RA-KIT-NEWHIRE-1.png through RA-KIT-NEWHIRE-4.png
--   - LIFT-KIT-NEWHIRE-1.png through LIFT-KIT-NEWHIRE-4.png
-- - Individual kit products (4-5 per kit) will be added later with inventory tracking


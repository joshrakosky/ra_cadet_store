# Republic Airways New Hires - Setup Guide

## Overview
This application has been updated for Republic Airways New Hires program. Users enter a 6-letter code to access the store, select their program (RA or LIFT), choose a t-shirt size, select a kit, and complete their order.

## Database Setup

### 1. Run the SQL Migrations
All database migrations are organized in the `migrations/` folder. See `migrations/README.md` for the complete migration order and details.

**Quick Start:**
1. Run `migrations/01-schema.sql` to create the database structure:
   - `ra_cadet_products` - Product catalog with inventory tracking
   - `ra_cadet_orders` - Order information (one order per code)
   - `ra_cadet_order_items` - Individual items in each order

2. Run the remaining migrations in order as documented in `migrations/README.md`

### 2. Product Structure

Products should be added with the following structure:

**T-Shirt Products:**
- `category`: 'tshirt'
- `program`: 'RA' or 'LIFT'
- `requires_size`: true
- `available_sizes`: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']
- `inventory_by_size`: JSONB object like `{"XS": 10, "S": 20, "M": 30, "L": 25, "XL": 20, "2XL": 15, "3XL": 10, "4XL": 5}`
- `inventory`: Total inventory count

**Kit Products:**
- `category`: 'kit'
- `program`: 'RA' or 'LIFT'
- `inventory`: Overall kit inventory count
- Each program should have 4 kits (displayed in 2x2 grid)

## Order Flow

1. **Landing Page** (`/`): User enters 6-letter code (ADMIN code for admin access)
2. **Program Selection** (`/program`): User selects RA or LIFT program
3. **T-Shirt Size** (`/tshirt-size`): User selects t-shirt size (inventory tracked by size)
4. **Kit Selection** (`/kit-selection`): User selects one of 4 kits for their program
5. **Shipping** (`/shipping`): User enters first name, last name, email (address defaults to Republic Airways Training Center)
6. **Review** (`/review`): User reviews order before submission
7. **Confirmation** (`/confirmation`): Order confirmation with order number

## Branding

- **Background Color**: Navy `#00263a`
- **Button Color**: Red `#c8102e` (with white text)
- **Logo Files Needed**: 
  - `/public/images/RA-Logo.png` (or .jpg, .svg, .webp)
  - `/public/images/LIFT-Logo.png` (or .jpg, .svg, .webp)

## Admin Access

- **Admin Code**: `ADMIN` (6 capital letters)
- **Admin Page**: `/admin` (accessed via ADMIN code on landing page)
- **Export Orders**: Button appears in top-right when admin is logged in

## Order Number Format

Orders are numbered as: `RACD-001`, `RACD-002`, etc.

## Default Shipping Address

All orders ship to:
- **Name**: Republic Airways Training Center
- **Attention**: HR Shared Services
- **Address**: 2 Brickyard Ln
- **City**: CARMEL
- **State**: IN
- **ZIP**: 46032
- **Country**: USA

This address is pre-filled and not editable by users.

## Inventory Management

- Inventory is automatically decremented when orders are placed
- T-shirt inventory is tracked by size (XS-4XL)
- Kit inventory is tracked overall
- Out-of-stock items are disabled in the UI

## Next Steps

1. **Add Logo Files**: Place RA-Logo and LIFT-Logo images in `/public/images/`
2. **Add Products**: Add t-shirt and kit products to the database via Supabase dashboard or SQL
3. **Test Flow**: Test the complete order flow with a test code
4. **Generate Codes**: Create 6-letter codes for new hires (one code per person)

## Example Product SQL

```sql
-- Example T-Shirt Product for RA
INSERT INTO ra_cadet_products (
  name, 
  category, 
  program, 
  requires_size, 
  available_sizes, 
  inventory_by_size,
  inventory,
  thumbnail_url
) VALUES (
  'Republic Airways T-Shirt',
  'tshirt',
  'RA',
  true,
  ARRAY['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'],
  '{"XS": 10, "S": 20, "M": 30, "L": 25, "XL": 20, "2XL": 15, "3XL": 10, "4XL": 5}'::jsonb,
  135,
  '/images/ra-tshirt.jpg'
);

-- Example Kit Product for RA
INSERT INTO ra_cadet_products (
  name,
  description,
  category,
  program,
  inventory,
  thumbnail_url
) VALUES (
  'RA Starter Kit',
  'Includes backpack, water bottle, and more',
  'kit',
  'RA',
  50,
  '/images/ra-kit-1.jpg'
);
```

## Notes

- One order per code (enforced at database level)
- Code format: Exactly 6 capital letters
- ADMIN code provides access to admin dashboard
- All shipping goes to the same address (not editable)
- Inventory is automatically managed when orders are placed


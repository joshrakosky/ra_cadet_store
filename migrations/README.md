# Database Migrations

This folder contains all SQL migration files for the Republic Airways New Hires store database.

## Migration Order

Run these migrations in order:

1. **01-schema.sql** - Initial database schema setup
   - Creates all tables (`ra_cadet_products`, `ra_cadet_orders`, `ra_cadet_order_items`)
   - Sets up indexes and Row Level Security (RLS) policies
   - **Run this first** to set up the database structure

2. **02-add-kit-items-column.sql** - Adds `kit_items` JSONB column
   - Adds the `kit_items` column to `ra_cadet_products` table
   - Required before adding kit products with items

3. **03-add-kit-products.sql** - Adds kit products
   - Creates 4 Republic Airways kits (RA-KIT-NEWHIRE-1 through 4)
   - Creates 4 LIFT Academy kits (LIFT-KIT-NEWHIRE-1 through 4)
   - Sets default inventory to 50 (update with migration 08)

4. **04-add-tshirt-products.sql** - Adds t-shirt products (with duplicate prevention)
   - Creates RA and LIFT t-shirt products
   - Includes `WHERE NOT EXISTS` checks to prevent duplicates
   - Use this for production

5. **05-add-tshirt-products-simple.sql** - Simple t-shirt products (no duplicate checks)
   - Simpler version without duplicate prevention
   - Use this if migration 04 fails or for initial setup

6. **06-update-tshirt-inventory.sql** - Updates t-shirt inventory
   - Updates `inventory_by_size` for RA and LIFT t-shirts
   - Sets specific inventory values per size

7. **07-consolidate-tshirt-to-ra.sql** - Consolidates LIFT t-shirt to RA
   - Removes LIFT t-shirt product
   - Moves LIFT inventory to RA t-shirt
   - Updates frontend to use RA t-shirt for both programs

8. **08-update-kit-inventory.sql** - Updates kit inventory
   - Sets all kit inventory to 25

9. **09-update-kit-items.sql** - Updates kit items with common items
   - Sets common items for all RA kits (lanyard, badge holder, BEST card)
   - Sets common items for all LIFT kits (lanyard, badge holder, BEST card)
   - Uses corrected lanyard SKUs (RA-KIT-NH-LANYARD, LIFT-KIT-NH-LANYARD)

10. **10-update-kit-items-with-specifics.sql** - Adds kit-specific items
    - Updates lanyard SKUs/thumbnail names
    - Adds kit-specific items to each LIFT kit (1-4)
    - Appends to existing common items

## Utility Files

- **verify-tshirt-products.sql** - Verification script
  - Use this to check if t-shirt products were added correctly
  - Not a migration, just for verification

## Quick Start

For a fresh database setup, run migrations in this order:

```sql
-- 1. Set up schema
\i migrations/01-schema.sql

-- 2. Add kit_items column
\i migrations/02-add-kit-items-column.sql

-- 3. Add products
\i migrations/03-add-kit-products.sql
\i migrations/04-add-tshirt-products.sql

-- 4. Update inventory
\i migrations/06-update-tshirt-inventory.sql
\i migrations/08-update-kit-inventory.sql

-- 5. Set up kit items
\i migrations/09-update-kit-items.sql
\i migrations/10-update-kit-items-with-specifics.sql
```

## Notes

- All migrations are idempotent where possible (use `IF NOT EXISTS`, `WHERE NOT EXISTS`, etc.)
- Some migrations may need to be run conditionally based on your setup
- Always verify migrations in a test environment first
- The `verify-tshirt-products.sql` file is for troubleshooting, not a required migration


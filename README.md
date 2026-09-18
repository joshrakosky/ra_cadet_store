# Republic Airways Cadet Store

Cloned from RA new hires as a starting point. Tables use `ra_cadet_*`; order numbers are `RACD-001`. Catalog/SKUs and flow cuts come next.

A streamlined ecommerce site for Republic Airways and LIFT Academy new hires to select their first day gear. Users enter a 6-letter code to access the store, select their program, choose a t-shirt size, select a kit, and complete their order.

## Features

- **Code-Based Access**: 6-letter code entry (one order per code)
- **Program Selection**: Choose between Republic Airways (RA) or LIFT Academy
- **T-Shirt Size Selection**: Size selection with inventory tracking (XS-4XL)
- **Kit Selection**: Choose from 4 kits per program (2x2 grid display)
- **Inventory Management**: Automatic inventory tracking and decrementing
- **Admin Dashboard**: View and export orders to Excel

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL migrations from the `migrations/` folder in order (see `migrations/README.md` for details)
   - Start with `migrations/01-schema.sql` to set up the database structure
   - Then run the remaining migrations as needed
3. Add your Supabase credentials to `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Add Logo Files

Place logo images in `/public/images/`:
- `RA-Logo.png` (or .jpg, .svg, .webp)
- `LIFT-Logo.png` (or .jpg, .svg, .webp)

### 4. Add Products

Add t-shirt and kit products to the `ra_cadet_products` table via Supabase dashboard or SQL. See `RA_NEW_HIRES_SETUP.md` for detailed product schema and examples.

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Site Access

**Admin Code**: `ADMIN` (6 capital letters)

Users enter their 6-letter code on the landing page to access the store. The ADMIN code provides access to the admin dashboard.

## Order Flow

1. **Landing Page** (`/`): User enters 6-letter code
2. **Program Selection** (`/program`): User selects RA or LIFT program
3. **T-Shirt Size** (`/tshirt-size`): User selects t-shirt size
4. **Kit Selection** (`/kit-selection`): User selects one of 4 kits
5. **Shipping** (`/shipping`): User enters first name, last name, email
6. **Review** (`/review`): User reviews order before submission
7. **Confirmation** (`/confirmation`): Order confirmation with order number

## Order Number Format

Orders are numbered as: `RACD-001`, `RACD-002`, etc.

## Admin Access

Enter code `ADMIN` on the landing page to access `/admin`:
- View all orders
- Export orders to Excel (two sheets: Detailed Orders and Distribution Summary)

## Database Schema

- **ra_cadet_products**: Product catalog with inventory tracking
- **ra_cadet_orders**: Order information (one order per code)
- **ra_cadet_order_items**: Individual items in each order

See `supabase-schema-ra-new-hires.sql` for the complete schema.

## Documentation

- `RA_NEW_HIRES_SETUP.md` - Detailed setup guide with examples
- `docs/PARTNER_PGP_SOP.md` - Partner file feeds encrypted with OpenPGP (public key handoff, decrypt, import)
- `docs/REPUBLIC_X509_ONBOARDING.md` - Republic portal X509 certificate from Proforma (not PGP)

## Default Shipping Address

All orders ship to:
- Republic Airways Training Center
- Attn: HR Shared Services
- 2 Brickyard Ln, CARMEL, IN 46032

This address is pre-filled and not editable by users.

## Deployment

Deploy to Vercel:

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy


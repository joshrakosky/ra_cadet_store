# Required Thumbnail Images

All images should be placed in `/public/images/` directory.

## Image Format Support

The application supports multiple image formats with automatic fallback:
- `.png` (preferred)
- `.jpg` / `.jpeg`
- `.webp`
- `.svg` (for logos)

If a `.png` file is not found, the app will automatically try other formats.

---

## 1. Logo Files

### Program Logos
- `RA-Logo.png` - Republic Airways logo (used on landing page and program selection)
- `LIFT-Logo.png` - LIFT Academy logo (used on program selection)

---

## 2. T-Shirt Thumbnails

### T-Shirt Product Image
- `RA-NH-TEE.png` - Republic Airways New Hire T-Shirt thumbnail
  - Used for both RA and LIFT program t-shirt selection
  - Displayed on the t-shirt size selection page
  - Recommended size: 1000x1000 pixels

---

## 3. Common Kit Items

These items are included in all kits (both RA and LIFT):

- `RA-KIT-NH-LANYARD.png` - Republic Airways New Hire Lanyard
- `LIFT-KIT-NH-LANYARD.png` - LIFT Academy New Hire Lanyard
- `RA-KIT-BADGE.png` - Clear Badge Holder (shared by both programs)
- `RA-KIT-BEST.png` - BEST Card (shared by both programs)

---

## 4. Republic Airways Kit-Specific Items

### RA Kit 1
- `RA-KIT-NH-BACKPACK.png` - Republic Airways Mercer+Mettle Pack
- `RA-KIT-NH-PASSPORT.png` - Republic Airways Neoskin RFID Passport Holder

### RA Kit 2
- `RA-KIT-NH-WALLET.png` - Republic Airways Snap 2 Magnetic Wallet
- `RA-KIT-NH-BUILT2WORK.png` - Republic Airways Built2Work Bag
- `RA-KIT-NH-PERTH.png` - Republic Airways Perth Bottle

### RA Kit 3
- `RA-KIT-NH-TOILETRY.png` - Republic Airways Carry-All Toiletry Bag
- `RA-KIT-NH-MANICURE.png` - Republic Airways Manicure Set
- `RA-KIT-NH-COLLAPSE.png` - Republic Airways Collapsible Bottle
- `RA-KIT-NH-CADDY.png` - Republic Airways Workflow Travel Caddy

### RA Kit 4
- `RA-KIT-NH-POWERBANK.png` - Republic Airways The Slim Power Bank
- `RA-KIT-NH-EARBUDS.png` - Republic Airways Terra Tone Earbuds

---

## 5. LIFT Academy Kit-Specific Items

### LIFT Kit 1
- `LIFT-KIT-NH-BACKPACK.png` - LIFT Academy Mercer+Mettle Pack
- `LIFT-KIT-NH-PASSPORT.png` - LIFT Academy Neoskin RFID Passport Holder

### LIFT Kit 2
- `LIFT-KIT-NH-WALLET.png` - LIFT Academy Snap2 Magnetic Wallet
- `LIFT-KIT-NH-BUILT2WORK.png` - LIFT Academy Built2Work Bag
- `LIFT-KIT-NH-PERTH.png` - LIFT Academy Perth Bottle

### LIFT Kit 3
- `LIFT-KIT-NH-TOILETRY.png` - LIFT Academy Carry-All Toiletry Bag
- `LIFT-KIT-NH-MANICURE.png` - LIFT Academy Manicure Set
- `LIFT-KIT-NH-COLLAPSE.png` - LIFT Academy Collapsible Bottle
- `LIFT-KIT-NH-CADDY.png` - LIFT Academy Workflow Travel Caddy

### LIFT Kit 4
- `LIFT-KIT-NH-POWERBANK.png` - LIFT Academy The Slim Power Bank
- `LIFT-KIT-NH-EARBUDS.png` - LIFT Academy Terra Tone Earbuds

---

## Summary

### Total Image Count
- **Logos**: 2 files
- **T-Shirts**: 1 file
- **Common Kit Items**: 4 files
- **RA Kit-Specific Items**: 11 files
- **LIFT Kit-Specific Items**: 11 files

**Grand Total: 29 image files**

---

## Image Specifications

### Recommended Dimensions
- **Logos**: 200-400px width (maintain aspect ratio)
- **T-Shirt Thumbnail**: 1000x1000px (square)
- **Kit Item Thumbnails**: 500x500px to 800x800px (square recommended)

### File Size Recommendations
- Keep individual images under 500KB for optimal loading
- Use PNG for images with transparency
- Use JPG for photographs without transparency
- Optimize images before uploading

---

## Notes

- All images are referenced in the database via `thumbnail_url` field
- The application will automatically try alternative formats if the primary format fails
- Kit item thumbnails are displayed in a modal popup when clicked
- Ensure all images are properly optimized for web use


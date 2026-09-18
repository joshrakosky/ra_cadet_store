// Cadet kit catalog for the user flow.
// Standard kit is defined here until MX contents and full product rows land.

export type CadetProgram = 'Standard' | 'Maintenance'

export const CADET_PROGRAMS: CadetProgram[] = ['Standard', 'Maintenance']

export const CADET_TSHIRT_SIZES = ['S', 'M', 'L', 'XL', '2XL'] as const
export type CadetTshirtSize = (typeof CADET_TSHIRT_SIZES)[number]

export type CadetKitItem = {
  name: string
  /** Fixed SKU, or base SKU for the t-shirt (size suffix added at order time). */
  sku: string
  sized?: boolean
  /** Preferred cadet thumbnail path. */
  thumbnail: string
  /** Temporary stand-in until cadet art is added. */
  thumbnailFallback?: string
}

export const STANDARD_KIT_ITEMS: CadetKitItem[] = [
  {
    name: 'Cadet T-Shirt',
    sku: 'RA-KIT-CADET-TEE',
    sized: true,
    thumbnail: '/images/RA-KIT-CADET-TEE.png',
    thumbnailFallback: '/images/RA-NH-TEE.jpg',
  },
  {
    name: 'Nike Backpack',
    sku: 'RA-KIT-CADET-BACKPACK',
    thumbnail: '/images/RA-KIT-CADET-BACKPACK.png',
    thumbnailFallback: '/images/RA-KIT-NH-BACKPACK.png',
  },
  {
    name: 'Gel Pen',
    sku: 'RA-PR-PEN-GEL',
    thumbnail: '/images/RA-PR-PEN-GEL.png',
  },
  {
    name: 'Lanyard',
    sku: 'RA-PR-LANYARD-REC',
    thumbnail: '/images/RA-PR-LANYARD-REC.png',
    thumbnailFallback: '/images/RA-KIT-NH-LANYARD.png',
  },
]

export function isCadetProgram(value: string | null): value is CadetProgram {
  return value === 'Standard' || value === 'Maintenance'
}

export function isCadetTshirtSize(value: string | null): value is CadetTshirtSize {
  return CADET_TSHIRT_SIZES.includes(value as CadetTshirtSize)
}

/** T-shirt SKU with size: RA-KIT-CADET-TEE-S through RA-KIT-CADET-TEE-2XL */
export function cadetTshirtSku(size: CadetTshirtSize): string {
  return `RA-KIT-CADET-TEE-${size}`
}

export function skuForKitItem(item: CadetKitItem, size: CadetTshirtSize): string {
  return item.sized ? cadetTshirtSku(size) : item.sku
}

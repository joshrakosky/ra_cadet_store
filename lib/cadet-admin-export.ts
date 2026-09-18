// Admin Excel: one workbook, two sheets — order details + product counts.
// Each Standard cadet order is 1 t-shirt (sized) + 1 backpack + 1 pen + 1 lanyard.

import type { OrderWithItems } from '@/types'
import {
  STANDARD_KIT_ITEMS,
  isCadetTshirtSize,
  skuForKitItem,
  type CadetTshirtSize,
} from '@/lib/cadet-kits'

export function buildCadetOrderDetailRows(orders: OrderWithItems[]) {
  return orders.map((order) => ({
    'Order Number': order.order_number,
    'Order Date': new Date(order.created_at).toLocaleDateString(),
    'Status': order.status || 'Pending',
    'Program': order.program || '',
    'First Name': order.first_name || '',
    'Last Name': order.last_name || '',
    'Email': order.email || '',
    'Code': order.code || '',
    'T-Shirt Size': order.tshirt_size || '',
    'Shipping Address': order.shipping_address || '',
    'Address 2': order.shipping_address2 || '',
    'City': order.shipping_city || '',
    'State': order.shipping_state || '',
    'ZIP': order.shipping_zip || '',
  }))
}

export function buildCadetProductCountRows(orders: OrderWithItems[]) {
  const counts = new Map<string, { name: string; sku: string; quantity: number }>()

  const bump = (name: string, sku: string) => {
    const existing = counts.get(sku)
    if (existing) {
      existing.quantity += 1
      return
    }
    counts.set(sku, { name, sku, quantity: 1 })
  }

  for (const order of orders) {
    const size = order.tshirt_size
    for (const item of STANDARD_KIT_ITEMS) {
      const sku = isCadetTshirtSize(size ?? null) ? skuForKitItem(item, size as CadetTshirtSize) : item.sku
      const name = item.sized && size ? `${item.name} - ${size}` : item.name
      bump(name, sku)
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => a.name.localeCompare(b.name) || a.sku.localeCompare(b.sku))
    .map((row) => ({
      'Product Name': row.name,
      'Customer Item #': row.sku,
      'Quantity': row.quantity,
    }))
}

export function cadetExportFilename(date = new Date()): string {
  return `ra-cadet-orders-${date.toISOString().split('T')[0]}.xlsx`
}

export type { CadetTshirtSize }

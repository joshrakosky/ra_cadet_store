/**
 * Canonical SKU resolution for admin Excel exports.
 * Merges historical order line SKUs with current catalog SKUs so usage totals stay unified
 * without mutating ra_cadet_order_items.
 */

import type { OrderItem, OrderWithItems } from '@/types'

/** Minimal product row for reporting (from ra_cadet_products). */
export type ReportingProduct = {
  id: string
  category: string
  customer_item_number?: string | null
}

/** Build map component_name -> current sku from ra_cadet_component_inventory. */
export function buildComponentSkuByName(
  rows: { component_name: string; sku: string | null }[]
): Map<string, string> {
  const m = new Map<string, string>()
  for (const row of rows) {
    if (row.sku) m.set(row.component_name, row.sku)
  }
  return m
}

/**
 * Resolve display SKU for one line: tees use current base + size; kit components use inventory sku by product_name.
 */
const KEY_SEP = '\x1f'

export function canonicalSkuForLineItem(
  item: OrderItem,
  product: ReportingProduct | undefined,
  componentSkuByName: Map<string, string>,
  tshirtBaseSku: string | null
): string {
  if (product?.category === 'tshirt') {
    const size = item.size || ''
    if (tshirtBaseSku) return size ? `${tshirtBaseSku}-${size}` : tshirtBaseSku
    return item.customer_item_number || ''
  }
  if (product?.category === 'kit') {
    const fromInventory = componentSkuByName.get(item.product_name)
    if (fromInventory) return fromInventory
    return item.customer_item_number || ''
  }
  return item.customer_item_number || ''
}

/** One row per kit type (kit product customer_item_number), same logic as kit order export. */
export function buildKitCountRows(
  orders: OrderWithItems[],
  productById: Map<string, ReportingProduct>
): { 'Kit Type': string; 'Count': number }[] {
  const kitCountMap = new Map<string, number>()
  for (const order of orders) {
    let kitType = ''
    for (const item of order.items) {
      const product = item.product_id ? productById.get(item.product_id) : undefined
      if (product?.category === 'kit') {
        kitType = product.customer_item_number ?? ''
        break
      }
    }
    const k = kitType || 'N/A'
    kitCountMap.set(k, (kitCountMap.get(k) ?? 0) + 1)
  }
  return Array.from(kitCountMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([kitType, count]) => ({ 'Kit Type': kitType, 'Count': count }))
}

/**
 * Aggregate product + tee lines with canonical SKUs (combines old and new stored line SKUs).
 */
export function buildProductCountRows(
  orders: OrderWithItems[],
  productById: Map<string, ReportingProduct>,
  componentSkuByName: Map<string, string>,
  tshirtBaseSku: string | null
): { 'Product Name': string; 'Customer Item #': string; 'Quantity': number }[] {
  const summaryMap = new Map<string, number>()
  for (const order of orders) {
    for (const item of order.items) {
      const product = item.product_id ? productById.get(item.product_id) : undefined
      const sku = canonicalSkuForLineItem(item, product, componentSkuByName, tshirtBaseSku)
      const key = [item.product_name, sku, item.color || 'N/A', item.size || 'N/A'].join(KEY_SEP)
      summaryMap.set(key, (summaryMap.get(key) ?? 0) + 1)
    }
  }
  const rows = Array.from(summaryMap.entries()).map(([key, quantity]) => {
    const [productName, customerItem, _color, _size] = key.split(KEY_SEP)
    return {
      'Product Name': productName,
      'Customer Item #': customerItem,
      'Quantity': quantity
    }
  })
  return rows.sort((a, b) => {
    if (a['Product Name'] !== b['Product Name']) {
      return a['Product Name'].localeCompare(b['Product Name'])
    }
    return a['Customer Item #'].localeCompare(b['Customer Item #'])
  })
}

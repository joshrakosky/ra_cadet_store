/**
 * Foremost Graphics fulfillment XML builder.
 * Fetches orders from Supabase, expands kit items into components,
 * and generates XML in a configurable format for fulfillment partners.
 */

import { supabase } from '@/lib/supabase'
import { fetchAllRows } from '@/lib/fetch-all-rows'
import { fulfillmentSchema } from './fulfillment-schema'

// Minimal types for DB records used in XML generation
interface DbOrder {
  id: string
  order_number: string
  first_name: string
  last_name: string
  email: string
  program: string
  status: string
  class_date?: string | null
  class_type?: string | null
  shipping_name: string
  shipping_attention?: string | null
  shipping_address: string
  shipping_address2?: string | null
  shipping_city: string
  shipping_state: string
  shipping_zip: string
  shipping_country: string
  created_at: string
}

interface DbOrderItem {
  id: string
  order_id: string
  product_id: string
  product_name: string
  customer_item_number?: string | null
  color?: string | null
  size?: string | null
}

interface DbProduct {
  id: string
  category: string
  kit_items?: Array<{ name: string; thumbnail_url?: string }> | null
}

interface OrderWithItems extends DbOrder {
  items: DbOrderItem[]
}

interface ExpandedLineItem {
  productName: string
  sku: string
  color: string
  size: string
}

/** Options for filtering which orders to include in the XML export */
export interface FulfillmentXmlOptions {
  /** Comma-separated status filter, e.g. 'Pending,Fulfillment'. If omitted, all orders. */
  statusFilter?: string
  /** Only orders created on or after this date (ISO string) */
  since?: string
  /** Custom schema overrides (default: fulfillmentSchema) */
  schema?: typeof fulfillmentSchema
}

/** Escapes XML special characters for safe inclusion in element text */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Wraps text in an XML element, escaping content */
function element(name: string, content: string | undefined | null): string {
  const safe = content != null && content !== '' ? escapeXml(String(content)) : ''
  return `<${name}>${safe}</${name}>`
}

/** Builds expanded line items for an order (kits → components, t-shirts as-is) */
function expandOrderItems(
  order: OrderWithItems,
  productInfoMap: Map<string, DbProduct>
): ExpandedLineItem[] {
  const result: ExpandedLineItem[] = []

  for (const item of order.items) {
    const productInfo = item.product_id ? productInfoMap.get(item.product_id) : null
    const isKit = productInfo?.category === 'kit'
    const isAlreadyComponent =
      isKit &&
      productInfo?.kit_items &&
      productInfo.kit_items.some((k) => k.name === item.product_name) &&
      !item.customer_item_number &&
      !item.color &&
      !item.size

    if (isKit && productInfo?.kit_items && productInfo.kit_items.length > 0 && !isAlreadyComponent) {
      // Kit not yet expanded: add one line item per component
      productInfo.kit_items.forEach((kitItem) => {
        result.push({
          productName: kitItem.name,
          sku: '',
          color: '',
          size: '',
        })
      })
    } else {
      // Already expanded component or non-kit (t-shirt, etc.)
      result.push({
        productName: item.product_name,
        sku: item.customer_item_number || '',
        color: item.color || '',
        size: item.size || '',
      })
    }
  }

  return result
}

/** Fetches orders with items and products, then builds XML string */
export async function buildFulfillmentXml(options: FulfillmentXmlOptions = {}): Promise<string> {
  const schema = options.schema ?? fulfillmentSchema

  // Page through PostgREST's 1000-row default limit so fulfillment XML includes all matching orders.
  const ordersData = await fetchAllRows((from, to) => {
    let query = supabase
      .from('ra_cadet_orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (options.statusFilter) {
      const statuses = options.statusFilter.split(',').map((s) => s.trim()).filter(Boolean)
      if (statuses.length > 0) {
        query = query.in('status', statuses)
      }
    }

    if (options.since) {
      query = query.gte('created_at', options.since)
    }

    return query.range(from, to)
  })

  if (!ordersData || ordersData.length === 0) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<${schema.orders}>\n</${schema.orders}>`
  }

  // Fetch products for kit_items and category lookup
  const { data: productsData, error: productsError } = await supabase
    .from('ra_cadet_products')
    .select('id, category, kit_items')
  if (productsError) throw productsError

  const productInfoMap = new Map<string, DbProduct>()
  productsData?.forEach((p) => productInfoMap.set(p.id, p as DbProduct))

  // Fetch order items for each order
  const ordersWithItems: OrderWithItems[] = await Promise.all(
    (ordersData as DbOrder[]).map(async (order) => {
      const { data: items, error: itemsError } = await supabase
        .from('ra_cadet_order_items')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at')
      if (itemsError) throw itemsError
      return { ...order, items: (items || []) as DbOrderItem[] }
    })
  )

  const orderElements = ordersWithItems.map((order) => {
    const lineItems = expandOrderItems(order, productInfoMap)
    const classDateFormatted = order.class_date
      ? new Date(order.class_date).toISOString().split('T')[0]
      : ''
    const orderDateFormatted = new Date(order.created_at).toISOString().split('T')[0]

    const customerBlock = [
      element(schema.firstName, order.first_name),
      element(schema.lastName, order.last_name),
      element(schema.email, order.email),
      element(schema.classDate, classDateFormatted),
      element(schema.classType, order.class_type),
      element(schema.program, order.program),
      element(schema.status, order.status),
    ].join('')

    const shippingBlock = [
      element(schema.shippingName, order.shipping_name),
      element(schema.shippingAttention, order.shipping_attention),
      element(schema.shippingAddress1, order.shipping_address),
      element(schema.shippingAddress2, order.shipping_address2),
      element(schema.shippingCity, order.shipping_city),
      element(schema.shippingState, order.shipping_state),
      element(schema.shippingZip, order.shipping_zip),
      element(schema.shippingCountry, order.shipping_country),
    ].join('')

    const lineItemElements = lineItems
      .map(
        (li) =>
          `    <${schema.lineItem}>` +
          element(schema.productName, li.productName) +
          element(schema.sku, li.sku) +
          element(schema.color, li.color) +
          element(schema.size, li.size) +
          `</${schema.lineItem}>`
      )
      .join('\n')

    return `  <${schema.order}>
    ${element(schema.orderNumber, order.order_number)}
    <${schema.customer}>${customerBlock}</${schema.customer}>
    <${schema.shippingAddress}>${shippingBlock}</${schema.shippingAddress}>
    ${element(schema.orderDate, orderDateFormatted)}
    <${schema.lineItems}>
${lineItemElements}
    </${schema.lineItems}>
  </${schema.order}>`
  })

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<${schema.orders}>\n${orderElements.join('\n')}\n</${schema.orders}>`
  )
}

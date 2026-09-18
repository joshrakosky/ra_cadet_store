'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { fetchAllRows } from '@/lib/fetch-all-rows'
import * as XLSX from 'xlsx'
import { OrderWithItems } from '@/types'

export default function AdminExportButton() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [xmlLoading, setXmlLoading] = useState(false)

  useEffect(() => {
    // Check if admin code was used (stored in sessionStorage)
    const adminAuth = sessionStorage.getItem('adminAuth')
    const userCode = sessionStorage.getItem('userCode')
    const ADMIN_CODE = 'ADMIN'
    
    // User is admin if adminAuth is set OR if their code matches admin code
    const isAdminUser = adminAuth === 'true' || (userCode !== null && userCode.toUpperCase() === ADMIN_CODE)
    setIsAdmin(Boolean(isAdminUser))
  }, [])

  const exportToExcel = async () => {
    if (!isAdmin) return

    try {
      setLoading(true)

      // Page through PostgREST's 1000-row default limit so exports include full order history.
      const ordersData = await fetchAllRows((from, to) =>
        supabase
          .from('ra_cadet_orders')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to)
      )

      // Fetch all products to get deco information, current inventory, and kit_items
      const { data: productsData, error: productsError } = await supabase
        .from('ra_cadet_products')
        .select('id, name, deco, category, inventory, inventory_by_size, customer_item_number, kit_items')

      if (productsError) throw productsError

      // Create a map of product_id -> deco for quick lookup
      const productDecoMap = new Map<string, string>()
      const productInfoMap = new Map<string, { 
        name: string; 
        category: string; 
        inventory: number; 
        inventory_by_size?: Record<string, number>; 
        customer_item_number?: string;
        kit_items?: Array<{ name: string; thumbnail_url?: string }>;
      }>()
      productsData?.forEach(product => {
        if (product.deco) {
          productDecoMap.set(product.id, product.deco)
        }
        productInfoMap.set(product.id, {
          name: product.name,
          category: product.category,
          inventory: product.inventory,
          inventory_by_size: product.inventory_by_size,
          customer_item_number: product.customer_item_number || undefined,
          kit_items: product.kit_items as Array<{ name: string; thumbnail_url?: string }> | undefined
        })
      })

      // Fetch order items for each order
      const ordersWithItems: OrderWithItems[] = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: items, error: itemsError } = await supabase
            .from('ra_cadet_order_items')
            .select('*')
            .eq('order_id', order.id)
            .order('created_at')

          if (itemsError) throw itemsError

          return {
            ...order,
            items: items || []
          }
        })
      )

      // Sheet 1: Detailed Orders (one row per item, kits expanded into components)
      const detailedData = ordersWithItems.flatMap(order => {
        return order.items.flatMap((item) => {
          const productInfo = item.product_id ? productInfoMap.get(item.product_id) : null
          const isKit = productInfo?.category === 'kit'
          
          // Check if this item is already a component (from migration)
          // Components have product_id pointing to kit, but product_name matches a component name
          const isAlreadyComponent = isKit && productInfo?.kit_items && 
            productInfo.kit_items.some(kitItem => kitItem.name === item.product_name) &&
            !item.customer_item_number && !item.color && !item.size
          
          // If this is a kit and NOT already expanded into components, expand it
          if (isKit && productInfo?.kit_items && productInfo.kit_items.length > 0 && !isAlreadyComponent) {
            return productInfo.kit_items.map((kitItem) => ({
              'Order Number': order.order_number,
              'First Name': order.first_name || '',
              'Last Name': order.last_name || '',
              'Email': order.email,
              'Class Date': order.class_date ? new Date(order.class_date).toLocaleDateString() : '',
              'Class Type': order.class_type || '',
              'Program': order.program || '',
              'Product Name': kitItem.name, // Kit component name
              'Customer Item #': '', // Kit components don't have customer item numbers
              'Color': '', // Kit components don't have colors
              'Size': '', // Kit components don't have sizes
              'Shipping Name': order.shipping_name,
              'Shipping Address': order.shipping_address,
              'Shipping City': order.shipping_city,
              'Shipping State': order.shipping_state,
              'Shipping ZIP': order.shipping_zip,
              'Shipping Country': order.shipping_country,
              'Order Date': new Date(order.created_at).toLocaleDateString()
            }))
          } else {
            // Already expanded component or non-kit item (t-shirt, etc.) - keep as single row
            return [{
              'Order Number': order.order_number,
              'First Name': order.first_name || '',
              'Last Name': order.last_name || '',
              'Email': order.email,
              'Class Date': order.class_date ? new Date(order.class_date).toLocaleDateString() : '',
              'Class Type': order.class_type || '',
              'Program': order.program || '',
              'Product Name': item.product_name,
              'Customer Item #': item.customer_item_number || '',
              'Color': item.color || '',
              'Size': item.size || '',
              'Shipping Name': order.shipping_name,
              'Shipping Address': order.shipping_address,
              'Shipping City': order.shipping_city,
              'Shipping State': order.shipping_state,
              'Shipping ZIP': order.shipping_zip,
              'Shipping Country': order.shipping_country,
              'Order Date': new Date(order.created_at).toLocaleDateString()
            }]
          }
        })
      })

      // Sheet 2: Distribution Summary (grouped by product/color/size, kits expanded into components)
      const summaryMap = new Map<string, { quantity: number; deco: string }>()
      
      ordersWithItems.forEach(order => {
        order.items.forEach(item => {
          const productInfo = item.product_id ? productInfoMap.get(item.product_id) : null
          const isKit = productInfo?.category === 'kit'
          
          // Check if this item is already a component (from migration)
          const isAlreadyComponent = isKit && productInfo?.kit_items && 
            productInfo.kit_items.some(kitItem => kitItem.name === item.product_name) &&
            !item.customer_item_number && !item.color && !item.size
          
          // If this is a kit and NOT already expanded into components, expand it
          if (isKit && productInfo?.kit_items && productInfo.kit_items.length > 0 && !isAlreadyComponent) {
            productInfo.kit_items.forEach((kitItem) => {
              // Create a unique key for kit component (no color/size for components)
              const key = [
                kitItem.name,
                '', // No customer item number for kit components
                'N/A', // No color for kit components
                'N/A' // No size for kit components
              ].join('|')
              
              // Kit components don't have deco
              const existing = summaryMap.get(key)
              if (existing) {
                summaryMap.set(key, { quantity: existing.quantity + 1, deco: '' })
              } else {
                summaryMap.set(key, { quantity: 1, deco: '' })
              }
            })
          } else {
            // Already expanded component or non-kit item (t-shirt, etc.) - group normally
            const key = [
              item.product_name,
              item.customer_item_number || '',
              item.color || 'N/A',
              item.size || 'N/A'
            ].join('|')
            
            // Get deco from product (only for non-components)
            let deco = ''
            if (!isAlreadyComponent) {
              deco = item.product_id ? (productDecoMap.get(item.product_id) || '') : ''
            }
            
            const existing = summaryMap.get(key)
            if (existing) {
              summaryMap.set(key, { quantity: existing.quantity + 1, deco: existing.deco })
            } else {
              summaryMap.set(key, { quantity: 1, deco })
            }
          }
        })
      })

      // Convert map to array for Excel
      const summaryData = Array.from(summaryMap.entries()).map(([key, data]) => {
        const [productName, customerItem, color, size] = key.split('|')
        return {
          'Product Name': productName,
          'Customer Item #': customerItem,
          'Color': color,
          'Size': size,
          'Deco': data.deco || '',
          'Quantity': data.quantity
        }
      }).sort((a, b) => {
        // Sort by product name, then color, then size
        if (a['Product Name'] !== b['Product Name']) {
          return a['Product Name'].localeCompare(b['Product Name'])
        }
        if (a['Color'] !== b['Color']) {
          return a['Color'].localeCompare(b['Color'])
        }
        return a['Size'].localeCompare(b['Size'])
      })

      // Create workbook with two sheets
      const wb = XLSX.utils.book_new()
      
      // Detailed Orders sheet
      const wsDetailed = XLSX.utils.json_to_sheet(detailedData)
      XLSX.utils.book_append_sheet(wb, wsDetailed, 'Detailed Orders')
      
      // Distribution Summary sheet
      const wsSummary = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Distribution Summary')

      // Sheet 3: Backorder Report
      // Track products with negative inventory and which orders contain them
      const backorderData: Array<{
        'Product Name': string
        'Customer Item #': string
        'Category': string
        'Size': string
        'Current Inventory': number
        'Backorder Quantity': number
        'Order Numbers': string
        'Order Dates': string
        'Total Orders': number
      }> = []

      // Get all products with negative inventory (backorders)
      const backorderedProducts = productsData?.filter(product => {
        if (product.category === 'kit') {
          // For kits, check overall inventory
          return product.inventory < 0
        } else if (product.category === 'tshirt' && product.inventory_by_size) {
          // For t-shirts, check if any size has negative inventory
          return Object.values(product.inventory_by_size as Record<string, number>).some((inv: number) => inv < 0)
        }
        return false
      }) || []

      // For each backordered product, find orders that contain it
      for (const product of backorderedProducts) {
        const productInfo = productInfoMap.get(product.id)
        if (!productInfo) continue

        if (product.category === 'kit') {
          // Kit backorder - check overall inventory
          if (product.inventory < 0) {
            // Find all orders that contain this kit
            const ordersWithProduct = ordersWithItems.filter(order =>
              order.items.some(item => item.product_id === product.id)
            )

            if (ordersWithProduct.length > 0) {
              backorderData.push({
                'Product Name': productInfo.name,
                'Customer Item #': productInfo.customer_item_number || '',
                'Category': 'Kit',
                'Size': 'N/A',
                'Current Inventory': product.inventory,
                'Backorder Quantity': Math.abs(product.inventory),
                'Order Numbers': ordersWithProduct.map(o => o.order_number).join(', '),
                'Order Dates': ordersWithProduct.map(o => new Date(o.created_at).toLocaleDateString()).join(', '),
                'Total Orders': ordersWithProduct.length
              })
            }
          }
        } else if (product.category === 'tshirt' && product.inventory_by_size) {
          // T-shirt backorder - check each size
          Object.entries(product.inventory_by_size as Record<string, number>).forEach(([size, inventory]) => {
            if (inventory < 0) {
              // Find all orders that contain this t-shirt size
              const ordersWithProduct = ordersWithItems.filter(order =>
                order.items.some(item =>
                  item.product_id === product.id && item.size === size
                )
              )

              if (ordersWithProduct.length > 0) {
                backorderData.push({
                  'Product Name': `${productInfo.name} - ${size}`,
                  'Customer Item #': productInfo.customer_item_number ? `${productInfo.customer_item_number}-${size}` : '',
                  'Category': 'T-Shirt',
                  'Size': size,
                  'Current Inventory': inventory,
                  'Backorder Quantity': Math.abs(inventory),
                  'Order Numbers': ordersWithProduct.map(o => o.order_number).join(', '),
                  'Order Dates': ordersWithProduct.map(o => new Date(o.created_at).toLocaleDateString()).join(', '),
                  'Total Orders': ordersWithProduct.length
                })
              }
            }
          })
        }
      }

      // Sort backorder data by backorder quantity (descending)
      backorderData.sort((a, b) => b['Backorder Quantity'] - a['Backorder Quantity'])

      // Backorder Report sheet
      const wsBackorder = XLSX.utils.json_to_sheet(backorderData)
      XLSX.utils.book_append_sheet(wb, wsBackorder, 'Backorder Report')

      // Generate filename with current date
      const filename = `ra-new-hires-orders-${new Date().toISOString().split('T')[0]}.xlsx`

      // Write file
      XLSX.writeFile(wb, filename)
    } catch (error: any) {
      console.error('Export error:', error)
      alert('Failed to export orders. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /** Export orders as XML for Foremost Graphics fulfillment. */
  const exportToXml = async () => {
    if (!isAdmin) return
    try {
      setXmlLoading(true)
      const res = await fetch('/api/fulfillment/orders')
      if (!res.ok) throw new Error(res.statusText)
      const xml = await res.text()
      const blob = new Blob([xml], { type: 'application/xml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ra-new-hires-fulfillment-${new Date().toISOString().split('T')[0]}.xml`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('XML export error:', error)
      alert('Failed to export XML. Please try again.')
    } finally {
      setXmlLoading(false)
    }
  }

  if (!isAdmin) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
    <button
      onClick={exportToExcel}
      disabled={loading}
      className="px-4 py-2 text-white rounded-md shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
      style={{ backgroundColor: '#c8102e' }}
      title="Export all orders to Excel (Admin only)"
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"></circle>
            <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Exporting...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Excel
        </>
      )}
    </button>
    <button
      onClick={exportToXml}
      disabled={xmlLoading}
      className="px-4 py-2 text-white rounded-md shadow-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
      style={{ backgroundColor: '#c8102e' }}
      title="Export orders as XML for Foremost Graphics fulfillment (Admin only)"
    >
      {xmlLoading ? (
        <>
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"></circle>
            <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Exporting...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          Export XML
        </>
      )}
    </button>
    </div>
  )
}


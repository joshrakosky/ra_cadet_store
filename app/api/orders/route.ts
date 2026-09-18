import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Cadet order numbers: RACD-001, RACD-002, ... (3-digit pad). Fresh app — no RANH/ra-new-hire fallback.
async function generateOrderNumber(): Promise<string> {
  const { data: orders, error } = await supabase
    .from('ra_cadet_orders')
    .select('order_number')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching orders:', error)
    return 'RACD-001'
  }

  if (!orders || orders.length === 0) {
    return 'RACD-001'
  }

  const lastOrderNumber = orders[0].order_number
  const match = lastOrderNumber.match(/RACD-(\d+)/i)

  if (match) {
    const lastNumber = parseInt(match[1], 10)
    const nextNumber = lastNumber + 1
    return `RACD-${String(nextNumber).padStart(3, '0')}`
  }

  return 'RACD-001'
}

// Update inventory for a product
async function updateInventory(productId: string, size: string | null, quantity: number = 1): Promise<void> {
  try {
    // Get current product data
    const { data: product, error: fetchError } = await supabase
      .from('ra_cadet_products')
      .select('inventory, inventory_by_size, category')
      .eq('id', productId)
      .single()

    if (fetchError) throw fetchError

    // Allow negative inventory for all products (backorder enabled)
    const newInventory = (product.inventory || 0) - quantity

    // Update size-specific inventory if size is provided (allow negative for backorder)
    let newInventoryBySize = product.inventory_by_size || {}
    if (size && newInventoryBySize[size] !== undefined) {
      newInventoryBySize = {
        ...newInventoryBySize,
        [size]: (newInventoryBySize[size] || 0) - quantity
      }
    }

    // Prepare update object - only include inventory_by_size if it was modified or exists
    const updateData: { inventory: number; inventory_by_size?: Record<string, number> } = {
      inventory: newInventory
    }
    
    // Only update inventory_by_size if size was provided (for t-shirts)
    // For kits (size is null), preserve the existing inventory_by_size value
    if (size && newInventoryBySize[size] !== undefined) {
      updateData.inventory_by_size = newInventoryBySize
    }

    // Update product inventory
    const { error: updateError } = await supabase
      .from('ra_cadet_products')
      .update(updateData)
      .eq('id', productId)

    if (updateError) throw updateError
  } catch (error) {
    console.error('Error updating inventory:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, email, firstName, lastName, program, tshirtSize, kitId, shipping, classDate, classType } = body

    // Validate required fields
    if (!code || !email || !firstName || !lastName || !program || !tshirtSize || !kitId || !shipping) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Normalize code to uppercase
    const normalizedCode = code.toUpperCase().trim()

    // Check if code exists in access codes table and mark as used
    const { data: accessCode } = await supabase
      .from('ra_cadet_access_codes')
      .select('id, used')
      .eq('code', normalizedCode)
      .single()

    // Check for duplicate order by code (one order per code)
    const { data: existingOrder } = await supabase
      .from('ra_cadet_orders')
      .select('id')
      .eq('code', normalizedCode)
      .single()

    if (existingOrder) {
      return NextResponse.json(
        { error: 'This code has already been used. Each code can only be used once.' },
        { status: 400 }
      )
    }

    // If code exists in access codes table and is already marked as used, reject
    if (accessCode && accessCode.used) {
      return NextResponse.json(
        { error: 'This code has already been used.' },
        { status: 400 }
      )
    }

    // Generate order number
    const orderNumber = await generateOrderNumber()

    // Create order (class_date and class_type from date picker and class type dropdown)
    const { data: order, error: orderError } = await supabase
      .from('ra_cadet_orders')
      .insert({
        code: normalizedCode,
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        order_number: orderNumber,
        program: program,
        tshirt_size: tshirtSize,
        shipping_name: shipping.name,
        shipping_attention: shipping.attention || null,
        shipping_address: shipping.address,
        shipping_address2: shipping.address2 || null,
        shipping_city: shipping.city,
        shipping_state: shipping.state,
        shipping_zip: shipping.zip,
        shipping_country: shipping.country || 'USA',
        class_date: classDate || null,
        class_type: classType || null
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Get RA t-shirt product details (used for both RA and LIFT programs)
    const { data: tshirtProduct } = await supabase
      .from('ra_cadet_products')
      .select('id, name, customer_item_number')
      .eq('category', 'tshirt')
      .eq('program', 'RA')
      .single()

    // Get kit product details and its components
    const { data: kitProduct } = await supabase
      .from('ra_cadet_products')
      .select('id, name, customer_item_number, kit_items')
      .eq('id', kitId)
      .single()

    let orderItems: any[] = []

    // Add t-shirt order item with size-specific SKU
    if (tshirtProduct) {
      // Build size-specific SKU: base SKU + "-" + size (e.g., RA-NH-TEE-XS)
      const tshirtSku = tshirtProduct.customer_item_number 
        ? `${tshirtProduct.customer_item_number}-${tshirtSize}`
        : null

      orderItems.push({
        order_id: order.id,
        product_id: tshirtProduct.id,
        product_name: `${tshirtProduct.name} - ${tshirtSize}`,
        customer_item_number: tshirtSku,
        color: null,
        size: tshirtSize
      })

      // Update t-shirt inventory
      await updateInventory(tshirtProduct.id, tshirtSize, 1)
    }

    // Add kit component order items (expand kit into individual components)
    if (kitProduct && kitProduct.kit_items && Array.isArray(kitProduct.kit_items) && kitProduct.kit_items.length > 0) {
      // Fetch component SKUs from ra_cadet_component_inventory when available (for exports/fulfillment alignment)
      const componentNames = kitProduct.kit_items.map((k: { name: string }) => k.name)
      const { data: componentSkus } = await supabase
        .from('ra_cadet_component_inventory')
        .select('component_name, sku')
        .in('component_name', componentNames)
      const skuMap = new Map<string, string | null>()
      for (const row of componentSkus ?? []) {
        if (row.sku) skuMap.set(row.component_name, row.sku)
      }
      // Insert individual components from kit_items
      kitProduct.kit_items.forEach((kitItem: { name: string; thumbnail_url?: string }) => {
        orderItems.push({
          order_id: order.id,
          product_id: kitProduct.id, // Keep reference to kit product
          product_name: kitItem.name, // Component name
          customer_item_number: skuMap.get(kitItem.name) ?? null, // Use component SKU when available
          color: null,
          size: null
        })
      })

      // Update kit inventory (still track kit-level inventory)
      await updateInventory(kitProduct.id, null, 1)
    } else if (kitProduct) {
      // Fallback: if kit has no kit_items, insert kit as single item
      orderItems.push({
        order_id: order.id,
        product_id: kitProduct.id,
        product_name: kitProduct.name,
        customer_item_number: kitProduct.customer_item_number || null,
        color: null,
        size: null
      })

      // Update kit inventory
      await updateInventory(kitProduct.id, null, 1)
    }

    // If kit has multiple items, fetch them and add to order
    // This assumes kit items are stored as separate products with a kit_id field
    // For now, we'll add the kit as a single item
    // TODO: If kits have multiple products, fetch them here

    const { error: itemsError } = await supabase
      .from('ra_cadet_order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    // Mark code as used in access codes table if it exists (must succeed or client sees success while row stays stale)
    if (accessCode) {
      const { error: accessCodeUpdateError } = await supabase
        .from('ra_cadet_access_codes')
        .update({
          used: true,
          used_at: new Date().toISOString(),
          order_id: order.id,
          email: email.toLowerCase()
        })
        .eq('id', accessCode.id)
      if (accessCodeUpdateError) {
        console.error('Access code update failed after order created:', accessCodeUpdateError)
        throw new Error(
          accessCodeUpdateError.message ||
            'Order was created but the access code could not be marked as used. Check ra_cadet_access_codes schema (email column) and RLS UPDATE policy.'
        )
      }
    }

    return NextResponse.json({
      success: true,
      order_number: orderNumber,
      order_id: order.id
    })

  } catch (error: any) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}


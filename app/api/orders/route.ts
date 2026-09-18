import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import {
  STANDARD_KIT_ITEMS,
  isCadetProgram,
  isCadetTshirtSize,
  skuForKitItem,
} from '@/lib/cadet-kits'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, email, firstName, lastName, program, tshirtSize, shipping } = body

    if (!code || !email || !firstName || !lastName || !program || !tshirtSize || !shipping) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!isCadetProgram(program) || program !== 'Standard') {
      return NextResponse.json(
        { error: 'Only the Standard cadet kit can be ordered right now.' },
        { status: 400 }
      )
    }

    if (!isCadetTshirtSize(tshirtSize)) {
      return NextResponse.json(
        { error: 'Please select a t-shirt size (S–2XL).' },
        { status: 400 }
      )
    }

    if (!shipping.address) {
      return NextResponse.json(
        { error: 'Shipping address is required' },
        { status: 400 }
      )
    }

    const normalizedCode = code.toUpperCase().trim()

    const { data: accessCode } = await supabase
      .from('ra_cadet_access_codes')
      .select('id, used')
      .eq('code', normalizedCode)
      .single()

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

    if (accessCode && accessCode.used) {
      return NextResponse.json(
        { error: 'This code has already been used.' },
        { status: 400 }
      )
    }

    const orderNumber = await generateOrderNumber()

    // Free-type address lives in shipping_address. City/state/zip stay empty
    // until we split address fields later. class_date/class_type are unused.
    const { data: order, error: orderError } = await supabase
      .from('ra_cadet_orders')
      .insert({
        code: normalizedCode,
        email: email.toLowerCase(),
        first_name: firstName,
        last_name: lastName,
        order_number: orderNumber,
        program,
        tshirt_size: tshirtSize,
        shipping_name: shipping.name || `${firstName} ${lastName}`,
        // Column is NOT NULL from the cloned schema; cadet orders have no attention line.
        shipping_attention: shipping.attention || '',
        shipping_address: shipping.address,
        shipping_address2: shipping.address2 || null,
        shipping_city: shipping.city || '',
        shipping_state: shipping.state || '',
        shipping_zip: shipping.zip || '',
        shipping_country: shipping.country || 'USA',
        class_date: null,
        class_type: null,
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Line items come from the Standard kit catalog (not a kit picker).
    // product_id is optional so orders still save before catalog rows exist.
    const orderItems = STANDARD_KIT_ITEMS.map((item) => ({
      order_id: order.id,
      product_id: null,
      product_name: item.sized ? `${item.name} - ${tshirtSize}` : item.name,
      customer_item_number: skuForKitItem(item, tshirtSize),
      color: null,
      size: item.sized ? tshirtSize : null,
    }))

    const { error: itemsError } = await supabase
      .from('ra_cadet_order_items')
      .insert(orderItems)

    if (itemsError) throw itemsError

    if (accessCode) {
      const { error: accessCodeUpdateError } = await supabase
        .from('ra_cadet_access_codes')
        .update({
          used: true,
          used_at: new Date().toISOString(),
          order_id: order.id,
          email: email.toLowerCase(),
        })
        .eq('id', accessCode.id)
      if (accessCodeUpdateError) {
        console.error('Access code update failed after order created:', accessCodeUpdateError)
        throw new Error(
          accessCodeUpdateError.message ||
            'Order was created but the access code could not be marked as used.'
        )
      }
    }

    return NextResponse.json({
      success: true,
      order_number: orderNumber,
      order_id: order.id,
    })
  } catch (error: any) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    )
  }
}

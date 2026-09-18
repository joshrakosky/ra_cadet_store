/**
 * Fulfillment pull endpoint – Foremost Graphics (or other partners) call this
 * to fetch orders as XML. Returns Content-Type: application/xml.
 *
 * Query params:
 *   - status: Comma-separated (e.g. Pending,Fulfillment)
 *   - since: ISO date, only orders created on or after
 *
 * Auth: FULFILLMENT_API_KEY in Authorization header or ?key= query param.
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildFulfillmentXml } from '@/lib/fulfillment-xml'

function isAuthorized(request: NextRequest): boolean {
  const apiKey = process.env.FULFILLMENT_API_KEY
  if (!apiKey) return true // No key configured = open (restrict in prod)

  const headerKey = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim()
  const queryKey = request.nextUrl.searchParams.get('key')
  return (headerKey && headerKey === apiKey) || (queryKey && queryKey === apiKey) || false
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const status = request.nextUrl.searchParams.get('status') ?? undefined
    const since = request.nextUrl.searchParams.get('since') ?? undefined

    const xml = await buildFulfillmentXml({ statusFilter: status, since })

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('[fulfillment/orders] Error building XML:', error)
    return NextResponse.json(
      { error: 'Failed to generate fulfillment XML' },
      { status: 500 }
    )
  }
}

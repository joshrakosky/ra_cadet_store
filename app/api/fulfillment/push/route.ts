/**
 * Fulfillment push endpoint – Sends order XML to Foremost Graphics listener.
 * Can be called manually (admin) or by a cron job.
 *
 * POST body (optional):
 *   - status: Comma-separated status filter
 *   - since: ISO date filter
 *
 * Requires FOREMOST_LISTENER_URL in env. Optionally FOREMOST_API_KEY for auth.
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildFulfillmentXml } from '@/lib/fulfillment-xml'

export async function POST(request: NextRequest) {
  const listenerUrl = process.env.FOREMOST_LISTENER_URL
  if (!listenerUrl) {
    return NextResponse.json(
      { error: 'Foremost listener URL not configured. Set FOREMOST_LISTENER_URL.' },
      { status: 500 }
    )
  }

  try {
    let statusFilter: string | undefined
    let since: string | undefined
    try {
      const body = await request.json().catch(() => ({}))
      statusFilter = body.status
      since = body.since
    } catch {
      // No body or invalid JSON – use defaults
    }

    const xml = await buildFulfillmentXml({ statusFilter, since })

    const headers: Record<string, string> = {
      'Content-Type': 'application/xml; charset=utf-8',
    }
    const apiKey = process.env.FOREMOST_API_KEY
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const res = await fetch(listenerUrl, {
      method: 'POST',
      headers,
      body: xml,
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[fulfillment/push] Foremost listener error:', res.status, text)
      return NextResponse.json(
        {
          error: 'Foremost listener returned an error',
          status: res.status,
          body: text.slice(0, 500),
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Orders pushed to Foremost successfully',
      status: res.status,
    })
  } catch (error) {
    console.error('[fulfillment/push] Error:', error)
    return NextResponse.json(
      { error: 'Failed to push orders to Foremost' },
      { status: 500 }
    )
  }
}

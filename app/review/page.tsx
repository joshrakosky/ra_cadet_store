'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import HelpIcon from '@/components/HelpIcon'
import {
  STANDARD_KIT_ITEMS,
  isCadetProgram,
  isCadetTshirtSize,
  type CadetProgram,
  type CadetTshirtSize,
} from '@/lib/cadet-kits'

export default function ReviewPage() {
  const router = useRouter()
  const [program, setProgram] = useState<CadetProgram | null>(null)
  const [tshirtSize, setTshirtSize] = useState<CadetTshirtSize | ''>('')
  const [shipping, setShipping] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const userCode = sessionStorage.getItem('userCode')
    const selectedProgram = sessionStorage.getItem('selectedProgram')
    const tshirtSizeData = sessionStorage.getItem('tshirtSize')
    const shippingData = sessionStorage.getItem('shipping')

    if (!userCode) {
      router.push('/')
      return
    }

    if (!isCadetProgram(selectedProgram) || selectedProgram !== 'Standard') {
      router.push('/program')
      return
    }

    if (!isCadetTshirtSize(tshirtSizeData)) {
      router.push('/kit-details')
      return
    }

    if (!shippingData) {
      router.push('/shipping')
      return
    }

    setProgram(selectedProgram)
    setTshirtSize(tshirtSizeData)
    setShipping(JSON.parse(shippingData))
    setLoading(false)
  }, [router])

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)

    try {
      const userCode = sessionStorage.getItem('userCode')!

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: userCode,
          email: shipping.email,
          firstName: shipping.firstName,
          lastName: shipping.lastName,
          program,
          tshirtSize,
          shipping,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit order')
      }

      const orderData = await response.json()
      sessionStorage.setItem('orderNumber', orderData.order_number)
      sessionStorage.removeItem('selectedProgram')
      sessionStorage.removeItem('tshirtSize')
      sessionStorage.removeItem('selectedKitId')
      sessionStorage.removeItem('shipping')
      sessionStorage.removeItem('orderEmail')
      router.push('/confirmation')
    } catch (err: any) {
      setError(err.message || 'Failed to submit order. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#00263a' }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4 relative" style={{ backgroundColor: '#00263a' }}>
      <HelpIcon />
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Your Order</h1>
            <p className="text-gray-600">Please review your selections before submitting</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          <div className="mb-6 pb-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Standard Cadet Kit</h2>
            <div className="space-y-3">
              {STANDARD_KIT_ITEMS.map((item) => (
                <div key={item.sku} className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  {item.sized && (
                    <p className="text-sm text-gray-600">Size: {tshirtSize}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6 pb-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Information</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <p className="font-medium text-gray-900">{shipping.firstName} {shipping.lastName}</p>
              <p className="text-sm text-gray-600">Email: {shipping.email}</p>
            </div>
          </div>

          <div className="mb-6 pb-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Address</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <p className="text-sm text-gray-600">{shipping.address}</p>
              {shipping.address2 && <p className="text-sm text-gray-600">{shipping.address2}</p>}
              <p className="text-sm text-gray-600">
                {shipping.city}, {shipping.state} {shipping.zip}
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={() => router.push('/shipping')}
              className="px-6 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:ring-offset-2 font-medium"
              style={{ backgroundColor: '#c8102e' }}
            >
              ← Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-6 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              style={{ backgroundColor: '#c8102e' }}
            >
              {submitting ? 'Submitting...' : 'Submit Order →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

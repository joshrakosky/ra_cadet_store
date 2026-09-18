'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminExportButton from '@/components/AdminExportButton'
import HelpIcon from '@/components/HelpIcon'

type Program = 'RA' | 'LIFT'

export default function ReviewPage() {
  const router = useRouter()
  const [program, setProgram] = useState<Program | null>(null)
  const [tshirtSize, setTshirtSize] = useState<string>('')
  const [kitId, setKitId] = useState<string>('')
  const [tshirtProduct, setTshirtProduct] = useState<any>(null)
  const [kitProduct, setKitProduct] = useState<any>(null)
  const [shipping, setShipping] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if user has completed all steps
    const userCode = sessionStorage.getItem('userCode')
    const selectedProgram = sessionStorage.getItem('selectedProgram') as Program | null
    const tshirtSizeData = sessionStorage.getItem('tshirtSize')
    const selectedKitId = sessionStorage.getItem('selectedKitId')
    const shippingData = sessionStorage.getItem('shipping')
    
    if (!userCode) {
      router.push('/')
      return
    }

    if (!selectedProgram || (selectedProgram !== 'RA' && selectedProgram !== 'LIFT')) {
      router.push('/program')
      return
    }

    if (!tshirtSizeData) {
      router.push('/tshirt-size')
      return
    }

    if (!selectedKitId) {
      router.push('/kit-selection')
      return
    }

    if (!shippingData) {
      router.push('/shipping')
      return
    }

    // Parse stored data
    const parsedShipping = JSON.parse(shippingData)

    setProgram(selectedProgram)
    setTshirtSize(tshirtSizeData)
    setKitId(selectedKitId)
    setShipping(parsedShipping)

    // Load product details
    loadProducts(selectedProgram, selectedKitId)
  }, [router])

  const loadProducts = async (programType: Program, kitIdData: string) => {
    try {
      // Load t-shirt product (always use 'RA' since t-shirts are consolidated)
      const { data: tshirtData, error: tshirtError } = await supabase
        .from('ra_cadet_products')
        .select('*')
        .eq('category', 'tshirt')
        .eq('program', 'RA')
        .single()

      if (tshirtError) throw tshirtError
      setTshirtProduct(tshirtData)

      // Load kit product
      const { data: kitData, error: kitError } = await supabase
        .from('ra_cadet_products')
        .select('*')
        .eq('id', kitIdData)
        .single()

      if (kitError) throw kitError
      setKitProduct(kitData)
    } catch (err: any) {
      setError(err.message || 'Failed to load product information')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)

    try {
      const userCode = sessionStorage.getItem('userCode')!
      const email = sessionStorage.getItem('orderEmail')!

      // Submit order to API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: userCode,
          email: shipping.email,
          firstName: shipping.firstName,
          lastName: shipping.lastName,
          program: program,
          tshirtSize: tshirtSize,
          kitId: kitId,
          shipping: shipping,
          classDate: shipping.classDate || null,
          classType: shipping.classType || null
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit order')
      }

      const orderData = await response.json()
      
      // Store order number for confirmation page
      sessionStorage.setItem('orderNumber', orderData.order_number)
      
      // Clear selections
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
      <AdminExportButton />
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

          {/* Program & T-Shirt Section */}
          <div className="mb-6 pb-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Selected Items</h2>
            <div className="space-y-4">
              {/* T-Shirt */}
              {tshirtProduct && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900">{tshirtProduct.name}</p>
                  <p className="text-sm text-gray-600">Size: {tshirtSize}</p>
                </div>
              )}

              {/* Kit */}
              {kitProduct && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium text-gray-900">{kitProduct.name}</p>
                  {kitProduct.description && (
                    <p className="text-sm text-gray-600 mt-1">{kitProduct.description}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Your Information Section */}
          <div className="mb-6 pb-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Information</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <p className="font-medium text-gray-900">{shipping.firstName} {shipping.lastName}</p>
              <p className="text-sm text-gray-600">Email: {shipping.email}</p>
              {shipping.classDate && (
                <p className="text-sm text-gray-600">Class Date: {new Date(shipping.classDate).toLocaleDateString()}</p>
              )}
              {shipping.classType && (
                <p className="text-sm text-gray-600">Class Type: {shipping.classType}</p>
              )}
            </div>
          </div>

          {/* Shipping Address Section */}
          <div className="mb-6 pb-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Address</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">{shipping.name}</p>
              {shipping.attention && <p className="text-sm text-gray-600">Attn: {shipping.attention}</p>}
              <p className="text-sm text-gray-600">{shipping.address}</p>
              {shipping.address2 && <p className="text-sm text-gray-600">{shipping.address2}</p>}
              <p className="text-sm text-gray-600">
                {shipping.city}, {shipping.state} {shipping.zip}
              </p>
              <p className="text-sm text-gray-600">{shipping.country}</p>
            </div>
          </div>

          {/* Action Buttons */}
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


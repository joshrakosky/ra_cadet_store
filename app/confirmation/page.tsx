'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminExportButton from '@/components/AdminExportButton'
import HelpIcon from '@/components/HelpIcon'

export default function ConfirmationPage() {
  const router = useRouter()
  const [orderNumber, setOrderNumber] = useState<string>('')

  useEffect(() => {
    const orderNum = sessionStorage.getItem('orderNumber')
    if (!orderNum) {
      router.push('/')
      return
    }
    setOrderNumber(orderNum)
  }, [router])

  const handleClose = () => {
    sessionStorage.clear()
    router.push('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ backgroundColor: '#00263a' }}>
      <AdminExportButton />
      <HelpIcon />
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center relative">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-6">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">
            Thank you for your order
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <p className="text-sm text-gray-600 mb-2">Your Order Number:</p>
          <p className="text-2xl font-bold" style={{ color: '#c8102e' }}>{orderNumber}</p>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Screenshot this page or email yourself your order number by clicking the button below
        </p>

        <a
          href={`mailto:?subject=Republic Airways New Hires Order Confirmation - ${orderNumber}&body=Thank you for your order!%0D%0A%0D%0AYour Order Number: ${orderNumber}%0D%0A%0D%0AThank you`}
          onClick={() => {
            // Clear session after a short delay to allow mailto to open
            setTimeout(() => {
              sessionStorage.clear()
            }, 100)
          }}
          className="w-full px-6 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:ring-offset-2 font-medium inline-block text-center"
          style={{ backgroundColor: '#c8102e' }}
        >
          Email Order Confirmation
        </a>
      </div>
    </div>
  )
}


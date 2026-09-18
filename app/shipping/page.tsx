'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import AdminExportButton from '@/components/AdminExportButton'
import HelpIcon from '@/components/HelpIcon'

type Program = 'RA' | 'LIFT'

export default function ShippingPage() {
  const router = useRouter()
  const [program, setProgram] = useState<Program | null>(null)
  const CLASS_TYPE_OPTIONS = ['Corporate', 'Flight Attendant', 'General', 'LIFT', 'Maintenance', 'Pilot'] as const

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    classDate: '',
    classType: ''
  })
  const [error, setError] = useState('')

  // Default shipping address (not editable)
  const defaultShipping = {
    name: 'Republic Airways Training Center',
    attention: 'HR Shared Services',
    address: '2 Brickyard Ln',
    address2: '',
    city: 'CARMEL',
    state: 'IN',
    zip: '46032',
    country: 'USA'
  }

  useEffect(() => {
    // Check if user has completed previous steps
    const userCode = sessionStorage.getItem('userCode')
    const selectedProgram = sessionStorage.getItem('selectedProgram') as Program | null
    const tshirtSize = sessionStorage.getItem('tshirtSize')
    const selectedKitId = sessionStorage.getItem('selectedKitId')

    if (!userCode) {
      router.push('/')
      return
    }

    if (!selectedProgram || (selectedProgram !== 'RA' && selectedProgram !== 'LIFT')) {
      router.push('/program')
      return
    }

    if (!tshirtSize) {
      router.push('/tshirt-size')
      return
    }

    if (!selectedKitId) {
      router.push('/kit-selection')
      return
    }

    setProgram(selectedProgram)

    // Pre-populate form if saved
    const savedShipping = sessionStorage.getItem('shipping')
    if (savedShipping) {
      try {
        const parsedShipping = JSON.parse(savedShipping)
        setFormData({
          firstName: parsedShipping.firstName || '',
          lastName: parsedShipping.lastName || '',
          email: parsedShipping.email || '',
          classDate: parsedShipping.classDate || '',
          classType: parsedShipping.classType || ''
        })
      } catch (e) {
        // If parsing fails, start fresh
      }
    }
  }, [router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate required fields
    if (!formData.firstName.trim()) {
      setError('Please enter your first name')
      return
    }

    if (!formData.lastName.trim()) {
      setError('Please enter your last name')
      return
    }

    if (!formData.email || !formData.email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    if (!formData.classDate) {
      setError('Please select your class date')
      return
    }

    if (!formData.classType || !CLASS_TYPE_OPTIONS.includes(formData.classType as typeof CLASS_TYPE_OPTIONS[number])) {
      setError('Please select your class type')
      return
    }

    // Store shipping information to sessionStorage (includes class date and class type)
    const shippingInfo = {
      ...formData,
      ...defaultShipping
    }
    sessionStorage.setItem('shipping', JSON.stringify(shippingInfo))
    sessionStorage.setItem('orderEmail', formData.email.toLowerCase())
    
    // Navigate to review page
    router.push('/review')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  return (
    <div className="min-h-screen py-12 px-4 relative" style={{ backgroundColor: '#00263a' }}>
      <AdminExportButton />
      <HelpIcon />
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping Information</h1>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Editable Fields */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Your Information</h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c8102e] focus:border-transparent text-black bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c8102e] focus:border-transparent text-black bg-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c8102e] focus:border-transparent text-black bg-white"
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="classDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Class Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="classDate"
                    name="classDate"
                    value={formData.classDate}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c8102e] focus:border-transparent text-black bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="classType" className="block text-sm font-medium text-gray-700 mb-1">
                    Class Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="classType"
                    name="classType"
                    value={formData.classType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c8102e] focus:border-transparent text-black bg-white"
                  >
                    <option value="">Select class type</option>
                    {CLASS_TYPE_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Default Shipping Address (Read-only) */}
            <div className="space-y-4 pt-4 border-t">
              <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Shipping Address</h2>
              <p className="text-sm text-gray-600 mb-4">All orders ship to the Republic Airways Training Center</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={defaultShipping.name}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Attention
                </label>
                <input
                  type="text"
                  value={defaultShipping.attention}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={defaultShipping.address}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={defaultShipping.city}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State/Province <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={defaultShipping.state}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={defaultShipping.zip}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => router.push('/kit-selection')}
                className="px-6 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:ring-offset-2 font-medium"
                style={{ backgroundColor: '#c8102e' }}
              >
                ← Back
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:ring-offset-2 font-medium"
                style={{ backgroundColor: '#c8102e' }}
              >
                Continue to Review →
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AdminExportButton from '@/components/AdminExportButton'
import HelpIcon from '@/components/HelpIcon'
import ProductThumbnailModal from '@/components/ProductThumbnailModal'

type Program = 'RA' | 'LIFT'

interface KitItem {
  name: string
  thumbnail_url?: string
}

interface KitProduct {
  id: string
  name: string
  description?: string
  thumbnail_url?: string
  kit_items?: KitItem[] // JSONB array of products included in the kit
}

export default function KitSelectionPage() {
  const router = useRouter()
  const [program, setProgram] = useState<Program | null>(null)
  const [kits, setKits] = useState<KitProduct[]>([])
  const [selectedKitId, setSelectedKitId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalProduct, setModalProduct] = useState<KitItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    // Check if user has selected a program and t-shirt size
    const selectedProgram = sessionStorage.getItem('selectedProgram') as Program | null
    const tshirtSize = sessionStorage.getItem('tshirtSize')
    
    if (!selectedProgram || (selectedProgram !== 'RA' && selectedProgram !== 'LIFT')) {
      router.push('/program')
      return
    }

    if (!tshirtSize) {
      router.push('/tshirt-size')
      return
    }

    setProgram(selectedProgram)
    loadKits(selectedProgram)
  }, [router])

  const loadKits = async (programType: Program) => {
    try {
      // Fetch kit products for the selected program
      // Order by customer_item_number to ensure Kit 1, 2, 3, 4 order
      const { data, error } = await supabase
        .from('ra_cadet_products')
        .select('id, name, description, thumbnail_url, customer_item_number, kit_items')
        .eq('category', 'kit')
        .eq('program', programType)
        .order('customer_item_number')

      if (error) throw error

      setKits(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load kits')
    } finally {
      setLoading(false)
    }
  }

  const handleProductClick = (product: KitItem) => {
    setModalProduct(product)
    setIsModalOpen(true)
  }

  const handleKitSelect = (kitId: string) => {
    // Allow selection of any kit (backorders allowed)
    setSelectedKitId(kitId)
    setError('')
  }

  const handleContinue = () => {
    if (!selectedKitId) {
      setError('Please select 1 of the above kits')
      return
    }

    // Store selected kit ID (backorders allowed, no inventory check needed)
    sessionStorage.setItem('selectedKitId', selectedKitId)

    // Navigate to shipping page
    router.push('/shipping')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#00263a' }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative" style={{ backgroundColor: '#00263a' }}>
      <AdminExportButton />
      <HelpIcon />
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">
            Select Your Kit
          </h1>
        </div>

        {kits.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <p className="text-gray-600">No kits available for this program.</p>
          </div>
        ) : (
          <>
            {/* 2x2 Grid of Kits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {kits.map((kit) => {
                const isSelected = selectedKitId === kit.id

                return (
                  <div
                    key={kit.id}
                    onClick={() => handleKitSelect(kit.id)}
                    className={`bg-white rounded-lg shadow-lg p-6 transition-all text-left relative ${
                      isSelected ? 'ring-4 ring-[#c8102e]' : ''
                    } hover:shadow-xl cursor-pointer`}
                  >
                    {/* Red checkmark in top right corner when selected */}
                    {isSelected && (
                      <div className="absolute top-4 right-4">
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="#c8102e"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          viewBox="0 0 24 24"
                        >
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    )}

                    {/* Kit Name - moved to top */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {kit.name}
                    </h3>

                    {/* Help text about clicking product names */}
                    {kit.kit_items && kit.kit_items.length > 0 && (
                      <p className="text-gray-500 text-xs mb-2 italic">
                        Click product names below to view thumbnails
                      </p>
                    )}

                    {/* Includes the following section */}
                    {kit.kit_items && kit.kit_items.length > 0 && (
                      <div className="mb-4">
                        <p className="text-gray-700 font-medium mb-2">Includes the following:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {kit.kit_items.map((item, index) => (
                            <li key={index} className="text-gray-600 text-sm">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleProductClick(item)
                                }}
                                className="text-[#c8102e] hover:underline cursor-pointer"
                              >
                                {item.name}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {error && (
              <p className="text-center text-red-400 mb-4">{error}</p>
            )}

            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={() => router.push('/tshirt-size')}
                className="px-6 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:ring-offset-2 font-medium"
                style={{ backgroundColor: '#c8102e' }}
              >
                ← Back
              </button>
              <button
                onClick={handleContinue}
                disabled={!selectedKitId}
                className="px-6 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:ring-offset-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#c8102e' }}
              >
                Continue to Shipping →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Product Thumbnail Modal */}
      {modalProduct && (
        <ProductThumbnailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          productName={modalProduct.name}
          thumbnailUrl={modalProduct.thumbnail_url}
        />
      )}
    </div>
  )
}


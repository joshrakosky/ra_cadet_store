'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ProgramLogo from '@/components/ProgramLogo'
import AdminExportButton from '@/components/AdminExportButton'
import HelpIcon from '@/components/HelpIcon'

type Program = 'RA' | 'LIFT'
type TShirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL' | '4XL'

interface TShirtProduct {
  id: string
  name: string
  thumbnail_url?: string
  available_sizes?: string[]
}

export default function TShirtSizePage() {
  const router = useRouter()
  const [program, setProgram] = useState<Program | null>(null)
  const [tshirtProduct, setTshirtProduct] = useState<TShirtProduct | null>(null)
  const [selectedSize, setSelectedSize] = useState<TShirtSize | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if user has selected a program
    const selectedProgram = sessionStorage.getItem('selectedProgram') as Program | null
    if (!selectedProgram || (selectedProgram !== 'RA' && selectedProgram !== 'LIFT')) {
      router.push('/program')
      return
    }

    setProgram(selectedProgram)
    loadTShirtProduct(selectedProgram)
  }, [router])

  const loadTShirtProduct = async (programType: Program) => {
    try {
      // Fetch RA t-shirt product (used for both RA and LIFT programs)
      const { data, error } = await supabase
        .from('ra_cadet_products')
        .select('id, name, thumbnail_url, available_sizes')
        .eq('category', 'tshirt')
        .eq('program', 'RA')
        .single()

      if (error) {
        console.error('Error loading t-shirt product:', error)
        if (error.code === 'PGRST116') {
          setError('T-shirt product not found. Please run the SQL script to add products.')
        } else {
          setError(`Error: ${error.message || 'Failed to load t-shirt product'}`)
        }
        return
      }

      if (!data) {
        setError('T-shirt product not found. Please run the SQL script to add products.')
        return
      }

      // Override thumbnail to always use RA-NH-TEE (for both RA and LIFT)
      const productWithThumbnail = {
        ...data,
        thumbnail_url: '/images/RA-NH-TEE.png'
      }

      setTshirtProduct(productWithThumbnail)
    } catch (err: any) {
      console.error('Exception loading t-shirt product:', err)
      setError(err.message || 'Failed to load t-shirt product')
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    if (!selectedSize) {
      setError('Please select a t-shirt size')
      return
    }

    // Store selected t-shirt size (backorders allowed, no inventory check needed)
    sessionStorage.setItem('tshirtSize', selectedSize)

    // Navigate to kit selection
    router.push('/kit-selection')
  }

  const sizes: TShirtSize[] = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#00263a' }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ backgroundColor: '#00263a' }}>
      <AdminExportButton />
      <HelpIcon />
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">
            Select Your T-Shirt Size
          </h1>
        </div>

        {tshirtProduct && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            {/* T-Shirt Thumbnail */}
            {tshirtProduct.thumbnail_url && (
              <div className="mb-4 flex justify-center">
                <img
                  src={tshirtProduct.thumbnail_url}
                  alt={tshirtProduct.name}
                  className="max-w-2xl w-full h-auto"
                  style={{ maxHeight: '600px' }}
                  onError={(e) => {
                    // Try alternative formats if PNG fails
                    const target = e.target as HTMLImageElement
                    const formats = ['jpg', 'svg', 'webp']
                    const currentSrc = target.src
                    const currentFormat = currentSrc.split('.').pop() || 'png'
                    const basePath = currentSrc.replace(`.${currentFormat}`, '')
                    const formatIndex = formats.indexOf(currentFormat)
                    
                    if (formatIndex < formats.length - 1) {
                      target.src = `${basePath}.${formats[formatIndex + 1]}`
                    }
                  }}
                />
              </div>
            )}

            {/* Size Selection */}
            <div className="mb-0">
              <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-2">
                Size *
              </label>
              <select
                id="size"
                value={selectedSize}
                onChange={(e) => {
                  const newSize = e.target.value as TShirtSize
                  setSelectedSize(newSize)
                  setError('')
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c8102e] focus:border-transparent text-black bg-white"
              >
                <option value="">Select a size</option>
                {sizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {error && (
          <p className="text-center text-red-400 mb-4">{error}</p>
        )}

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={() => router.push('/program')}
            className="px-6 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:ring-offset-2 font-medium"
            style={{ backgroundColor: '#c8102e' }}
          >
            ← Back
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedSize}
            className="px-6 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:ring-offset-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#c8102e' }}
          >
            Continue to Kit Selection →
          </button>
        </div>
      </div>
    </div>
  )
}


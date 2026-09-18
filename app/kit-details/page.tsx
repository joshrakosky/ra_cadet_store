'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import HelpIcon from '@/components/HelpIcon'
import {
  CADET_TSHIRT_SIZES,
  STANDARD_KIT_ITEMS,
  isCadetProgram,
  isCadetTshirtSize,
  type CadetKitItem,
  type CadetProgram,
  type CadetTshirtSize,
} from '@/lib/cadet-kits'

function KitItemCard({
  item,
  selectedSize,
  onSizeChange,
}: {
  item: CadetKitItem
  selectedSize: CadetTshirtSize | ''
  onSizeChange: (size: CadetTshirtSize | '') => void
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const [src, setSrc] = useState(item.thumbnail)

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 flex flex-col">
      {!imgFailed ? (
        <img
          src={src}
          alt={item.name}
          className="w-full aspect-square object-contain"
          onError={() => {
            if (item.thumbnailFallback && src !== item.thumbnailFallback) {
              setSrc(item.thumbnailFallback)
              return
            }
            setImgFailed(true)
          }}
        />
      ) : (
        <div className="aspect-square flex items-center justify-center">
          <span className="text-gray-400 text-sm px-4 text-center">{item.name}</span>
        </div>
      )}
      <p className="mt-3 text-center font-semibold text-gray-900">{item.name}</p>
      {item.sized && (
        <select
          id="tshirt-size"
          aria-label="T-shirt size"
          value={selectedSize}
          onChange={(e) => onSizeChange(e.target.value as CadetTshirtSize | '')}
          className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#c8102e] focus:border-transparent text-black bg-white text-sm"
        >
          <option value="">Select size</option>
          {CADET_TSHIRT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}

export default function KitDetailsPage() {
  const router = useRouter()
  const [program, setProgram] = useState<CadetProgram | null>(null)
  const [selectedSize, setSelectedSize] = useState<CadetTshirtSize | ''>('')
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const selectedProgram = sessionStorage.getItem('selectedProgram')
    if (!isCadetProgram(selectedProgram)) {
      router.push('/program')
      return
    }

    setProgram(selectedProgram)
    const savedSize = sessionStorage.getItem('tshirtSize')
    if (isCadetTshirtSize(savedSize)) {
      setSelectedSize(savedSize)
    }
    setReady(true)
  }, [router])

  const handleContinue = () => {
    if (program === 'Maintenance') {
      setError('Maintenance (MX) kit details are coming soon.')
      return
    }
    if (!selectedSize) {
      setError('Please select a t-shirt size')
      return
    }

    sessionStorage.setItem('tshirtSize', selectedSize)
    router.push('/shipping')
  }

  if (!ready || !program) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#00263a' }}>
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  const isStandard = program === 'Standard'

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative py-12" style={{ backgroundColor: '#00263a' }}>
      <HelpIcon />
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Kit Details</h1>
          <p className="text-white/80">
            {isStandard ? 'Standard Cadet Kit' : 'Maintenance (MX) Cadet Kit'}
          </p>
        </div>

        {isStandard ? (
          <div className="grid grid-cols-2 gap-4 md:gap-6 mb-6">
            {STANDARD_KIT_ITEMS.map((item) => (
              <KitItemCard
                key={item.sku}
                item={item}
                selectedSize={selectedSize}
                onSizeChange={(size) => {
                  setSelectedSize(size)
                  setError('')
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <p className="text-gray-700">
              Maintenance (MX) cadet kit contents are coming soon. Please choose Standard for now, or check back later.
            </p>
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
            disabled={isStandard ? !selectedSize : true}
            className="px-6 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:ring-offset-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#c8102e' }}
          >
            Continue to Shipping →
          </button>
        </div>
      </div>
    </div>
  )
}

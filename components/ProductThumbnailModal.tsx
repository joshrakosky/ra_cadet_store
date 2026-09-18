'use client'

import { useEffect } from 'react'

interface ProductThumbnailModalProps {
  isOpen: boolean
  onClose: () => void
  productName: string
  thumbnailUrl?: string
}

export default function ProductThumbnailModal({
  isOpen,
  onClose,
  productName,
  thumbnailUrl
}: ProductThumbnailModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  // Try different image formats
  const imageFormats = ['png', 'jpg', 'jpeg', 'webp']
  const basePath = thumbnailUrl?.replace(/\.(png|jpg|jpeg|webp)$/i, '') || ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-white bg-opacity-20 p-4"
      onClick={onClose}
      style={{
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)'
      }}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">{productName}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Image */}
        <div className="p-6 flex justify-center">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={productName}
              className="max-w-full h-auto max-h-[70vh] object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                const currentSrc = target.src
                const formatIndex = imageFormats.findIndex((format) =>
                  currentSrc.toLowerCase().endsWith(`.${format}`)
                )
                if (formatIndex < imageFormats.length - 1 && basePath) {
                  target.src = `${basePath}.${imageFormats[formatIndex + 1]}`
                }
              }}
            />
          ) : (
            <div className="text-gray-400 text-center py-12">
              <p>No image available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-white rounded-md hover:opacity-90 font-medium"
            style={{ backgroundColor: '#c8102e' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}


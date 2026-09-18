// RA Logo Component for Landing Page
// Displays the RA logo image
// Supports multiple formats: .png, .jpg, .svg, .webp

'use client'

import { useState } from 'react'

interface RALogoProps {
  className?: string
}

export default function RALogo({ className = '' }: RALogoProps) {
  const [imageError, setImageError] = useState(false)
  
  // Try different image formats
  const imageFormats = ['png', 'jpg', 'svg', 'webp']
  const [currentFormat, setCurrentFormat] = useState(0)
  
  const imageSrc = `/images/RA-Logo.${imageFormats[currentFormat]}`
  
  const handleError = () => {
    if (currentFormat < imageFormats.length - 1) {
      // Try next format
      setCurrentFormat(currentFormat + 1)
    } else {
      // All formats failed, show text fallback
      setImageError(true)
    }
  }
  
  if (imageError) {
    // Fallback to text if image not found
    return (
      <h1 className={`text-4xl font-bold text-gray-900 mb-2 ${className}`}>
        Republic Airways
      </h1>
    )
  }
  
  return (
    <img 
      src={imageSrc}
      alt="Republic Airways" 
      className={`h-4 max-w-full ${className}`}
      onError={handleError}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  )
}


// Program Logo Component
// Displays the RA or LIFT logo based on selected program
// Supports multiple formats: .png, .jpg, .svg, .webp

'use client'

import { useState } from 'react'

type Program = 'RA' | 'LIFT'

interface ProgramLogoProps {
  program: Program
  className?: string
}

export default function ProgramLogo({ program, className = '' }: ProgramLogoProps) {
  const [imageError, setImageError] = useState(false)
  
  // Try different image formats
  const imageFormats = ['png', 'jpg', 'svg', 'webp']
  const [currentFormat, setCurrentFormat] = useState(0)
  
  // Logo filename based on program
  const logoName = program === 'RA' ? 'RA-Logo' : 'LIFT-Logo'
  const imageSrc = `/images/${logoName}.${imageFormats[currentFormat]}`
  
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
      <div className={`font-bold text-white ${className}`} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', letterSpacing: '-0.02em' }}>
        {program === 'RA' ? 'Republic Airways' : 'LIFT Academy'}
      </div>
    )
  }
  
  return (
    <img 
      src={imageSrc}
      alt={program === 'RA' ? 'Republic Airways' : 'LIFT Academy'} 
      className={className}
      onError={handleError}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  )
}


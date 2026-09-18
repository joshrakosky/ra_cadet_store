'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import HelpIcon from '@/components/HelpIcon'
import { isCadetProgram, type CadetProgram } from '@/lib/cadet-kits'

export default function ProgramSelectionPage() {
  const router = useRouter()
  const [selectedProgram, setSelectedProgram] = useState<CadetProgram | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const userCode = sessionStorage.getItem('userCode')
    if (!userCode) {
      router.push('/')
      return
    }

    const saved = sessionStorage.getItem('selectedProgram')
    if (isCadetProgram(saved)) {
      setSelectedProgram(saved)
    }
  }, [router])

  const handleContinue = () => {
    if (!selectedProgram) {
      setError('Please select a kit type')
      return
    }

    sessionStorage.setItem('selectedProgram', selectedProgram)
    router.push('/kit-details')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ backgroundColor: '#00263a' }}>
      <HelpIcon />
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Select Your Kit
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            type="button"
            onClick={() => {
              setSelectedProgram('Standard')
              setError('')
            }}
            className={`bg-white rounded-lg shadow-lg p-10 min-h-[220px] hover:shadow-xl transition-all ${
              selectedProgram === 'Standard' ? 'ring-4 ring-[#c8102e]' : ''
            }`}
          >
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="text-3xl font-bold tracking-tight" style={{ color: '#00263a' }}>
                Standard
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedProgram('Maintenance')
              setError('')
            }}
            className={`bg-white rounded-lg shadow-lg p-10 min-h-[220px] hover:shadow-xl transition-all ${
              selectedProgram === 'Maintenance' ? 'ring-4 ring-[#c8102e]' : ''
            }`}
          >
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="text-3xl font-bold tracking-tight" style={{ color: '#00263a' }}>
                Maintenance
              </span>
            </div>
          </button>
        </div>

        {error && (
          <p className="text-center text-red-400 mb-4">{error}</p>
        )}

        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-6 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:ring-offset-2 font-medium"
            style={{ backgroundColor: '#c8102e' }}
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selectedProgram}
            className="px-6 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:ring-offset-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#c8102e' }}
          >
            Continue to Kit Details →
          </button>
        </div>
      </div>
    </div>
  )
}

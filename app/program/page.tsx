'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import ProgramLogo from '@/components/ProgramLogo'
import AdminExportButton from '@/components/AdminExportButton'
import HelpIcon from '@/components/HelpIcon'

type Program = 'RA' | 'LIFT'

export default function ProgramSelectionPage() {
  const router = useRouter()
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if user has a valid code
    const userCode = sessionStorage.getItem('userCode')
    if (!userCode) {
      router.push('/')
      return
    }
  }, [router])

  const handleProgramSelect = (program: Program) => {
    setSelectedProgram(program)
    setError('')
  }

  const handleContinue = () => {
    if (!selectedProgram) {
      setError('Please select a program')
      return
    }

    // Store selected program
    sessionStorage.setItem('selectedProgram', selectedProgram)

    // Navigate to t-shirt size selection
    router.push('/tshirt-size')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ backgroundColor: '#00263a' }}>
      <AdminExportButton />
      <HelpIcon />
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Select Your Program
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Republic Airways Option */}
          <button
            onClick={() => handleProgramSelect('RA')}
            className={`bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all ${
              selectedProgram === 'RA' ? 'ring-4 ring-[#c8102e]' : ''
            }`}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mb-4">
                <ProgramLogo program="RA" className="h-32" />
              </div>
            </div>
          </button>

          {/* LIFT Academy Option */}
          <button
            onClick={() => handleProgramSelect('LIFT')}
            className={`bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all ${
              selectedProgram === 'LIFT' ? 'ring-4 ring-[#c8102e]' : ''
            }`}
          >
            <div className="flex flex-col items-center justify-center h-full">
              <div className="mb-4">
                <ProgramLogo program="LIFT" className="h-32" />
              </div>
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
            onClick={handleContinue}
            disabled={!selectedProgram}
            className="px-6 py-2 text-white rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:ring-offset-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#c8102e' }}
          >
            Continue to T-Shirt Selection →
          </button>
        </div>
      </div>
    </div>
  )
}


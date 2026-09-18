'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import HelpIcon from '@/components/HelpIcon'
import RALogo from '@/components/RALogo'
import { supabase } from '@/lib/supabase'

const ADMIN_CODE = 'ADMIN'

export default function LandingPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code) {
      setError('Please enter your access code')
      return
    }

    // Normalize code to uppercase
    const normalizedCode = code.toUpperCase().trim()

    setLoading(true)

    // Check if admin code first (ADMIN is 5 letters, special case)
    if (normalizedCode === ADMIN_CODE) {
      sessionStorage.setItem('userCode', normalizedCode)
      sessionStorage.setItem('adminAuth', 'true')
      router.push('/admin')
      return
    }

    // Validate code format (6 capital letters for regular users)
    if (!/^[A-Z]{6}$/.test(normalizedCode)) {
      setError('Code must be exactly 6 capital letters')
      setLoading(false)
      return
    }

    // Check if code exists in access codes table and is not used
    const { data: accessCode, error: codeCheckError } = await supabase
      .from('ra_cadet_access_codes')
      .select('id, used')
      .eq('code', normalizedCode)
      .single()

    // If code exists in access codes table, check if it's been used
    if (accessCode && accessCode.used) {
      setError('This code has already been used.')
      setLoading(false)
      return
    }

    // Check if code has already been used in an order (one order per code)
    const { data: existingOrder, error: checkError } = await supabase
      .from('ra_cadet_orders')
      .select('id')
      .eq('code', normalizedCode)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is fine
      console.error('Error checking code:', checkError)
      setError('Error validating code. Please try again.')
      setLoading(false)
      return
    }

    if (existingOrder) {
      setError('This code has already been used. Each code can only be used once.')
      setLoading(false)
      return
    }

    // Store user code and clear admin auth for regular users
    sessionStorage.setItem('userCode', normalizedCode)
    sessionStorage.removeItem('adminAuth')

    // Navigate to program selection page
    router.push('/program')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ backgroundColor: '#00263a' }}>
      <HelpIcon />
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="mb-3 flex justify-center">
            <RALogo className="max-w-[100px]" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Cadet Kits
          </h2>
          <p className="text-gray-600">
            Enter your 6-letter access code to begin
          </p>
        </div>

        <form onSubmit={handleStart} className="space-y-6">
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Access Code
            </label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => {
                // Only allow letters, convert to uppercase, limit to 6 characters (or allow ADMIN which is 5)
                const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6)
                setCode(value)
                setError('')
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#c8102e] focus:border-transparent text-black bg-white text-center text-2xl font-mono tracking-widest"
              placeholder="ABCDEF"
              maxLength={6}
              required
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white py-3 px-4 rounded-md hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#c8102e] focus:ring-offset-2 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#c8102e' }}
          >
            {loading ? 'Validating...' : 'Continue →'}
          </button>
        </form>
      </div>
    </div>
  )
}

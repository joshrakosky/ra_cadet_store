'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Old new-hires size route — cadet flow uses /kit-details. */
export default function TShirtSizeRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/kit-details')
  }, [router])
  return null
}

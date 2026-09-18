'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** Old new-hires kit picker — cadet kits are fixed per program on /kit-details. */
export default function KitSelectionRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/kit-details')
  }, [router])
  return null
}

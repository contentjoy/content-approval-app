'use client'

import React, { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useBranding } from '@/contexts/branding-context'

export function GymSlugHandler() {
  const searchParams = useSearchParams()
  const { setGymSlug } = useBranding()

  useEffect(() => {
    const gymSlug = searchParams.get('gymSlug')
    if (gymSlug) {
      setGymSlug(gymSlug)
    }
  }, [searchParams, setGymSlug])

  return null
}

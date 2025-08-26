'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { getGymBySlug, getAgencyBranding } from '@/lib/database'

interface BrandingData {
  whiteLogo: string | null
  blackLogo: string | null
  agencyLogo: string | null
  primaryColor: string | null
  agencyName: string | null
  gymName: string | null
  gymPrimaryColor: string | null
  isLoading: boolean
  error: string | null
}

interface BrandingContextType extends BrandingData {
  setGymSlug: (slug: string) => void
  refreshBranding: () => void
}

const BrandingContext = createContext<BrandingContextType | undefined>(undefined)

interface BrandingProviderProps {
  children: ReactNode
  initialGymSlug?: string
}

export function BrandingProvider({ children, initialGymSlug }: BrandingProviderProps) {
  const [gymSlug, setGymSlug] = useState<string | null>(initialGymSlug || null)
  const [brandingData, setBrandingData] = useState<BrandingData>({
    whiteLogo: null,
    blackLogo: null,
    agencyLogo: null,
    primaryColor: null,
    agencyName: null,
    gymName: null,
    gymPrimaryColor: null,
    isLoading: false,
    error: null
  })

  const lightenColor = useCallback((hex: string, percent: number): string => {
    const num = parseInt(hex.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent * 100)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
  }, [])

  const darkenColor = useCallback((hex: string, percent: number): string => {
    const num = parseInt(hex.replace('#', ''), 16)
    const amt = Math.round(2.55 * percent * 100)
    const R = (num >> 16) - amt
    const G = (num >> 8 & 0x00FF) - amt
    const B = (num & 0x0000FF) - amt
    return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
      (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
      (B > 255 ? 255 : B < 0 ? 0 : B)).toString(16).slice(1)
  }, [])

  const applyBrandingToCSS = useCallback((data: BrandingData) => {
    // No need to set custom CSS variables anymore since we're using shadcn tokens
    // We'll keep the validation logic for the data but not apply any CSS variables
    if (data.primaryColor) {
      const hexColor = data.primaryColor.trim()
      if (!/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
        console.warn('Invalid hex color format:', hexColor, 'using default color')
        data.primaryColor = '#6B7280' // fallback to default
      }
    }

    if (data.gymPrimaryColor) {
      const gymHexColor = data.gymPrimaryColor.trim()
      if (!/^#[0-9A-Fa-f]{6}$/.test(gymHexColor)) {
        console.warn('Invalid gym hex color format:', gymHexColor, 'using primary color')
        data.gymPrimaryColor = data.primaryColor || '#6B7280'
      }
    }
  }, [])

  const fetchBranding = useCallback(async (slug: string) => {
    setBrandingData((prev: BrandingData) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Get gym by slug
      const gym = await getGymBySlug(slug)
      
      if (!gym) {
        throw new Error(`Gym not found: ${slug}`)
      }

      // Get agency branding
      const agency = await getAgencyBranding(gym['Agency'])
      
      if (!agency) {
        throw new Error(`Agency not found: ${gym['Agency']}`)
      }

      const newBrandingData: BrandingData = {
        whiteLogo: (gym as any)['White Logo URL'] || null,
        blackLogo: (gym as any)['Black Logo URL'] || null,
        agencyLogo: agency['Logo'],
        primaryColor: agency['Primary Color'],
        agencyName: agency['Partner name'],
        gymName: gym['Gym Name'],
        gymPrimaryColor: (gym as any)['Primary color'] || null,
        isLoading: false,
        error: null
      }

      console.log('🎨 Branding data fetched:', {
        gymSlug: slug,
        gym: gym,
        agency: agency,
        brandingData: newBrandingData
      })

      setBrandingData(newBrandingData)

      // Apply CSS custom properties for dynamic colors
      applyBrandingToCSS(newBrandingData)

    } catch (error) {
      console.error('Error fetching branding:', error)
      setBrandingData((prev: BrandingData) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load branding'
      }))
    }
  }, [applyBrandingToCSS])

  const handleSetGymSlug = useCallback((slug: string) => {
    console.log('🏋️ Setting gym slug in branding context:', slug)
    setGymSlug(slug)
    fetchBranding(slug)
  }, [fetchBranding])

  const refreshBranding = useCallback(() => {
    if (gymSlug) {
      fetchBranding(gymSlug)
    }
  }, [gymSlug, fetchBranding])

  useEffect(() => {
    if (gymSlug) {
      fetchBranding(gymSlug)
    }
  }, [gymSlug, fetchBranding])

  const contextValue: BrandingContextType = {
    ...brandingData,
    setGymSlug: handleSetGymSlug,
    refreshBranding
  }

  return (
    <BrandingContext.Provider value={contextValue}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  const context = useContext(BrandingContext)
  if (context === undefined) {
    throw new Error('useBranding must be used within a BrandingProvider')
  }
  return context
}

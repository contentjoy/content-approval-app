'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { getGymBySlug, getAgencyBranding } from '@/lib/database'

interface BrandingData {
  logo: string | null
  primaryColor: string | null
  agencyName: string | null
  gymName: string | null
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
    logo: null,
    primaryColor: null,
    agencyName: null,
    gymName: null,
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
    const root = document.documentElement
    
    if (data.primaryColor) {
      // Convert hex to RGB for CSS custom properties
      const hex = data.primaryColor.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16)
      const g = parseInt(hex.substr(2, 2), 16)
      const b = parseInt(hex.substr(4, 2), 16)
      
      root.style.setProperty('--brand-primary', data.primaryColor)
      root.style.setProperty('--brand-primary-rgb', `${r}, ${g}, ${b}`)
      root.style.setProperty('--brand-primary-light', lightenColor(data.primaryColor, 0.1))
      root.style.setProperty('--brand-primary-dark', darkenColor(data.primaryColor, 0.1))
    } else {
      // Default colors if no branding
      root.style.setProperty('--brand-primary', '#3b82f6')
      root.style.setProperty('--brand-primary-rgb', '59, 130, 246')
      root.style.setProperty('--brand-primary-light', '#60a5fa')
      root.style.setProperty('--brand-primary-dark', '#2563eb')
    }
  }, [lightenColor, darkenColor])

  const fetchBranding = useCallback(async (slug: string) => {
    setBrandingData(prev => ({ ...prev, isLoading: true, error: null }))

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
        logo: agency['Logo'],
        primaryColor: agency['Primary Color'],
        agencyName: agency['Partner name'],
        gymName: gym['Gym Name'],
        isLoading: false,
        error: null
      }

      setBrandingData(newBrandingData)

      // Apply CSS custom properties for dynamic colors
      applyBrandingToCSS(newBrandingData)

    } catch (error) {
      console.error('Error fetching branding:', error)
      setBrandingData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load branding'
      }))
    }
  }, [applyBrandingToCSS])

  const handleSetGymSlug = useCallback((slug: string) => {
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

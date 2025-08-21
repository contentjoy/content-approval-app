'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import { BrandingProvider, useBranding } from '@/contexts/branding-context'
import { ToastProvider } from '@/contexts/toast-context'
// import { getGymBySlug } from '@/lib/database' // Temporarily unused
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
// Sidebar removed in favor of horizontal nav
import { HorizontalNav } from '../../components/layout/horizontal-nav'

interface GymLayoutProps {
  children: React.ReactNode
}

function GymLayoutContent({ children }: GymLayoutProps) {
  const { gymSlug } = useParams()
  const { error, setGymSlug } = useBranding() // isLoading temporarily unused
  const didSetRef = useRef(false)
  const [isValidGym, setIsValidGym] = useState<boolean | null>(true) // Temporarily start as true to skip loading

  // Ensure the gym slug is set in the branding context
  useEffect(() => {
    if (!didSetRef.current && typeof gymSlug === 'string') {
      didSetRef.current = true
      console.log('🏋️ Setting gym slug in branding context (once):', gymSlug)
      setGymSlug(gymSlug)
    }
  }, [gymSlug, setGymSlug])

  useEffect(() => {
    // Temporarily skip gym validation to fix UI loading issue
    // TODO: Fix getGymBySlug function for proper gym validation
    console.log('🔧 Temporarily skipping gym validation for slug:', gymSlug)
    setIsValidGym(true)
    
    // const validateGym = async () => {
    //   if (typeof gymSlug === 'string') {
    //     try {
    //       const gymData = await getGymBySlug(gymSlug)
    //       if (gymData) {
    //         setIsValidGym(true)
    //       } else {
    //         setIsValidGym(false)
    //       }
    //     } catch (error) {
    //       console.error('Error validating gym:', error)
    //       setIsValidGym(false)
    //     }
    //   }
    // }

    // validateGym()
  }, [gymSlug])

  // Show loading state while validating gym
  if (isValidGym === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-text">Loading gym...</p>
        </div>
      </div>
    )
  }

  // Show 404 if gym not found
  if (isValidGym === false) {
    notFound()
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-destructive mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text mb-2">Error Loading Gym</h2>
            <p className="text-muted-text mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-accent text-background rounded-full hover:bg-accent/90"
            >
              Try Again
            </button>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <HorizontalNav />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default function GymLayout({ children }: GymLayoutProps) {
  const { gymSlug } = useParams()

  return (
    <BrandingProvider initialGymSlug={typeof gymSlug === 'string' ? gymSlug : undefined}>
      <ToastProvider>
        <GymLayoutContent>
          {children}
        </GymLayoutContent>
      </ToastProvider>
    </BrandingProvider>
  )
}
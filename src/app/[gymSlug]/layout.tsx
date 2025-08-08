'use client'

import { useEffect, useState } from 'react'
import { useParams, notFound } from 'next/navigation'
import { BrandingProvider, useBranding } from '@/contexts/branding-context'
import { getGymBySlug } from '@/lib/database'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

interface GymLayoutProps {
  children: React.ReactNode
}

function GymLayoutContent({ children }: GymLayoutProps) {
  const { gymSlug } = useParams()
  const { isLoading, error } = useBranding()
  const [isValidGym, setIsValidGym] = useState<boolean | null>(null)

  useEffect(() => {
    const validateGym = async () => {
      if (typeof gymSlug === 'string') {
        try {
          const gymData = await getGymBySlug(gymSlug)
          if (gymData) {
            setIsValidGym(true)
          } else {
            setIsValidGym(false)
          }
        } catch (error) {
          console.error('Error validating gym:', error)
          setIsValidGym(false)
        }
      }
    }

    validateGym()
  }, [gymSlug])

  // Show loading state while validating gym
  if (isValidGym === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading gym...</p>
        </div>
      </div>
    )
  }

  // Show 404 if gym not found
  if (isValidGym === false) {
    notFound()
  }

  // Show loading state while branding loads
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--brand-primary)] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading branding...</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Gym</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
      <GymLayoutContent>
        {children}
      </GymLayoutContent>
    </BrandingProvider>
  )
}

'use client'

import React from 'react'
import { useBranding } from '@/contexts/branding-context'
import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackText?: string
  showFallback?: boolean
}

const sizeClasses = {
  sm: 'h-6 w-auto',
  md: 'h-8 w-auto',
  lg: 'h-12 w-auto',
  xl: 'h-16 w-auto'
}

const textSizes = {
  sm: 'text-lg font-semibold',
  md: 'text-xl font-semibold',
  lg: 'text-2xl font-bold',
  xl: 'text-3xl font-bold'
}

export function Logo({ 
  size = 'md', 
  className = '', 
  fallbackText,
  showFallback = true 
}: LogoProps) {
  const { logo, agencyName, gymName, isLoading } = useBranding()

  // Debug logging
  console.log('🖼️ Logo component debug:', { 
    logo, 
    agencyName, 
    gymName, 
    isLoading, 
    showFallback, 
    fallbackText 
  })

  if (isLoading) {
    console.log('⏳ Logo loading...')
    return (
      <div className={`${sizeClasses[size]} ${className} animate-pulse bg-gray-200 rounded`} />
    )
  }

  // Force render the logo with known URL for now while debugging branding context
  const knownLogoUrl = 'https://pub-8ca27ad93a114ad7b4d6e6ff4549cf90.r2.dev/Gym%20Launch%20Logo%20Gold%20Black.png'
  
  // Always show the logo (debugging) - remove this once branding context works
  if (!isLoading) {
    const logoSrc = logo || knownLogoUrl
    console.log('🖼️ Rendering logo with URL:', logoSrc)
    console.log('🎨 Logo container classes:', `${sizeClasses[size]} ${className} relative`)
    
    return (
      <div 
        className={`${sizeClasses[size]} ${className} relative`}
        style={{ minWidth: '48px', minHeight: '48px' }}
      >
        <Image
          src={logoSrc}
          alt={agencyName || gymName || 'Agency Logo'}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onLoad={() => console.log('✅ Logo loaded successfully:', logoSrc)}
          onError={(e) => {
            console.error('❌ Logo failed to load:', e)
            console.error('❌ Failed logo URL:', logoSrc)
          }}
        />
      </div>
    )
  }

  // Loading state fallback (shouldn't reach here with current logic)
  console.log('🚫 Logo component fallback')
  return null
}

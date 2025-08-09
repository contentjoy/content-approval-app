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

  // If we have a logo, display it
  if (logo) {
    console.log('✅ Rendering logo:', logo)
    return (
      <div className={`${sizeClasses[size]} ${className} relative`}>
        <Image
          src={logo}
          alt={agencyName || gymName || 'Logo'}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onLoad={() => console.log('✅ Logo image loaded successfully')}
          onError={(e) => {
            console.error('❌ Logo image failed to load:', e)
            console.error('❌ Failed logo URL:', logo)
          }}
        />
      </div>
    )
  }

  // Fallback to text if no logo or if showFallback is true
  if (showFallback && fallbackText !== '') {
    const displayText = fallbackText || agencyName || gymName || 'ContentJoy'
    console.log('📝 Using text fallback:', displayText)
    return (
      <div className={`${textSizes[size]} ${className} font-semibold text-gray-900`}>
        {displayText}
      </div>
    )
  }

  console.log('🚫 Logo component returning null')
  return null
}

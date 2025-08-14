'use client'

import React from 'react'
import { useBranding } from '@/contexts/branding-context'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  fallbackText?: string
  showFallback?: boolean
  useDarkLogo?: boolean
}

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-12 w-12'
}

// textSizes removed as it's unused in current implementation

export function Logo({
  size = 'md',
  fallbackText,
  showFallback = true,
  className = '',
  useDarkLogo = false
}: LogoProps) {
  const { whiteLogo, blackLogo, agencyLogo, agencyName, gymName, isLoading } = useBranding()
  
  // Prioritize agency logo, then gym logos, then fallback
  const logoSrc = agencyLogo || (useDarkLogo ? (blackLogo || whiteLogo) : (whiteLogo || blackLogo))
  
  if (isLoading) {
    return <div className={`animate-pulse bg-muted rounded ${sizeClasses[size]}`} />
  }

  if (logoSrc) {
    // If it's an agency logo, wrap it in a themed frame
    if (agencyLogo && logoSrc === agencyLogo) {
      return (
        <div 
          className={`${sizeClasses[size]} bg-surface rounded-lg p-2 flex items-center justify-center ${className}`}
        >
          <img
            src={logoSrc}
            alt={agencyName || 'Agency Logo'}
            className="h-[65%] w-[65%] object-contain"
          />
        </div>
      )
    }
    
    // Regular logo display (gym logos, etc.)
    return (
      <img
        src={logoSrc}
        alt={agencyName || gymName || 'Logo'}
        className={`${sizeClasses[size]} ${className}`}
      />
    )
  }

  // Fallback: show first letter in a circle with brand color
  if (showFallback && (agencyName || gymName)) {
    const displayName = agencyName || gymName
    if (displayName) {
      const firstLetter = displayName.charAt(0).toUpperCase()
      
      return (
        <div 
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white ${className}`}
          style={{ backgroundColor: 'var(--primary-color, #000000)' }}
        >
          {firstLetter}
        </div>
      )
    }
  }

  if (fallbackText) {
    return (
      <span className={`font-bold text-foreground ${sizeClasses[size]} ${className}`}>
        {fallbackText}
      </span>
    )
  }

  return null
}

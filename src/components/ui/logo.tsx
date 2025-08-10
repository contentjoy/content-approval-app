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
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10',
  xl: 'h-12 w-12'
}

// textSizes removed as it's unused in current implementation

export function Logo({ 
  size = 'md', 
  className = '', 
  fallbackText,
  showFallback = true 
}: LogoProps) {
  const { logo, agencyName, gymName, isLoading } = useBranding()

  if (isLoading) {
    return (
      <div className={`${sizeClasses[size]} ${className} animate-pulse bg-bg-elev-1 rounded-lg`} />
    )
  }
  const logoSrc = logo || ''
  return (
    <div className={`${sizeClasses[size]} ${className} relative rounded-lg bg-[color:var(--bg-elev-1)] overflow-hidden`}>
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt={agencyName || gymName || 'Agency Logo'}
          fill
          className="object-contain p-1.5"
          sizes="64px"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-muted-text">
          {agencyName?.[0] || 'A'}
        </div>
      )}
    </div>
  )
}

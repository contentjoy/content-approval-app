'use client'

import React from 'react'
import { Plus, Calendar } from 'lucide-react'
import { BrandedButton } from '@/components/ui/branded-button'
import { Logo } from '@/components/ui/logo'
import { CompactProgress } from '@/components/ui/compact-progress'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useBranding } from '@/contexts/branding-context'
import { usePostStats } from '@/hooks/use-post-stats'
import { useParams } from 'next/navigation'

export function Header() {
  const { gymName, isLoading } = useBranding()
  const params = useParams()
  const gymSlug = typeof params.gymSlug === 'string' ? params.gymSlug : null
  const { total, approved } = usePostStats(gymSlug)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/60">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left side: Logo + Gym Name */}
        <div className="flex items-center space-x-3">
          <Logo size="md" fallbackText="" showFallback={false} />
          <div className="flex items-center space-x-2">
            <div className="w-px h-4 bg-border"></div>
            <span className="text-sm font-medium text-muted-text">
              {isLoading ? 'Loading...' : gymName || 'Gym Name'}
            </span>
          </div>
        </div>
        
        {/* Right side: Progress + Actions + Theme Toggle */}
        <div className="flex items-center space-x-4">
          {/* Compact Progress Meter */}
          <CompactProgress 
            approved={approved} 
            total={total} 
            goal={30}
            className="hidden md:flex"
          />
          
          {/* Upload Content Button */}
          <BrandedButton 
            variant="outline" 
            size="sm"
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </BrandedButton>
          
          {/* Schedule Posts Button */}
          <BrandedButton 
            variant="outline" 
            size="sm"
            className="flex items-center space-x-2"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule ({approved})</span>
          </BrandedButton>

          {/* Theme Toggle */}
          <ThemeToggle variant="icon" size="sm" />
        </div>
      </div>
    </header>
  )
}

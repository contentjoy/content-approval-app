'use client'

import React from 'react'
import Link from 'next/link'
import { Plus, Upload, Calendar } from 'lucide-react'
import { BrandedButton } from '@/components/ui/branded-button'
import { Logo } from '@/components/ui/logo'
import { CompactProgress } from '@/components/ui/compact-progress'
import { useBranding } from '@/contexts/branding-context'
import { usePostStats } from '@/hooks/use-post-stats'
import { useParams } from 'next/navigation'

export function Header() {
  const { gymName, isLoading } = useBranding()
  const params = useParams()
  const gymSlug = typeof params.gymSlug === 'string' ? params.gymSlug : null
  const { total, approved, pending, isLoading: statsLoading } = usePostStats(gymSlug)

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left side: Logo + Gym Name */}
        <div className="flex items-center space-x-3">
          <Logo size="md" fallbackText="" showFallback={false} />
          <div className="flex items-center space-x-2">
            <div className="w-px h-4 bg-gray-300"></div>
            <span className="text-sm font-medium text-gray-700">
              {isLoading ? 'Loading...' : gymName || 'Gym Name'}
            </span>
          </div>
        </div>
        
        {/* Right side: Progress + Actions */}
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
            variant="secondary" 
            size="sm"
            className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Upload</span>
          </BrandedButton>
          
          {/* Schedule Posts Button */}
          <BrandedButton 
            variant="secondary" 
            size="sm"
            className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule ({approved})</span>
          </BrandedButton>
        </div>
      </div>
    </header>
  )
}

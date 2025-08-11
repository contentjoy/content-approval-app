'use client'

import React from 'react'
import { Plus, Calendar, Menu } from 'lucide-react'
import { BrandedButton } from '@/components/ui/branded-button'
import { Logo } from '@/components/ui/logo'
import { CompactProgress } from '@/components/ui/compact-progress'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useBranding } from '@/contexts/branding-context'
import { usePostStats } from '@/hooks/use-post-stats'
import { useParams } from 'next/navigation'
import { useModalStore } from '@/hooks/use-modal-store'

export function Header() {
  const { gymName, isLoading } = useBranding()
  const params = useParams()
  const gymSlug = typeof params.gymSlug === 'string' ? params.gymSlug : null
  const { total, approved } = usePostStats(gymSlug)
  const { openModal, approvedPosts } = useModalStore()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-bg">
      <div className="mx-auto w-full px-3 sm:px-4 md:px-5 lg:px-6 2xl:px-8 py-3 flex items-center justify-between">
        {/* Left side: Mobile hamburger + Logo + Gym Name */}
        <div className="flex items-center space-x-3">
          <button
            className="md:hidden p-2 rounded-md border border-border text-text hover:bg-bg-elev-1"
            aria-label="Open navigation"
            onClick={() => {
              const event = new CustomEvent('sidebar-toggle', { detail: { open: true } })
              window.dispatchEvent(event)
            }}
          >
            <Menu className="h-5 w-5" />
          </button>
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
            onClick={() => approvedPosts.length > 0 && openModal('schedule', null, [], approvedPosts)}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule ({approved})</span>
          </BrandedButton>

          {/* Theme Toggle hidden on mobile (moved into profile popout) */}
          <div className="hidden md:block">
            <ThemeToggle variant="icon" size="sm" />
          </div>
        </div>
      </div>
    </header>
  )
}

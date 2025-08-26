'use client'

import React, { useMemo } from 'react'
import { Plus, Calendar, Menu, X } from 'lucide-react'
import { BrandedButton } from '@/components/ui/branded-button'
import { Logo } from '@/components/ui/logo'
import { CompactProgress } from '@/components/ui/compact-progress'
import { useBranding } from '@/contexts/branding-context'
import { usePostStats } from '@/hooks/use-post-stats'
import { useParams, usePathname } from 'next/navigation'
import { useModalStore } from '@/hooks/use-modal-store'
import { motion } from 'framer-motion'
import { HorizontalNav } from './horizontal-nav'
import { ProfileMenu } from './profile-menu'
import { useAuth } from '@/contexts/auth-context'
import SettingsModal from '@/components/modals/settings-modal'
import { useState } from 'react'

export function ClientHeader() {
  const { gymName, isLoading } = useBranding()
  const { user } = useAuth()
  const { openModal, approvedPosts } = useModalStore()
  
  // Get gym slug from URL
  const gymSlug = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : null
  const { approved, total } = usePostStats(gymSlug)
  
  const [profileOpen, setProfileOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const menuVariants = {
    open: { rotate: 90 },
    closed: { rotate: 0 }
  }

  const handleUploadClick = () => {
    openModal('upload')
  }

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="mx-auto w-full px-3 sm:px-4 md:px-5 lg:px-6 2xl:px-8 py-3 flex items-center justify-between text-foreground">
        {/* Left: Logo + Gym Name */}
        <div className="flex items-center space-x-3">
          <Logo size="md" fallbackText="" showFallback={false} />
          <div className="flex items-center space-x-2">
            <div className="w-px h-4 bg-border"></div>
            <span className="text-sm font-medium text-foreground/80">
              {isLoading ? 'Loading...' : gymName || 'Gym Name'}
            </span>
          </div>
        </div>
        
        {/* Right side: Progress + Actions + Profile */}
        <div className="flex items-center space-x-4">
          {/* Compact Progress Meter */}
          <CompactProgress 
            approved={approved} 
            total={total} 
            goal={30}
            className="hidden md:flex"
          />
          
          {/* Upload Content Button - inline standard */}
          <button 
            className="inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium text-foreground hover:text-foreground border border-border rounded-full hover:bg-accent hover:border-primary transition-all duration-200"
            onClick={handleUploadClick}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline content">Upload</span>
          </button>
          
          {/* Schedule Posts Button */}
          <button
            className="inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium text-foreground hover:text-foreground border border-border rounded-full hover:bg-accent hover:border-primary transition-all duration-200"
            onClick={() => openModal('schedule', null, [], approvedPosts || [])}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline content">Schedule <span className="text-muted-text">({approved})</span></span>
          </button>

          {/* Mobile hamburger (far right) */}
          <button
            className="md:hidden h-10 w-10 p-2 rounded-full border border-border text-foreground hover:bg-accent hover:border-primary transition-all duration-200"
            aria-label="Open menu"
            onClick={() => setProfileOpen(v => !v)}
          >
            <motion.div animate={profileOpen ? 'open' : 'closed'} variants={menuVariants}>
              {profileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.div>
          </button>

          {/* Profile Menu */}
          <div className="hidden md:block">
            <ProfileMenu
              onAccountSettings={() => setSettingsOpen(true)}
              approvedProgress={approved}
              goal={30}
            />
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      <div className="md:hidden relative">
        <ProfileMenu
          onAccountSettings={() => setSettingsOpen(true)}
          approvedProgress={approved}
          goal={30}
        />
      </div>
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        gymId={user?.gymId || undefined}
        gymSlug={gymSlug || undefined}
        initial={{}}
      />
    </header>
  )
}

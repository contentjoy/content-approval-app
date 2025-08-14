'use client'

import React, { useMemo } from 'react'
import { Plus, Calendar, Menu, X } from 'lucide-react'
import { BrandedButton } from '@/components/ui/branded-button'
import { Logo } from '@/components/ui/logo'
import { CompactProgress } from '@/components/ui/compact-progress'
// ThemeToggle removed; theme switch is in popout menu
import { useBranding } from '@/contexts/branding-context'
import { usePostStats } from '@/hooks/use-post-stats'
import { useParams, usePathname } from 'next/navigation'
import { useModalStore } from '@/hooks/use-modal-store'
import { motion } from 'framer-motion'
import { HorizontalNav } from './horizontal-nav'
import { PopoutMenu } from './popout-menu'
import { useAuth } from '@/contexts/auth-context'
import SettingsModal from '@/components/modals/settings-modal'
import { useState } from 'react'
import { useToast } from '@/components/ui/toast'

export function Header() {
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
    <header className="sticky top-0 z-50 w-full bg-[var(--navbar)]">
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
            className="btn-inline"
            onClick={handleUploadClick}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline content">Upload</span>
          </button>
          
          {/* Schedule Posts Button */}
          <button
            className="btn-inline"
            onClick={() => openModal('schedule', null, [], approvedPosts || [])}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline content">Schedule <span className="text-muted-text">({approved})</span></span>
          </button>

          {/* Mobile hamburger (far right) */}
          <button
            className="md:hidden h-10 w-10 p-2 rounded-md border border-border text-text hover:bg-hover"
            aria-label="Open menu"
            onClick={() => setProfileOpen(v => !v)}
          >
            <motion.div animate={profileOpen ? 'open' : 'closed'} variants={menuVariants}>
              {profileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </motion.div>
          </button>

          {/* Profile avatar (desktop) */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setProfileOpen(v => !v)}
              aria-label="Open account menu"
              className="profile-icon profile-icon-md border border-[var(--border)]"
            >
              <span className="leading-none">
                {(user?.gymName || gymName || 'G').charAt(0).toUpperCase()}
              </span>
            </button>
            <div className="absolute right-0">
              <PopoutMenu
                isOpen={profileOpen}
                onClose={() => setProfileOpen(false)}
                placement="desktop"
                onAccountSettings={() => setSettingsOpen(true)}
                approvedProgress={approved}
                goal={30}
              />
            </div>
          </div>
        </div>
      </div>
      {/* Mobile popout */}
      <div className="md:hidden relative">
        <PopoutMenu
          isOpen={profileOpen}
          onClose={() => setProfileOpen(false)}
          placement="mobile"
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
      {/* Horizontal tabs below header (kept here for global placement) */}
      
    </header>
  )
}

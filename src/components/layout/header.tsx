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
import { ProfileMenu } from './profile-menu'
import { useAuth } from '@/contexts/auth-context'
import SettingsModal from '@/components/modals/settings-modal'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

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
          
          {/* Upload Content Button */}
          <button 
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            onClick={handleUploadClick}
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Upload</span>
          </button>
          
          {/* Schedule Posts Button */}
          <button
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
            onClick={() => openModal('schedule', null, [], approvedPosts || [])}
          >
            <Calendar className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Schedule <span className="text-primary-foreground/80">({approved})</span></span>
          </button>

          {/* Mobile hamburger (far right) */}
          <button
            className="md:hidden h-10 w-10 p-2 rounded-md border border-border text-foreground hover:bg-accent"
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
      <div className="md:hidden">
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
      {/* Horizontal tabs below header (kept here for global placement) */}
      
    </header>
  )
}

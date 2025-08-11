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

export function Header() {
  const { gymName, isLoading, gymProfileImageUrl } = useBranding()
  const { user } = useAuth()
  const params = useParams()
  const pathname = usePathname()
  const gymSlug = typeof params.gymSlug === 'string' ? params.gymSlug : null
  const { total, approved } = usePostStats(gymSlug)
  const { openModal, approvedPosts } = useModalStore()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [profileOpen, setProfileOpen] = React.useState(false)
  const [settingsOpen, setSettingsOpen] = React.useState(false)

  const menuVariants = useMemo(() => ({
    open: { rotate: 180, transition: { duration: 0.3 } },
    closed: { rotate: 0 }
  }), [])

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
            onClick={() => openModal('schedule', null, [], approvedPosts || [])}
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Schedule ({approved})</span>
          </BrandedButton>

          {/* Mobile hamburger (far right) */}
          <button
            className="md:hidden p-2 rounded-md border border-border text-text hover:bg-bg-elev-1"
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
              className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: 'var(--primary)' as any }}
            >
              {gymProfileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={gymProfileImageUrl} alt="profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-bold text-white leading-none">
                  {(user?.gymName || gymName || 'G').charAt(0).toUpperCase()}
                </span>
              )}
            </button>
            <div className="absolute right-0">
              <PopoutMenu isOpen={profileOpen} onClose={() => setProfileOpen(false)} placement="desktop" onAccountSettings={() => setSettingsOpen(true)} />
            </div>
          </div>
        </div>
      </div>
      {/* Mobile popout */}
      <div className="md:hidden relative">
        <PopoutMenu isOpen={profileOpen} onClose={() => setProfileOpen(false)} placement="mobile" onAccountSettings={() => setSettingsOpen(true)} />
      </div>
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} gymId={user?.gymId || ''} initial={{ email: undefined, primaryColor: undefined }} />
      {/* Horizontal tabs below header (kept here for global placement) */}
      
    </header>
  )
}

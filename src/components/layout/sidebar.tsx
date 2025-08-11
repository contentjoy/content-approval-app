'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, Home, Search, ArrowRightCircle, ArrowLeftCircle, Sun, Moon, LogOut } from 'lucide-react'
import { useBranding } from '@/contexts/branding-context'
import { useAuth } from '@/contexts/auth-context'
import SettingsModal from '@/components/modals/settings-modal'

interface NavItem {
  key: string
  label: string
  href: string
  Icon: React.ComponentType<{ className?: string }>
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const params = useParams()
  const gymSlug = params.gymSlug as string
  const { gymName, gymProfileImageUrl, logo, primaryColor } = useBranding()
  const { user, logout } = useAuth()

  const [lockedExpanded, setLockedExpanded] = useState<boolean>(false)
  const [hovered, setHovered] = useState<boolean>(false)
  const [showProfile, setShowProfile] = useState<boolean>(false)
  const profileRef = useRef<HTMLDivElement | null>(null)
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'
    const t = localStorage.getItem('theme')
    return (t === 'dark' || t === 'light') ? t : 'light'
  })

  // Restore persisted state
  useEffect(() => {
    try {
      const persisted = localStorage.getItem('sidebar_locked_expanded')
      if (persisted != null) {
        setLockedExpanded(persisted === 'true')
      }
    } catch {}
    const onToggle = (e: Event) => {
      const d = (e as CustomEvent).detail as { open?: boolean }
      if (typeof d?.open !== 'undefined') {
        setMobileOpen(!!d.open)
      }
    }
    window.addEventListener('sidebar-toggle', onToggle as EventListener)
    return () => window.removeEventListener('sidebar-toggle', onToggle as EventListener)
  }, [])

  // Close profile on outside click; keep expanded while open
  useEffect(() => {
    if (!showProfile) return
    const onDocClick = (e: MouseEvent) => {
      if (!profileRef.current) return
      if (!profileRef.current.contains(e.target as Node)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [showProfile])

  const [mobileOpen, setMobileOpen] = useState(false)
  const isExpanded = lockedExpanded || hovered

  const navItems: NavItem[] = useMemo(() => [
    { key: 'home', label: 'Home', href: `/${gymSlug}`, Icon: Home },
    { key: 'discovery', label: 'Discovery', href: `/${gymSlug}/discovery`, Icon: Search },
    { key: 'calendar', label: 'Calendar', href: `/${gymSlug}/calendar`, Icon: Calendar },
  ], [gymSlug])

  const handleToggleLock = () => {
    const next = !lockedExpanded
    setLockedExpanded(next)
    try { localStorage.setItem('sidebar_locked_expanded', String(next)) } catch {}
  }

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    try {
      localStorage.setItem('theme', next)
      document.documentElement.setAttribute('data-theme', next)
    } catch {}
  }

  return (
    <>
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 240 : 60 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { if (!showProfile) setHovered(false) }}
      className="group sticky top-10 h-[calc(100vh-2.5rem)] border-r border-[var(--E0E0E0,#E0E0E0)] bg-[var(--sidebar,#FFFFFF)] z-50 pointer-events-auto flex flex-col hidden md:flex"
      aria-label="Sidebar navigation"
    >
      {/* Top: Gym logo + name */}
      <div className="pt-2 px-3 flex items-center gap-3">
        {gymProfileImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gymProfileImageUrl} alt="Gym logo" className="h-6 w-6 rounded-full object-cover border border-[var(--E0E0E0,#E0E0E0)]" />
        ) : (
          <div className="h-6 w-6 rounded-full bg-gray-300" />
        )}
        <span className={`text-sm font-semibold text-[var(--1A1A1A,#1A1A1A)] ${isExpanded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 whitespace-nowrap overflow-hidden`}>{gymName || 'Gym'}</span>
      </div>

      <div className="flex-1 py-3">
        <nav className="space-y-1">
          {navItems.map(({ key, label, href, Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={key}
                href={href}
                className={`no-underline relative w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${active ? 'text-[var(--primary,#000)] bg-[color:var(--primary,#000)]/10' : 'text-[var(--1A1A1A,#1A1A1A)] hover:bg-[color:var(--primary,#000)]/10'}`}
                prefetch={true}
                onClick={() => { if (key === 'discovery') console.log('Navigating to Discovery:', href) }}
              >
                {/* Active indicator */}
                <span className={`${active ? 'opacity-100' : 'opacity-0'} transition-opacity absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-[var(--primary,#000)] rounded-r`} />
                <Icon className={`shrink-0 h-6 w-6 ${active ? 'text-[var(--primary,#000)]' : 'text-[var(--1A1A1A,#1A1A1A)]'} group-hover:scale-110 transition-transform`} />
                <span className={`text-sm whitespace-nowrap overflow-hidden ${isExpanded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className={`mt-auto p-3 space-y-3 relative ${!isExpanded ? 'flex flex-col items-center justify-center' : ''}`}>
        {/* Profile button */}
        <button
          onClick={() => setShowProfile((s) => !s)}
          className={`w-full flex ${!isExpanded ? 'justify-center' : 'justify-start'} items-center gap-3 px-3 py-2 text-[var(--1A1A1A,#1A1A1A)] hover:bg-[color:var(--primary,#000)]/10 rounded-lg transition-colors`}
          aria-label="Open profile"
        >
          {gymProfileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={gymProfileImageUrl} alt="Gym logo" className="h-8 w-8 rounded-full object-cover border border-[var(--E0E0E0,#E0E0E0)]" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-300" />
          )}
          <span className={`text-sm whitespace-nowrap overflow-hidden ${isExpanded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
            {gymName || 'Profile'}
          </span>
        </button>

        {/* Profile popout */}
        {showProfile && (
          <motion.div
            ref={profileRef}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`hidden md:block fixed ${lockedExpanded || hovered ? 'left-[240px]' : 'left-0'} top-1/2 -translate-y-1/2 z-[60] w-64 bg-[var(--F9F9F9,#F9F9F9)] border border-[var(--E0E0E0,#E0E0E0)] rounded-lg p-4`}
          >
            <div className="flex items-center gap-3 mb-3">
              {gymProfileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={gymProfileImageUrl} alt="Gym logo" className="h-10 w-10 rounded-full object-cover border border-[var(--E0E0E0,#E0E0E0)]" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-300" />
              )}
              <div>
                <div className="text-sm font-bold text-[var(--1A1A1A,#1A1A1A)]">{gymName || 'Gym'}</div>
                <div className="text-xs text-[color:var(--1A1A1A,#1A1A1A)]/60">{user?.gymName || ''}</div>
              </div>
            </div>

            <div className="space-y-2">
              <button onClick={toggleTheme} className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--E0E0E0,#E0E0E0)] text-[var(--1A1A1A,#1A1A1A)] hover:bg-[color:var(--primary,#000)]/10">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="text-sm">{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</span>
              </button>
              <button onClick={() => { setShowProfile(false); setShowSettings(true) }} className="w-full inline-flex items-center justify-between px-3 py-2 rounded-md border border-[var(--E0E0E0,#E0E0E0)] text-[var(--1A1A1A,#1A1A1A)] hover:bg-[color:var(--primary,#000)]/10">
                <span className="text-sm">Settings</span>
              </button>
              <button onClick={async () => { await logout(); router.push('/agency') }} className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-md text-red-500 hover:bg-[color:var(--primary,#000)]/10">
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}

        <button
          onClick={handleToggleLock}
          className={`w-full flex ${!isExpanded ? 'justify-center' : 'justify-start'} items-center gap-3 px-3 py-2 text-[var(--1A1A1A,#1A1A1A)] hover:bg-[color:var(--primary,#000)]/10 rounded-lg transition-colors`}
          aria-label={lockedExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {lockedExpanded ? (
            <ArrowLeftCircle className="h-6 w-6" />
          ) : (
            <ArrowRightCircle className="h-6 w-6" />
          )}
          <span className={`text-sm whitespace-nowrap overflow-hidden ${isExpanded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
            {lockedExpanded ? 'Collapse' : 'Expand'}
          </span>
        </button>
      </div>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        gymId={user?.gymId || ''}
        initial={{ email: undefined, primaryColor: primaryColor || undefined }}
      />
    </motion.aside>

    {/* Mobile overlay drawer */}
    <motion.div
      className="fixed inset-0 z-50 md:hidden"
      initial={false}
      animate={{ pointerEvents: mobileOpen ? 'auto' : 'none' }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        animate={{ opacity: mobileOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => setMobileOpen(false)}
      />
      {/* Panel */}
      <motion.aside
        className="absolute left-0 top-0 h-screen w-64 max-w-[100vw] bg-[var(--sidebar,#FFFFFF)] border-r border-[var(--E0E0E0,#E0E0E0)] p-3 flex flex-col overflow-hidden"
        initial={{ x: '-100%' }}
        animate={{ x: mobileOpen ? 0 : '-100%' }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        {/* Top: logo and gym name */}
        <div className="pt-2 px-1 flex items-center gap-3">
          {gymProfileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={gymProfileImageUrl} alt="Gym logo" className="h-6 w-6 rounded-full object-cover border border-[var(--E0E0E0,#E0E0E0)]" />
          ) : (
            <div className="h-6 w-6 rounded-full bg-gray-300" />
          )}
          <span className="text-sm font-semibold text-[var(--1A1A1A,#1A1A1A)]">{gymName || 'Gym'}</span>
        </div>

        {/* Nav */}
        <nav className="space-y-1 mt-3">
          {navItems.map(({ key, label, href, Icon }) => (
            <Link
              key={key}
              href={href}
              className={`no-underline w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${pathname === href ? 'text-[var(--primary,#000)] bg-[color:var(--primary,#000)]/10' : 'text-[var(--1A1A1A,#1A1A1A)] hover:bg-[color:var(--primary,#000)]/10'}`}
              prefetch={true}
              onClick={() => setMobileOpen(false)}
            >
              <Icon className="h-6 w-6" />
              <span className="text-sm">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="mt-auto space-y-2 pb-2">
          <button
            onClick={() => setShowProfile(true)}
            className="w-full flex items-center gap-3 px-3 py-2 text-[var(--1A1A1A,#1A1A1A)] hover:bg-[color:var(--primary,#000)]/10 rounded-lg"
          >
            {gymProfileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gymProfileImageUrl} alt="Gym logo" className="h-8 w-8 rounded-full object-cover border border-[var(--E0E0E0,#E0E0E0)]" />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-300" />
            )}
            <span className="text-sm">{gymName || 'Profile'}</span>
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="w-full flex items-center gap-3 px-3 py-2 text-[var(--1A1A1A,#1A1A1A)] hover:bg-[color:var(--primary,#000)]/10 rounded-lg"
          >
            {lockedExpanded ? <ArrowLeftCircle className="h-6 w-6" /> : <ArrowRightCircle className="h-6 w-6" />}
            <span className="text-sm">Close</span>
          </button>
        </div>
      </motion.aside>

      {/* Mobile profile popout */}
      {showProfile && (
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="md:hidden fixed left-0 right-0 bottom-0 z-[60] w-full bg-[var(--F9F9F9,#F9F9F9)] border-t border-[var(--E0E0E0,#E0E0E0)] rounded-t-lg p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            {gymProfileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gymProfileImageUrl} alt="Gym logo" className="h-10 w-10 rounded-full object-cover border border-[var(--E0E0E0,#E0E0E0)]" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-300" />
            )}
            <div>
              <div className="text-sm font-bold text-[var(--1A1A1A,#1A1A1A)]">{gymName || 'Gym'}</div>
              <div className="text-xs text-[color:var(--1A1A1A,#1A1A1A)]/60">{user?.gymName || ''}</div>
            </div>
          </div>
          <div className="space-y-2">
            <button onClick={toggleTheme} className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-md border border-[var(--E0E0E0,#E0E0E0)] text-[var(--1A1A1A,#1A1A1A)] hover:bg-[color:var(--primary,#000)]/10">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span className="text-sm">{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</span>
            </button>
            <button onClick={() => { setShowProfile(false); setShowSettings(true) }} className="w-full inline-flex items-center justify-between px-3 py-2 rounded-md border border-[var(--E0E0E0,#E0E0E0)] text-[var(--1A1A1A,#1A1A1A)] hover:bg-[color:var(--primary,#000)]/10">
              <span className="text-sm">Settings</span>
            </button>
            <button onClick={async () => { await logout(); router.push('/agency') }} className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-md text-red-500 hover:bg-[color:var(--primary,#000)]/10">
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Sign Out</span>
            </button>
            <button onClick={() => setShowProfile(false)} className="w-full inline-flex items-center justify-center px-3 py-2 rounded-md border border-[var(--E0E0E0,#E0E0E0)] text-[var(--1A1A1A,#1A1A1A)]">
              Close
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
    </>
  )
}

export default Sidebar



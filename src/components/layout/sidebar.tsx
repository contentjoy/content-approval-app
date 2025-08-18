'use client'

import React, { useEffect, useMemo, useState } from 'react'
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
  const { gymName, primaryColor, gymPrimaryColor } = useBranding()
  const { user, logout } = useAuth()

  const [lockedExpanded, setLockedExpanded] = useState<boolean>(false)
  const [hovered, setHovered] = useState<boolean>(false)
  const [showProfile, setShowProfile] = useState<boolean>(false)
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
      onMouseLeave={() => setHovered(false)}
      className="group sticky top-0 h-screen border-r border-border bg-[var(--sidebar)] z-50 pointer-events-auto flex flex-col hidden md:flex"
      aria-label="Sidebar navigation"
    >
      {/* Top: Gym avatar + name (mobile only) */}
      <div className="pt-4 px-3 flex items-center gap-3 md:hidden">
        {/* Name (mobile only) */}
        <span className="text-sm font-semibold text-foreground">{gymName || 'Gym'}</span>
      </div>

      <div className="flex-1 py-4">
        <nav className="space-y-1">
          {navItems.map(({ key, label, href, Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={key}
                href={href}
                className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors
                  ${active ? 'text-accent' : 'text-foreground'} hover:text-accent`}
                prefetch
              >
                {/* Active indicator */}
                <span className={`${active ? 'opacity-100' : 'opacity-0'} transition-opacity absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-accent rounded-r`} />
                <Icon className={`shrink-0 h-6 w-6 ${active ? 'text-accent' : 'text-foreground'} group-hover:scale-110 transition-transform`} />
                <span className={`text-sm whitespace-nowrap overflow-hidden ${isExpanded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto p-3 space-y-3 relative">
        {/* Profile button */}
        <button
          onClick={() => setShowProfile((s) => !s)}
          className="w-full flex items-center gap-3 px-3 py-2 text-foreground hover:text-accent transition-colors"
          aria-label="Open profile"
        >
          <div className="profile-icon profile-icon-md">
            {(gymName || 'G').charAt(0).toUpperCase()}
          </div>
          <span className={`text-sm whitespace-nowrap overflow-hidden ${isExpanded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
            {gymName || 'Profile'}
          </span>
        </button>

        {/* Profile popout */}
        {showProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute right-3 bottom-16 md:w-64 w-[90vw] max-w-[20rem] bg-card-bg border border-card-border rounded-lg p-4 md:fixed md:right-4 md:bottom-6"
            style={{ left: isExpanded ? undefined : 8 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="profile-icon profile-icon-lg">
                {(gymName || 'G').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-bold text-text">{gymName || 'Gym'}</div>
                <div className="text-xs text-muted-text">{user?.gymName || ''}</div>
              </div>
            </div>

            <div className="space-y-2">
              <button onClick={toggleTheme} className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border text-text hover:bg-bg-elev-1">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="text-sm">{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</span>
              </button>
              <button onClick={() => { setShowProfile(false); setShowSettings(true) }} className="w-full inline-flex items-center justify-between px-3 py-2 rounded-md border border-border text-text hover:bg-bg-elev-1">
                <span className="text-sm">Settings</span>
              </button>
              <button onClick={async () => { await logout(); router.push('/agency') }} className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-md text-red-500 hover:bg-bg-elev-1">
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}

        <button
          onClick={handleToggleLock}
          className="w-full flex items-center gap-3 px-3 py-2 text-foreground hover:text-accent transition-colors"
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
        gymId={user?.gymId || undefined}
        gymSlug={gymSlug}
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
        className="absolute inset-0 bg-black/40"
        animate={{ opacity: mobileOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => setMobileOpen(false)}
      />
      {/* Panel */}
      <motion.aside
        className="absolute left-0 top-0 h-full w-full max-w-[320px] bg-[var(--sidebar)] border-r border-border p-3 flex flex-col"
        initial={{ x: '-100%' }}
        animate={{ x: mobileOpen ? 0 : '-100%' }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        <nav className="space-y-1 mt-2">
          {navItems.map(({ key, label, href, Icon }) => (
            <Link
              key={key}
              href={href}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-colors ${pathname === href ? 'text-accent' : 'text-foreground hover:text-accent'}`}
              prefetch={false}
              onClick={(e) => { e.preventDefault(); setMobileOpen(false); router.push(href) }}
            >
              <Icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <span className="text-sm">{label}</span>
            </Link>
          ))}
        </nav>
      </motion.aside>
    </motion.div>
    </>
  )
}

export default Sidebar



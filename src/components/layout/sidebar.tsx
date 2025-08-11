'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Calendar, Home, Search, ArrowRightCircle, ArrowLeftCircle, Sun, Moon } from 'lucide-react'
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
  const { gymName, logo, primaryColor } = useBranding()
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
      <div className="flex-1 py-4">
        <nav className="space-y-1">
          {navItems.map(({ key, label, href, Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={key}
                href={href}
                className={`w-full flex items-center gap-3 px-3 py-2 transition-colors
                  ${active ? 'text-accent' : 'text-foreground'} hover:text-accent`}
                prefetch={false}
                onClick={(e) => { e.preventDefault(); router.push(href) }}
              >
                <Icon className={`shrink-0 h-6 w-6 ${active ? 'text-accent' : 'text-foreground'} group-hover:scale-105 transition-transform`} />
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
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="Gym logo" className="h-8 w-8 rounded-full object-cover border border-border" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gray-300" />
          )}
          <span className={`text-sm whitespace-nowrap overflow-hidden ${isExpanded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
            {gymName || 'Profile'}
          </span>
        </button>

        {/* Profile popout */}
        {showProfile && (
          <div className="absolute right-3 bottom-16 w-64 bg-card-bg border border-card-border rounded-lg shadow-soft p-4">
            <div className="flex items-center gap-3 mb-3">
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt="Gym logo" className="h-10 w-10 rounded-full object-cover border border-border" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gray-300" />
              )}
              <div>
                <div className="text-sm font-bold text-text">{gymName || 'Gym'}</div>
                <div className="text-xs text-muted-text">{user?.gymName || ''}</div>
              </div>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-muted-text">Email</span><span className="text-text">—</span></div>
              <div className="flex justify-between"><span className="text-muted-text">Primary</span><span className="inline-flex items-center gap-2 text-text"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: primaryColor || 'var(--primary-color)' }} />{primaryColor || '—'}</span></div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <button onClick={toggleTheme} className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border text-text hover:bg-bg-elev-1">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                <span className="text-sm">{theme === 'dark' ? 'Light' : 'Dark'} mode</span>
              </button>
              <div className="flex gap-2">
                <button onClick={() => { setShowProfile(false); setShowSettings(true) }} className="px-3 py-2 rounded-md border border-border text-text hover:bg-bg-elev-1">Settings</button>
                <button onClick={async () => { await logout(); router.push('/agency') }} className="px-3 py-2 rounded-md bg-destructive text-background hover:opacity-90">Sign Out</button>
              </div>
            </div>
          </div>
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
        className="absolute inset-0 bg-black/40"
        animate={{ opacity: mobileOpen ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => setMobileOpen(false)}
      />
      {/* Panel */}
      <motion.aside
        className="absolute left-0 top-0 h-full w-[80vw] max-w-[320px] bg-[var(--sidebar)] border-r border-border p-3 flex flex-col"
        initial={{ x: '-100%' }}
        animate={{ x: mobileOpen ? 0 : '-100%' }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        <nav className="space-y-1 mt-2">
          {navItems.map(({ key, label, href, Icon }) => (
            <Link
              key={key}
              href={href}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-md transition-colors ${pathname === href ? 'bg-bg-elev-1 text-accent' : 'text-foreground hover:text-accent'}`}
              prefetch={false}
              onClick={(e) => { e.preventDefault(); setMobileOpen(false); router.push(href) }}
            >
              <Icon className="h-6 w-6" />
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



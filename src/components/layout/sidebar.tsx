'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Calendar, Home, Search, ArrowRightCircle, ArrowLeftCircle } from 'lucide-react'

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

  const [lockedExpanded, setLockedExpanded] = useState<boolean>(false)
  const [hovered, setHovered] = useState<boolean>(false)

  // Restore persisted state
  useEffect(() => {
    try {
      const persisted = localStorage.getItem('sidebar_locked_expanded')
      if (persisted != null) {
        setLockedExpanded(persisted === 'true')
      }
    } catch {}
  }, [])

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

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 240 : 60 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group sticky top-0 h-screen border-r border-border bg-[var(--sidebar)] z-30 flex flex-col"
      aria-label="Sidebar navigation"
    >
      <div className="flex-1 py-4">
        <nav className="space-y-1">
          {navItems.map(({ key, label, href, Icon }) => {
            const active = pathname === href
            return (
              <button
                key={key}
                onClick={() => router.push(href)}
                className={`w-full flex items-center gap-3 px-3 py-2 transition-colors
                  ${active ? 'text-accent' : 'text-foreground'}
                  hover:text-accent`}
              >
                <Icon className={`shrink-0 h-6 w-6 ${active ? 'text-accent' : 'text-foreground'} group-hover:scale-105 transition-transform`} />
                <span className={`text-sm whitespace-nowrap overflow-hidden ${isExpanded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>{label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className="p-3 mt-auto">
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
    </motion.aside>
  )
}

export default Sidebar



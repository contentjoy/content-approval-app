"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname } from 'next/navigation'
import { motion, LayoutGroup } from 'framer-motion'

type Tab = { label: string; href: string }

export function HorizontalNav() {
  const pathname = usePathname()
  const params = useParams()
  const gymSlug = String(params.gymSlug || '')

  const tabs: Tab[] = useMemo(() => [
    { label: 'Content', href: `/${gymSlug}` },
    { label: 'Discovery', href: `/${gymSlug}/discovery` },
    { label: 'Calendar', href: `/${gymSlug}/calendar` },
  ], [gymSlug])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const tabRefs = useRef<Record<string, HTMLAnchorElement | null>>({})
  const [underline, setUnderline] = useState<{ left: number; width: number }>({ left: 0, width: 0 })

  const recalc = () => {
    const active = tabs.find(t => pathname === t.href)
    const key = active?.href || tabs[0].href
    const el = tabRefs.current[key]
    const container = containerRef.current
    if (el && container) {
      const containerRect = container.getBoundingClientRect()
      const rect = el.getBoundingClientRect()
      setUnderline({ left: rect.left - containerRect.left, width: rect.width })
    }
  }

  useEffect(() => {
    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, tabs.length])

  return (
    <div className="relative h-10 border-b border-[var(--accents-2)] bg-[var(--navbar)] flex items-center px-4 overflow-x-auto snap-x gap-2">
      <div ref={containerRef} className="relative flex items-center gap-2">
        <LayoutGroup id="horizontal-tabs">
          {tabs.map((t) => {
            const isActive = pathname === t.href
            return (
              <Link
                key={t.href}
                href={t.href}
                prefetch={true}
                ref={(el) => { tabRefs.current[t.href] = el }}
                className={`no-underline hover:no-underline snap-start px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 ${isActive ? 'text-foreground' : 'text-[var(--muted-text)] hover:text-foreground'}`}
              >
                {t.label}
              </Link>
            )
          })}
          <motion.div
            layout
            className="absolute bottom-[-1px] h-[2px] bg-[var(--primary)] rounded-full"
            animate={{ left: underline.left, width: underline.width }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        </LayoutGroup>
      </div>
    </div>
  )
}



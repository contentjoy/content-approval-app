'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { getScheduledPosts, type ScheduledPostSummary } from '@/lib/database'
import { MediaDisplay } from '@/components/posts'

function startOfWeek(date: Date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay()
  const diff = (day === 0 ? -6 : 1) // Monday as start
  d.setUTCDate(d.getUTCDate() - (day - 1))
  return d
}

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

function formatDay(date: Date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatTime(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

export default function CalendarPage() {
  const params = useParams()
  const gymSlug = (params?.gymSlug as string) || ''

  const today = new Date()
  const weekStart = useMemo(() => startOfWeek(today), [today])
  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart])

  const [posts, setPosts] = useState<ScheduledPostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const data = await getScheduledPosts(gymSlug, weekStart, weekEnd)
        if (mounted) setPosts(data)
      } catch (e: any) {
        setError('Failed to load calendar')
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [gymSlug, weekStart, weekEnd])

  // scroll snapping container ref for desktop scaling
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="max-w-5xl mx-auto p-4 bg-[var(--background)] text-[var(--text)]">
      <h1 className="text-2xl font-semibold mb-2">Calendar</h1>
      <p className="text-sm text-[var(--muted-text)] mb-4">Scheduled posts this week</p>

      {/* Timeline track */}
      <div className="relative w-full h-2 rounded-full bg-[var(--accents-2)] mb-4">
        {[0,1,2,3,4,5,6].map(i => (
          <div key={i} className="absolute -top-5" style={{ left: `${(i/6)*100}%` }}>
            <span className="text-xs text-[var(--text)]">{formatDay(addDays(weekStart, i))}</span>
          </div>
        ))}
      </div>

      {/* Desktop horizontal cards */}
      <div className="hidden md:block">
        <div
          ref={containerRef}
          className="flex items-start gap-6 overflow-x-auto snap-x snap-mandatory p-4 scroll-smooth"
        >
          {loading && <div className="text-[var(--muted-text)]">Loading…</div>}
          {error && <div className="text-destructive">{error}</div>}
          {!loading && posts.length === 0 && (
            <div className="text-[var(--muted-text)]">No scheduled posts this week.</div>
          )}
          {posts.map((p, idx) => {
            const scheduled = p.Scheduled || undefined
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="snap-center min-w-[320px] max-w-[360px]"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs text-[var(--text)]">{formatDay(new Date(scheduled || ''))} · {formatTime(scheduled)}</span>
                  {/* channel badge omitted if not available */}
                </div>
                <motion.div
                  whileInView={{ scale: 1.05, y: -10 }}
                  viewport={{ amount: 0.6 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="rounded-md border border-[var(--border)] bg-[var(--card-bg)]"
                >
                  <div className="p-2">
                    <div className="rounded-md overflow-hidden">
                      <MediaDisplay post={p as any} carouselPosts={[]} priority={false} />
                    </div>
                    {p['Post Caption'] && (
                      <p className="mt-2 text-sm text-[var(--text)] line-clamp-3">{p['Post Caption']}</p>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Mobile vertical stack */}
      <div className="md:hidden flex flex-col gap-6 p-1">
        {loading && <div className="text-[var(--muted-text)]">Loading…</div>}
        {error && <div className="text-destructive">{error}</div>}
        {!loading && posts.length === 0 && (
          <div className="text-[var(--muted-text)]">No scheduled posts this week.</div>
        )}
        {posts.map((p, idx) => {
          const scheduled = p.Scheduled || undefined
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className=""
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xs text-[var(--text)]">{formatDay(new Date(scheduled || ''))} · {formatTime(scheduled)}</span>
                {/* channel badge omitted if not available */}
              </div>
              <motion.div whileTap={{ scale: 0.98 }} className="rounded-md border border-[var(--border)] bg-[var(--card-bg)]">
                <div className="p-2">
                  <div className="rounded-md overflow-hidden">
                    <MediaDisplay post={p as any} carouselPosts={[]} priority={false} />
                  </div>
                  {p['Post Caption'] && (
                    <p className="mt-2 text-sm text-[var(--text)] line-clamp-3">{p['Post Caption']}</p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}



'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { getScheduledPosts, type ScheduledPostSummary, updatePostScheduled } from '@/lib/database'
import '@toast-ui/calendar/dist/toastui-calendar.min.css'
import { getAssetTypeStripeVar, getContentTypeFillVar } from '@/lib/utils'
import dynamic from 'next/dynamic'
const noop = () => null

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

  const calRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const events = useMemo(() => posts.filter(p => !!p.Scheduled).map((p) => {
    const title = (p as any)['Post Title'] || (p as any)['Content Type'] || 'Post'
    const order = (p as any)['Carousel Order']
    const group = (p as any)['Carousel Group']
    const withOrder = group ? `${title} #${order ?? ''}`.trim() : title
    const contentType = (p as any)['Content Type']
    const assetType = (p as any)['Asset Type'] || (p as any)['Asset type']
    return {
      id: p.id,
      calendarId: contentType ?? 'Other',
      title: withOrder,
      start: p.Scheduled as string,
      end: new Date(new Date(p.Scheduled as string).getTime() + 30 * 60000).toISOString(),
      isAllDay: false,
      backgroundColor: getContentTypeFillVar(contentType),
      borderColor: 'var(--border)',
      raw: {
        assetUrl: (p as any)['Asset URL'],
        gymName: (p as any)['Gym Name'],
        contentType,
        caption: (p as any)['Post Caption'],
        carouselGroup: group,
        carouselOrder: order,
        assetType,
        stripe: getAssetTypeStripeVar(assetType),
      },
    }
  }), [posts])

  return (
    <div className="max-w-5xl mx-auto p-4 bg-[var(--background)] text-[var(--text)]">
      <h1 className="text-2xl font-semibold mb-2">Calendar</h1>
      <p className="text-sm text-[var(--muted-text)] mb-4">Scheduled posts</p>

      {loading && <div className="text-[var(--muted-text)]">Loading…</div>}
      {error && <div className="text-destructive mb-2">{error}</div>}
      <div ref={containerRef} className="min-h-[70vh] overflow-hidden rounded-md border border-[var(--border)] bg-[var(--card-bg)]" />

      {/* Initialize Toast UI Calendar once */}
      <Initializer
        containerRef={containerRef}
        calRef={calRef}
        events={events}
        onUpdateScheduled={async (id, iso) => {
          const prev = posts
          setPosts(curr => curr.map(p => (p.id === id ? { ...p, Scheduled: iso } : p)))
          const res = await updatePostScheduled(id, iso)
          if (!res.success) setPosts(prev)
        }}
      />
    </div>
  )
}

function Initializer({ containerRef, calRef, events, onUpdateScheduled }: {
  containerRef: React.RefObject<HTMLDivElement>
  calRef: React.MutableRefObject<any>
  events: any[]
  onUpdateScheduled: (id: string, iso: string) => Promise<void>
}) {
  useEffect(() => {
    let calendar: any = calRef.current
    let ro: ResizeObserver | null = null
    let mounted = true
    async function init() {
      if (!containerRef.current || calendar) return
      // @ts-ignore - package does not expose proper typings via exports; safe at runtime
      const Calendar: any = (await import('@toast-ui/calendar')).default as any
      calendar = new Calendar(containerRef.current, {
        defaultView: 'month',
        usageStatistics: false,
        isReadOnly: false,
        month: { isAlways6Weeks: true },
        theme: {
          common: { backgroundColor: 'var(--background)' },
          month: {
            dayName: { color: 'var(--muted-text)' },
            moreView: { border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)' },
          },
        },
      })
      calRef.current = calendar

      calendar.on('afterRenderEvent', (ev: any) => {
        const el = ev?.el as HTMLElement | undefined
        const stripe = ev?.event?.raw?.stripe
        if (el && stripe) el.style.borderLeft = `3px solid ${stripe}`
      })

      calendar.on('beforeUpdateEvent', async (ev: any) => {
        const { event, changes } = ev
        const newStart = changes?.start || event.start
        const iso = new Date(newStart).toISOString()
        await onUpdateScheduled(event.id as string, iso)
      })

      ro = new ResizeObserver(() => calendar?.render())
      ro.observe(containerRef.current!)

      if (mounted) {
        calendar.clear()
        calendar.createEvents(events)
      }
    }
    init()
    return () => {
      mounted = false
      ro?.disconnect()
    }
  }, [])

  // Update events when data changes without remount
  useEffect(() => {
    const calendar = calRef.current
    if (!calendar) return
    calendar.clear()
    calendar.createEvents(events)
  }, [events])
  return null
}



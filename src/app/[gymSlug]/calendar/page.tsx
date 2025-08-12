'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { getScheduledPosts, type ScheduledPostSummary } from '@/lib/database'
import '@toast-ui/calendar/dist/toastui-calendar.min.css'
import { getAssetTypeStripeVar, getContentTypeFillVar } from '@/lib/utils'

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0))
}
function addMonths(date: Date, n: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n, 1, 0, 0, 0))
}

export default function CalendarPage() {
  const params = useParams()
  const gymSlug = (params?.gymSlug as string) || ''

  const [currentDate, setCurrentDate] = useState(new Date())
  const [posts, setPosts] = useState<ScheduledPostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // range for current month (UTC)
  const range = useMemo(() => {
    const start = startOfMonth(currentDate)
    const end = addMonths(start, 1)
    return { start, end }
  }, [currentDate])

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await getScheduledPosts(gymSlug, range.start, range.end)
        if (mounted) setPosts(data)
      } catch (e: any) {
        if (mounted) setError('Failed to load scheduled posts')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [gymSlug, range.start, range.end])

  const containerRef = useRef<HTMLDivElement>(null)
  const calendarRef = useRef<any>(null)

  // Create calendar once
  useEffect(() => {
    let created = false
    async function init() {
      if (!containerRef.current || created) return
      // @ts-expect-error package does not expose typings via exports; runtime default exists
      const Calendar: any = (await import('@toast-ui/calendar')).default
      const cal = new Calendar(containerRef.current, {
        defaultView: 'month',
        usageStatistics: false,
        isReadOnly: true,
        month: { isAlways6Weeks: true },
        theme: {
          common: { backgroundColor: 'var(--background)' },
          month: { dayName: { color: 'var(--muted-text)' }, moreView: { border: '1px solid var(--border)', backgroundColor: 'var(--card-bg)' } },
        },
      })
      calendarRef.current = cal
      created = true
      // initial date
      cal.setDate(currentDate)
    }
    init()
  }, [])

  // Update calendar on date change
  useEffect(() => {
    const cal = calendarRef.current
    if (!cal) return
    cal.setDate(currentDate)
  }, [currentDate])

  // Map posts to events and render (no re-mount)
  useEffect(() => {
    const cal = calendarRef.current
    if (!cal) return
    const events = posts.filter(p => !!p.Scheduled).map(p => {
      const title = (p as any)['Post Title'] || (p as any)['Content Type'] || 'Post'
      const order = (p as any)['Carousel Order']
      const group = (p as any)['Carousel Group']
      const withOrder = group ? `${title} #${order ?? ''}`.trim() : title
      const contentType = (p as any)['Content Type']
      const assetType = (p as any)['Asset Type'] || (p as any)['Asset type']
      return {
        id: p.id,
        title: withOrder,
        start: p.Scheduled as string,
        end: new Date(new Date(p.Scheduled as string).getTime() + 30 * 60000).toISOString(),
        isAllDay: false,
        backgroundColor: getContentTypeFillVar(contentType),
        borderColor: 'var(--border)',
        raw: { stripe: getAssetTypeStripeVar(assetType) },
      }
    })
    cal.clear()
    cal.createEvents(events as any)
  }, [posts])

  return (
    <div className="max-w-5xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-2">Calendar</h1>
      <p className="text-sm text-[var(--muted-text)] mb-4">Scheduled posts</p>

      <div className="mb-3 flex items-center gap-2">
        <button className="btn-inline" onClick={() => setCurrentDate(new Date())}>Today</button>
        <button className="btn-inline" onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}>Prev</button>
        <button className="btn-inline" onClick={() => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}>Next</button>
        <span className="ml-2 text-sm text-[var(--muted-text)]">
          {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </span>
      </div>

      {loading && <div className="text-[var(--muted-text)]">Loading…</div>}
      {error && <div className="text-destructive mb-2">{error}</div>}

      <div ref={containerRef} className="rounded-md border border-[var(--border)] bg-[var(--card-bg)]" style={{ minHeight: 720 }} />
    </div>
  )
}



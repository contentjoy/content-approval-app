'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useParams } from 'next/navigation'
import { getScheduledPosts, type ScheduledPostSummary } from '@/lib/database'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

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

  // Build FullCalendar events from posts
  const events = useMemo(() => {
    return posts
      .filter(p => !!p.Scheduled)
      .map(p => ({
        id: p.id,
        title: (p['Post Caption'] || '').slice(0, 48) || 'Scheduled Post',
        start: p.Scheduled as string,
        allDay: false,
        extendedProps: { post: p },
      }))
  }, [posts])

  return (
    <div className="max-w-5xl mx-auto p-4 bg-[var(--background)] text-[var(--text)]">
      <h1 className="text-2xl font-semibold mb-2">Calendar</h1>
      <p className="text-sm text-[var(--muted-text)] mb-4">Scheduled posts</p>

      {loading && <div className="text-[var(--muted-text)]">Loading…</div>}
      {error && <div className="text-destructive mb-2">{error}</div>}

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        height="auto"
        headerToolbar={{ left: 'title', center: '', right: 'prev,next today' }}
        events={events}
        eventContent={(arg) => {
          const p = (arg.event.extendedProps as any)?.post as ScheduledPostSummary | undefined
          if (!p) return { html: '' }
          const caption = (p['Post Caption'] || '').replace(/</g, '&lt;').slice(0, 80)
          const media = p['Asset URL'] || ''
          const isVideo = (p['Asset Type'] || '').toLowerCase() === 'video'
          const mediaHtml = isVideo
            ? `<video muted playsinline style="width:100%;border-radius:8px" src="${media}"></video>`
            : `<img style="width:100%;border-radius:8px" src="${media}" />`
          return { html: `<div style="font-size:12px;line-height:1.3">${media ? mediaHtml : ''}<div style="margin-top:6px;color:var(--muted-text)">${caption}</div></div>` }
        }}
        dayMaxEventRows={3}
        dayMaxEvents={true}
      />
    </div>
  )
}



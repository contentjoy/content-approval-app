'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { getScheduledPosts, type ScheduledPostSummary } from '@/lib/database'
import { Calendar, CalendarSkeleton } from '@/components/calendar'
import { convertPostsToEvents } from '@/components/calendar/utils'

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0))
}
function addMonths(date: Date, n: number) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n, 1, 0, 0, 0))
}

export default function CalendarPage() {
  const params = useParams()
  const gymSlug = (params?.gymSlug as string) || ''

  const [currentDate] = useState(new Date())
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
      } catch {
        if (mounted) setError('Failed to load scheduled posts')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [gymSlug, range.start, range.end])

  // Convert posts to calendar events
  const events = useMemo(() => {
    const gymName = posts[0]?.["Gym Name"] || gymSlug.replace(/-/g, ' ')
    return convertPostsToEvents(posts, gymName)
  }, [posts, gymSlug])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-2">Calendar</h1>
        <p className="text-sm text-muted-foreground mb-4">Scheduled posts</p>
        <CalendarSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-2">Calendar</h1>
        <p className="text-sm text-muted-foreground mb-4">Scheduled posts</p>
        <div className="text-destructive mb-2">{error}</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-2">Calendar</h1>
      <p className="text-sm text-muted-foreground mb-4">Scheduled posts</p>

      <Calendar events={events} view="month" />
    </div>
  )
}



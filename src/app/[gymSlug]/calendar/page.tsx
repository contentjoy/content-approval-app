'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { getScheduledPosts, type ScheduledPostSummary } from '@/lib/database'
import { Calendar, CalendarSkeleton } from '@/components/calendar'
import { convertPostsToEvents } from '@/components/calendar/utils'


export default function CalendarPage() {
  const params = useParams()
  const gymSlug = (params?.gymSlug as string) || ''


  const [posts, setPosts] = useState<ScheduledPostSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        // Pass current date range but the function will ignore it and return all scheduled posts
        const data = await getScheduledPosts(gymSlug, new Date(), new Date())
        if (mounted) setPosts(data)
      } catch {
        if (mounted) setError('Failed to load scheduled posts')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [gymSlug])

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



'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/hooks/use-toast'
import type { SocialMediaPost } from '@/types'
import { Calendar, Clock, Globe, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const schema = z.object({
  date: z.string().min(1),
  time: z.string().min(1),
  caption: z.string().optional(),
  timezone: z.string().min(1)
})
type FormData = z.infer<typeof schema>

export function EditScheduleModal({ isOpen, onClose, post, onSuccess }: { isOpen: boolean; onClose: () => void; post: SocialMediaPost; onSuccess?: () => void }) {
  const { showToast } = useToast()
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!post) return
    const ts = post['Scheduled'] ? new Date(post['Scheduled']) : new Date()
    setValue('date', ts.toISOString().split('T')[0])
    const hh = String(ts.getHours()).padStart(2, '0')
    const mm = String(ts.getMinutes()).padStart(2, '0')
    setValue('time', `${hh}:${mm}`)
    setValue('caption', post['Post Caption'] || '')
    try { setValue('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone) } catch { setValue('timezone', 'UTC') }
  }, [post, setValue])

  const onSubmit = async (data: FormData) => {
    const scheduledDate = `${data.date} ${data.time}:00`
    try {
      const res = await fetch('/api/posts/update-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, caption: data.caption, scheduledDate, timezone: data.timezone })
      })
      if (!res.ok) throw new Error(await res.text())
      showToast({ type: 'success', title: 'Post updated', message: 'Post has been updated' })
      onSuccess?.()
      onClose()
    } catch {
      showToast({ type: 'error', title: 'Update failed', message: 'Unable to update post' })
    }
  }

  const onDelete = async () => {
    try {
      const res = await fetch('/api/posts/update-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, action: 'delete' })
      })
      if (!res.ok) throw new Error(await res.text())
      showToast({ type: 'success', title: 'Post deleted', message: 'Post removed from Ayrshare' })
      onSuccess?.()
      onClose()
    } catch {
      showToast({ type: 'error', title: 'Delete failed', message: 'Unable to delete post' })
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Edit Schedule</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Date, Time, Timezone */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Scheduled Date <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="date"
                {...register('date')}
                className={cn(
                  "w-full pl-10 pr-3 py-2 bg-muted border border-border rounded-xl",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "transition-all duration-200"
                )}
              />
            </div>
            {errors.date && <p className="mt-1 text-sm text-destructive">{errors.date.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Scheduled Time <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="time"
                {...register('time')}
                className={cn(
                  "w-full pl-10 pr-3 py-2 bg-muted border border-border rounded-xl",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "transition-all duration-200"
                )}
              />
            </div>
            {errors.time && <p className="mt-1 text-sm text-destructive">{errors.time.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Timezone <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
              <select
                {...register('timezone')}
                className={cn(
                  "w-full pl-10 pr-3 py-2 bg-muted border border-border rounded-xl",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "transition-all duration-200 appearance-none cursor-pointer"
                )}
              >
                {TIMEZONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            {errors.timezone && <p className="mt-1 text-sm text-destructive">{errors.timezone.message}</p>}
          </div>
        </div>

        {/* Caption */}
        <div className="grid grid-cols-1 gap-2">
          <label className="block text-sm font-medium text-foreground">Caption</label>
          <textarea
            rows={8}
            {...register('caption')}
            className={cn(
              "w-full px-3 py-2 bg-muted border border-border rounded-xl",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "transition-all duration-200"
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            type="button"
            onClick={onDelete}
            className={cn(
              "h-12 px-6 py-3 rounded-full",
              "border border-border text-destructive bg-background",
              "transition-all duration-200 hover:bg-accent"
            )}
          >
            Delete
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "h-12 px-6 py-3 rounded-full",
                "bg-background border border-border text-foreground",
                "transition-all duration-200 hover:bg-accent"
              )}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={cn(
                "h-12 px-6 py-3 rounded-full",
                "bg-primary text-primary-foreground border border-border",
                "transition-all duration-200 hover:bg-primary/90"
              )}
            >
              Confirm
            </button>
          </div>
        </div>
      </form>
    </Modal>
  )
}

// Common timezone options (kept consistent with SchedulingModal)
const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
]
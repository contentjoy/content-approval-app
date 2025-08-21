'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle, Calendar, Clock, Globe, ChevronDown } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { useBranding } from '@/contexts/branding-context'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { SocialMediaPost } from '@/types'

interface SchedulingModalProps {
  isOpen: boolean
  onClose: () => void
  approvedPosts?: SocialMediaPost[]
  onSuccess?: (detail?: any) => void
}

export function SchedulingModal({
  isOpen,
  onClose,
  approvedPosts = [],
  onSuccess
}: SchedulingModalProps) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [timezone, setTimezone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { gymName } = useBranding()

  useEffect(() => {
    if (!isOpen) return
    // Reset form on open
    setDate('')
    setTime('')
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !time || !timezone) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement scheduling logic
      toast.success('Posts scheduled successfully')
      onClose()
    } catch (error) {
      toast.error('Failed to schedule posts')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-muted rounded-lg p-4 border border-border">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-foreground text-sm leading-tight">
                {approvedPosts.length} Posts Ready to Schedule
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                All posts have been approved and are ready for scheduling
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {/* Date picker */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                  "transition-all duration-200"
                )}
              />
            </div>

            {/* Time picker */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                  "transition-all duration-200"
                )}
              />
            </div>

            {/* Timezone selector */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={cn(
                  "w-full pl-10 pr-3 py-2 bg-background border border-border rounded-lg",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                  "transition-all duration-200 appearance-none cursor-pointer"
                )}
              >
                <option value="">Select timezone</option>
                {Intl.supportedValuesOf('timeZone').map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Schedule info */}
        <div className="bg-muted rounded-lg p-4 border border-border">
          <h4 className="font-medium text-foreground mb-2">Scheduling Timeline</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Start Date: {date ? new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}</p>
            <p>Post Time: {time ? `${time} ${timezone}` : 'Not set'}</p>
            <p>End Date: {date ? new Date(new Date(date).getTime() + (approvedPosts.length - 1) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Not set'}</p>
            <p>Duration: {approvedPosts.length} days</p>
            <p>Posts: {approvedPosts.length} approved posts</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className={cn(
              "h-12 px-6 py-3 rounded-full border border-border text-foreground",
              "bg-background transition-all duration-200 hover:bg-accent disabled:opacity-50"
            )}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "h-12 px-6 py-3 rounded-full",
              "bg-primary text-primary-foreground",
              "border border-border transition-all duration-200",
              "hover:bg-primary/90 disabled:opacity-50"
            )}
          >
            Schedule Posts
          </button>
        </div>
      </form>
    </Modal>
  )
}
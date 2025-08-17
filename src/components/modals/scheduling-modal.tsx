'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, Globe } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { BrandedButton } from '@/components/ui/branded-button'
import { useToast } from '@/components/ui/toast'
import { useBranding } from '@/contexts/branding-context'
import { useParams } from 'next/navigation'
import type { SocialMediaPost } from '@/types'

const schedulingSchema = z.object({
  frequency: z.enum(['daily', 'every-other-day']),
  startDate: z.string().min(1, 'Start date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  timezone: z.string().min(1, 'Timezone is required'),
})

type SchedulingFormData = z.infer<typeof schedulingSchema>

interface SchedulingModalProps {
  isOpen: boolean
  onClose: () => void
  approvedPosts: SocialMediaPost[]
  onSuccess?: () => void
}

// Common timezone options
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

export function SchedulingModal({ isOpen, onClose, approvedPosts, onSuccess }: SchedulingModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()
  const { gymName } = useBranding()
  const params = useParams()
  const gymSlug = params.gymSlug as string

  // Get current timezone as default
  const getCurrentTimezone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone
    } catch {
      return 'UTC'
    }
  }

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<SchedulingFormData>({
    resolver: zodResolver(schedulingSchema),
    defaultValues: {
      frequency: 'daily',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      timezone: getCurrentTimezone(),
    },
  })

  // Set timezone on mount
  useEffect(() => {
    setValue('timezone', getCurrentTimezone())
  }, [setValue])

  const watchedFrequency = watch('frequency')
  const watchedStartDate = watch('startDate')
  const watchedStartTime = watch('startTime')
  const watchedTimezone = watch('timezone')

  const getDuration = () => {
    if (watchedFrequency === 'daily') {
      return approvedPosts.length
    } else {
      return approvedPosts.length * 2
    }
  }

  const getEndDate = () => {
    if (!watchedStartDate) return null
    
    const startDate = new Date(watchedStartDate)
    const duration = getDuration()
    const endDate = new Date(startDate)
    
    if (watchedFrequency === 'daily') {
      endDate.setDate(startDate.getDate() + duration - 1)
    } else {
      endDate.setDate(startDate.getDate() + (duration - 1) * 2)
    }
    
    return endDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  // Format time to 12-hour format for webhook
  const formatTimeForWebhook = (time: string) => {
    try {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return `${displayHour}:${minutes} ${ampm}`
    } catch {
      return time
    }
  }

  // Format gym name from slug (convert dashes to spaces and capitalize)
  const formatGymName = (slug: string) => {
    return slug
      .replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const onSubmit = async (data: SchedulingFormData) => {
    setIsLoading(true)
    
    try {
      const webhookData = {
        "Gym name": formatGymName(gymSlug),
        "Time": formatTimeForWebhook(data.startTime),
        "Start Date": data.startDate,
        "Timezone": data.timezone,
        // Additional metadata for reference
        frequency: data.frequency,
        postCount: approvedPosts.length,
        duration: getDuration(),
        endDate: getEndDate()
      }

      console.log('📅 Sending scheduling webhook:', webhookData)

      const response = await fetch('https://contentjoy.app.n8n.cloud/webhook/5248a598-d8b8-411e-bca4-0b8f4be5dc5d', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      })

      if (!response.ok) {
        throw new Error('Failed to schedule posts')
      }

      showToast({
        type: 'success',
        title: 'Posts scheduled!',
        message: `Scheduled ${approvedPosts.length} posts to start on ${new Date(data.startDate).toLocaleDateString()} at ${formatTimeForWebhook(data.startTime)} ${data.timezone}`
      })
      
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error scheduling posts:', error)
      showToast({
        type: 'error',
        title: 'Scheduling failed',
        message: 'Unable to schedule posts. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Posts"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Posts Ready Info */}
        <div className="bg-[var(--modal-surface)] rounded-[12px] p-4 border border-[var(--modal-border)]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[var(--hover)] rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-[var(--text)]" />
            </div>
            <div>
              <h3 className="font-medium text-[var(--text)] text-sm">
                {approvedPosts.length} Posts Ready to Schedule
              </h3>
              <p className="text-xs text-[var(--muted-text)] opacity-80">
                All posts have been approved and are ready for scheduling
              </p>
            </div>
          </div>
        </div>

        {/* Scheduling Options */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-3">
            Scheduling Frequency:
          </label>
          <div className="space-y-3">
            <label className="flex items-center space-x-3 p-4 border border-[var(--modal-border)] rounded-[12px] hover:bg-[var(--hover)] cursor-pointer transition-all duration-200">
              <input
                type="radio"
                value="daily"
                {...register('frequency')}
                className="text-[var(--modal-surface)] focus:ring-[var(--modal-surface)]"
              />
              <div className="flex-1">
                <div className="font-medium text-[var(--text)]">One post per day</div>
                <div className="text-sm text-[var(--muted-text)]">
                  Duration: {approvedPosts.length} days
                </div>
              </div>
            </label>
            <label className="flex items-center space-x-3 p-4 border border-[var(--modal-border)] rounded-[12px] hover:bg-[var(--hover)] cursor-pointer transition-all duration-200">
              <input
                type="radio"
                value="every-other-day"
                {...register('frequency')}
                className="text-[var(--modal-surface)] focus:ring-[var(--modal-surface)]"
              />
              <div className="flex-1">
                <div className="font-medium text-[var(--text)]">Every other day</div>
                <div className="text-sm text-[var(--muted-text)]">
                  Duration: {approvedPosts.length * 2} days
                </div>
              </div>
            </label>
          </div>
            {errors.frequency && (
              <p className="mt-1 text-sm text-destructive">{errors.frequency.message}</p>
            )}
        </div>

        {/* Date, Time, and Timezone Selection */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-2">
              Start Date <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              id="startDate"
              {...register('startDate')}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 bg-[var(--modal-surface)] border border-[var(--modal-border)] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--modal-surface)] focus:border-transparent transition-all duration-200"
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-destructive">{errors.startDate.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-foreground mb-2">
              Post Time <span className="text-destructive">*</span>
            </label>
            <input
              type="time"
              id="startTime"
              {...register('startTime')}
              className="w-full px-3 py-2 bg-[var(--modal-surface)] border border-[var(--modal-border)] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--modal-surface)] focus:border-transparent transition-all duration-200"
            />
            {errors.startTime && (
              <p className="mt-1 text-sm text-destructive">{errors.startTime.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="timezone" className="block text-sm font-medium text-foreground mb-2">
              Timezone <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-4 w-4 text-[var(--muted-text)]" />
              </div>
              <select
                id="timezone"
                {...register('timezone')}
                className="w-full pl-10 pr-3 py-2 bg-[var(--modal-surface)] border border-[var(--modal-border)] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--modal-surface)] focus:border-transparent transition-all duration-200 appearance-none cursor-pointer"
              >
                {TIMEZONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-[var(--muted-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.timezone && (
              <p className="mt-1 text-sm text-destructive">{errors.timezone.message}</p>
            )}
          </div>
        </div>

        {/* Timeline Preview */}
        {watchedStartDate && (
          <div className="bg-[var(--modal-surface)] rounded-[12px] p-4 border border-[var(--modal-border)]">
            <h4 className="font-medium text-[var(--text)] mb-2">Scheduling Timeline</h4>
            <div className="space-y-2 text-sm text-[var(--muted-text)]">
              <p><strong>Start Date:</strong> {new Date(watchedStartDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Post Time:</strong> {formatTimeForWebhook(watchedStartTime)} {watchedTimezone}</p>
              <p><strong>End Date:</strong> {getEndDate()}</p>
              <p><strong>Duration:</strong> {getDuration()} {watchedFrequency === 'daily' ? 'days' : 'days (every other day)'}</p>
              <p><strong>Posts:</strong> {approvedPosts.length} approved posts</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--modal-border)]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-12 px-6 py-3 rounded-[999px] border border-[var(--border)] text-[var(--text)] bg-transparent transition-all duration-200 hover:bg-[var(--modal-surface)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="h-12 px-6 py-3 rounded-[999px] bg-[#111113] dark:bg-[#FCFCFC] text-[#FCFCFC] dark:text-[#111113] border border-[var(--modal-border)] transition-all duration-200 hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FCFCFC] dark:border-[#111113]"></div>
                <span>Scheduling...</span>
              </div>
            ) : (
              'Schedule Posts'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}



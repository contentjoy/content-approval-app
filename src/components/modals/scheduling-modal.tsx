'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { BrandedButton } from '@/components/ui/branded-button'
import { useToast } from '@/components/ui/toast'
import { useBranding } from '@/contexts/branding-context'
import type { SocialMediaPost } from '@/types'

const schedulingSchema = z.object({
  frequency: z.enum(['daily', 'every-other-day']),
  startDate: z.string().min(1, 'Start date is required'),
  startTime: z.string().min(1, 'Start time is required'),
})

type SchedulingFormData = z.infer<typeof schedulingSchema>

interface SchedulingModalProps {
  isOpen: boolean
  onClose: () => void
  approvedPosts: SocialMediaPost[]
  onSuccess?: () => void
}

export function SchedulingModal({ isOpen, onClose, approvedPosts, onSuccess }: SchedulingModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()
  const { gymName } = useBranding()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SchedulingFormData>({
    resolver: zodResolver(schedulingSchema),
    defaultValues: {
      frequency: 'daily',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
    },
  })

  const watchedFrequency = watch('frequency')
  const watchedStartDate = watch('startDate')

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

  const onSubmit = async (data: SchedulingFormData) => {
    setIsLoading(true)
    
    try {
      const webhookData = {
        startDate: data.startDate,
        gymName: gymName || 'Unknown Gym',
        clientId: 'gym-' + Date.now(), // Generate a unique client ID
        frequency: data.frequency,
        time: data.startTime,
        postCount: approvedPosts.length,
        duration: getDuration(),
        endDate: getEndDate()
      }

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
        title: 'Posts scheduled successfully',
        message: `Scheduled ${approvedPosts.length} posts to start on ${new Date(data.startDate).toLocaleDateString()}`
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
        {/* Approved Posts Summary */}
        <div className="bg-accent/10 rounded-lg p-4 border border-accent/20">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-medium text-accent text-sm">
                {approvedPosts.length} Posts Ready to Schedule
              </h3>
              <p className="text-xs text-accent opacity-80">
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
            <label className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted cursor-pointer">
              <input
                type="radio"
                value="daily"
                {...register('frequency')}
                className="text-accent focus:ring-accent"
              />
              <div className="flex-1">
                <div className="font-medium text-foreground">One post per day</div>
                <div className="text-sm text-muted-foreground">
                  Duration: {approvedPosts.length} days
                </div>
              </div>
            </label>
            <label className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-muted cursor-pointer">
              <input
                type="radio"
                value="every-other-day"
                {...register('frequency')}
                className="text-accent focus:ring-accent"
              />
              <div className="flex-1">
                <div className="font-medium text-foreground">Every other day</div>
                <div className="text-sm text-muted-foreground">
                  Duration: {approvedPosts.length * 2} days
                </div>
              </div>
            </label>
          </div>
            {errors.frequency && (
              <p className="mt-1 text-sm text-destructive">{errors.frequency.message}</p>
            )}
        </div>

        {/* Date and Time Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-foreground mb-2">
              Start Date <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              id="startDate"
              {...register('startDate')}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
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
              className="w-full px-3 py-2 bg-muted border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            {errors.startTime && (
              <p className="mt-1 text-sm text-destructive">{errors.startTime.message}</p>
            )}
          </div>
        </div>

        {/* Timeline Preview */}
        {watchedStartDate && (
          <div className="bg-bg-elev-1 rounded-lg p-4 border border-border">
            <h4 className="font-medium text-text mb-2">Scheduling Timeline</h4>
            <div className="space-y-2 text-sm text-muted-text">
              <p><strong>Start Date:</strong> {new Date(watchedStartDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>End Date:</strong> {getEndDate()}</p>
              <p><strong>Duration:</strong> {getDuration()} {watchedFrequency === 'daily' ? 'days' : 'days (every other day)'}</p>
              <p><strong>Posts:</strong> {approvedPosts.length} approved posts</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <BrandedButton
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </BrandedButton>
          <BrandedButton
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Scheduling...</span>
              </div>
            ) : (
              'Schedule Posts'
            )}
          </BrandedButton>
        </div>
      </form>
    </Modal>
  )
}



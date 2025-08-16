'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/modal'
import { BrandedButton } from '@/components/ui/branded-button'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import type { SocialMediaPost } from '@/types'

const captionSchema = z.object({
  caption: z.string().min(1, 'Caption cannot be empty').max(2200, 'Caption must be less than 2200 characters'),
})

type CaptionFormData = z.infer<typeof captionSchema>

interface EditCaptionModalProps {
  isOpen: boolean
  onClose: () => void
  post: SocialMediaPost
  onSuccess?: () => void
}

export function EditCaptionModal({ isOpen, onClose, post, onSuccess }: EditCaptionModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CaptionFormData>({
    resolver: zodResolver(captionSchema),
    defaultValues: {
      caption: post['Post Caption'] || '',
    },
  })

  const watchedCaption = watch('caption')

  const onSubmit = async (data: CaptionFormData) => {
    setIsLoading(true)
    
    try {
      const { error } = await supabase
        .from('social_media_posts')
        .update({ 'Post Caption': data.caption })
        .eq('id', post.id)

      if (error) {
        throw error
      }

      showToast({
        type: 'success',
        title: 'Caption updated',
        message: 'Post caption has been updated successfully'
      })
      
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error updating caption:', error)
      showToast({
        type: 'error',
        title: 'Update failed',
        message: 'Unable to update caption. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Caption"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Caption */}
        <div>
          <label htmlFor="caption" className="block text-sm font-medium text-foreground mb-2">
            Caption
          </label>
          <textarea
            id="caption"
            rows={Math.min(18, Math.max(10, Math.ceil((watchedCaption?.length || 0) / 90)))}
            {...register('caption')}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-[var(--modal-surface)] text-text placeholder:text-muted-text resize min-h-[10rem] max-h-[60vh]"
            placeholder="Write your post caption here..."
          />
          {errors.caption && (
            <p className="mt-1 text-sm text-destructive">{errors.caption.message}</p>
          )}
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-muted-foreground">
              {watchedCaption.length}/2200 characters
            </p>
            {watchedCaption.length > 2000 && (
              <p className="text-sm text-accent-strong">
                {watchedCaption.length > 2200 ? 'Over limit' : 'Approaching limit'}
              </p>
            )}
          </div>
        </div>

        {/* Character Count Warning */}
        {watchedCaption.length > 2000 && (
          <div className="bg-accent-strong/10 rounded-lg p-4 border border-accent-strong/20">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-accent-strong" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm text-accent-strong">
                {watchedCaption.length > 2200 
                  ? 'Caption exceeds the maximum character limit'
                  : 'Caption is approaching the maximum character limit'
                }
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-12 px-6 py-3 rounded-[999px] bg-transparent border border-[var(--border)] text-[var(--text)] transition-all duration-200 hover:bg-[var(--modal-surface)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || watchedCaption.length === 0 || watchedCaption.length > 2200}
            className="h-12 px-6 py-3 rounded-[999px] bg-[#111113] dark:bg-[#FCFCFC] text-[#FCFCFC] dark:text-[#111113] transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FCFCFC] dark:border-[#111113]"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Caption'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

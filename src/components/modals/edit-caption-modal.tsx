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
        {/* Post Preview */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-semibold">
                {post['Asset Type']?.toLowerCase() === 'video' ? '🎥' : '📷'}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {post['Content Type'] || 'Social Media Post'}
              </h3>
              <p className="text-sm text-gray-500">
                {post['Asset Type'] || 'Image'} • {post['Carousel Group'] ? `Carousel slide ${post['Carousel Order']}` : 'Single'}
              </p>
            </div>
          </div>
        </div>

        {/* Caption */}
        <div>
          <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
            Caption
          </label>
          <textarea
            id="caption"
            rows={6}
            {...register('caption')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent resize-none"
            placeholder="Write your post caption here..."
          />
          {errors.caption && (
            <p className="mt-1 text-sm text-red-600">{errors.caption.message}</p>
          )}
          <div className="flex justify-between items-center mt-1">
            <p className="text-sm text-gray-500">
              {watchedCaption.length}/2200 characters
            </p>
            {watchedCaption.length > 2000 && (
              <p className="text-sm text-yellow-600">
                {watchedCaption.length > 2200 ? 'Over limit' : 'Approaching limit'}
              </p>
            )}
          </div>
        </div>

        {/* Character Count Warning */}
        {watchedCaption.length > 2000 && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm text-yellow-800">
                {watchedCaption.length > 2200 
                  ? 'Caption exceeds the maximum character limit'
                  : 'Caption is approaching the maximum character limit'
                }
              </p>
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
            disabled={isLoading || watchedCaption.length === 0 || watchedCaption.length > 2200}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </div>
            ) : (
              'Save Caption'
            )}
          </BrandedButton>
        </div>
      </form>
    </Modal>
  )
}

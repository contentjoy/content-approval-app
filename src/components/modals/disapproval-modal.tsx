'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { XCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { BrandedButton } from '@/components/ui/branded-button'
import { useToast } from '@/components/ui/toast'
import { updatePostApproval } from '@/lib/database'
import type { SocialMediaPost } from '@/types'

const disapprovalSchema = z.object({
  feedback: z.string().min(10, 'Feedback must be at least 10 characters'),
  carouselAction: z.enum(['current', 'all']).optional(),
})

type DisapprovalFormData = z.infer<typeof disapprovalSchema>

interface DisapprovalModalProps {
  isOpen: boolean
  onClose: () => void
  post: SocialMediaPost
  carouselPosts: SocialMediaPost[]
  onSuccess?: () => void
}

export function DisapprovalModal({ isOpen, onClose, post, carouselPosts, onSuccess }: DisapprovalModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()
  
  const isCarousel = post['Carousel Group'] && carouselPosts.length > 1

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<DisapprovalFormData>({
    resolver: zodResolver(disapprovalSchema),
    defaultValues: {
      feedback: '',
      carouselAction: isCarousel ? 'current' : undefined,
    },
  })

  const watchedFeedback = watch('feedback')
  const watchedCarouselAction = watch('carouselAction')

  const onSubmit = async (data: DisapprovalFormData) => {
    setIsLoading(true)
    
    try {
      if (isCarousel && data.carouselAction === 'all') {
        // Disapprove all carousel posts
        const carouselGroup = post['Carousel Group']
        const postsToDisapprove = carouselPosts.filter(p => p['Carousel Group'] === carouselGroup)
        
        for (const carouselPost of postsToDisapprove) {
          await updatePostApproval(carouselPost.id, 'rejected', data.feedback)
        }
        
        showToast({
          type: 'warning',
          title: 'Carousel disapproved',
          message: `Disapproved all ${postsToDisapprove.length} slides with feedback`
        })
      } else {
        // Disapprove single post or current carousel slide
        await updatePostApproval(post.id, 'rejected', data.feedback)
        
        showToast({
          type: 'warning',
          title: 'Post disapproved',
          message: 'Post has been rejected with feedback'
        })
      }
      
      onSuccess?.()
      onClose()
    } catch (error) {
      console.error('Error disapproving post:', error)
      showToast({
        type: 'error',
        title: 'Disapproval failed',
        message: 'Unable to disapprove post. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Disapprove Content"
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Post Preview */}
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {post['Content Type'] || 'Social Media Post'}
              </h3>
              <p className="text-sm text-gray-500">
                {post['Asset Type'] || 'Image'} • {isCarousel ? `Carousel (${carouselPosts.length} slides)` : 'Single'}
              </p>
            </div>
          </div>
          
          {post['Post Caption'] && (
            <p className="text-sm text-gray-700 line-clamp-2">
              {post['Post Caption']}
            </p>
          )}
        </div>

        {/* Feedback */}
        <div>
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
            Feedback <span className="text-red-500">*</span>
          </label>
          <textarea
            id="feedback"
            rows={4}
            {...register('feedback')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:border-transparent resize-none"
            placeholder="Please provide specific feedback on why this content is being disapproved..."
          />
          {errors.feedback && (
            <p className="mt-1 text-sm text-red-600">{errors.feedback.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {watchedFeedback.length}/10 characters minimum
          </p>
        </div>

        {/* Carousel Options */}
        {isCarousel && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Carousel Action:
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="current"
                  {...register('carouselAction')}
                  className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                />
                <div>
                  <div className="font-medium text-gray-900">Disapprove current slide</div>
                  <div className="text-sm text-gray-500">Only disapprove this slide ({post['Carousel Order']} of {carouselPosts.length})</div>
                </div>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="all"
                  {...register('carouselAction')}
                  className="text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                />
                <div>
                  <div className="font-medium text-gray-900">Disapprove all slides</div>
                  <div className="text-sm text-gray-500">Disapprove all {carouselPosts.length} slides in this carousel</div>
                </div>
              </label>
            </div>
            {errors.carouselAction && (
              <p className="mt-1 text-sm text-red-600">{errors.carouselAction.message}</p>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="bg-red-50 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-2">Summary</h4>
          <p className="text-sm text-red-700">
            {isCarousel && watchedCarouselAction === 'all' 
              ? `Disapprove all ${carouselPosts.length} carousel slides with feedback`
              : `Disapprove ${isCarousel ? 'current slide' : 'post'} with feedback`
            }
          </p>
        </div>

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
            disabled={isLoading || watchedFeedback.length < 10}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Disapproving...</span>
              </div>
            ) : (
              'Disapprove Content'
            )}
          </BrandedButton>
        </div>
      </form>
    </Modal>
  )
}

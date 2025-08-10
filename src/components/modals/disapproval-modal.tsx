'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { XCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { BrandedButton } from '@/components/ui/branded-button'
import { useToast } from '@/components/ui/toast'
import { updatePostApproval, updateCarouselGroupApproval } from '@/lib/database'
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
  onSuccess?: (detail?: any) => void
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
        await updateCarouselGroupApproval(post['Carousel Group'] as string, 'Disapproved', {
          feedback: data.feedback
        })
        showToast({
          type: 'warning',
          title: 'Carousel disapproved',
          message: `Disapproved all ${carouselPosts.length} slides with feedback`
        })
        onSuccess?.({ type: 'disapproved-group', group: post['Carousel Group'], feedback: data.feedback })
      } else {
        await updatePostApproval(post.id as string, 'Disapproved', {
          feedback: data.feedback
        })
        showToast({
          type: 'warning',
          title: 'Post disapproved',
          message: 'Post has been disapproved with feedback'
        })
        onSuccess?.({ type: 'disapproved', id: post.id, feedback: data.feedback })
      }
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
        <div className="bg-muted rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-destructive/10 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">
                {post['Content Type'] || 'Social Media Post'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {post['Asset Type'] || 'Image'} • {isCarousel ? `Carousel (${carouselPosts.length} slides)` : 'Single'}
              </p>
            </div>
          </div>
          
          {post['Post Caption'] && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {post['Post Caption']}
            </p>
          )}
        </div>

        {/* Feedback */}
        <div>
          <label htmlFor="feedback" className="block text-sm font-medium text-foreground mb-2">
            Feedback <span className="text-destructive">*</span>
          </label>
          <textarea
            id="feedback"
            rows={8}
            {...register('feedback')}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent resize bg-bg text-text placeholder:text-muted-text max-h-[50vh]"
            placeholder="Please provide specific feedback on why this content is being disapproved..."
          />
          {errors.feedback && (
            <p className="mt-1 text-sm text-destructive">{errors.feedback.message}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {watchedFeedback.length}/10 characters minimum
          </p>
        </div>

        {/* Carousel Options */}
        {isCarousel && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Carousel Action:
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="current"
                  {...register('carouselAction')}
                  className="text-accent focus:ring-accent"
                />
                <div>
                  <div className="font-medium text-foreground">Disapprove current slide</div>
                  <div className="text-sm text-muted-foreground">Only disapprove this slide ({post['Carousel Order']} of {carouselPosts.length})</div>
                </div>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="all"
                  {...register('carouselAction')}
                  className="text-accent focus:ring-accent"
                />
                <div>
                  <div className="font-medium text-foreground">Disapprove all slides</div>
                  <div className="text-sm text-muted-foreground">Disapprove all {carouselPosts.length} slides in this carousel</div>
                </div>
              </label>
            </div>
            {errors.carouselAction && (
              <p className="mt-1 text-sm text-destructive">{errors.carouselAction.message}</p>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="bg-destructive/10 rounded-lg p-4 border border-destructive/20">
          <h4 className="font-medium text-destructive mb-2">Summary</h4>
          <p className="text-sm text-destructive">
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
            className="bg-destructive hover:bg-destructive/90 text-background"
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

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
  feedback: z.string().optional(),
  carouselAction: z.enum(['current', 'all']).optional(),
})

type DisapprovalFormData = z.infer<typeof disapprovalSchema>

interface DisapprovalModalProps {
  isOpen: boolean
  onClose: () => void
  post: SocialMediaPost
  carouselPosts: SocialMediaPost[]
  onSuccess?: (detail?: any) => void
  bulkPosts?: SocialMediaPost[]
}

export function DisapprovalModal({ isOpen, onClose, post, carouselPosts, onSuccess, bulkPosts = [] }: DisapprovalModalProps) {
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

  const watchedFeedback = watch('feedback') || ''
  const watchedCarouselAction = watch('carouselAction')

  const onSubmit = async (data: DisapprovalFormData) => {
    setIsLoading(true)
    
    try {
      if (bulkPosts.length > 1) {
        const uniqueGroups = Array.from(new Set(bulkPosts.filter(p => p['Carousel Group']).map(p => p['Carousel Group'] as string)))
        for (const group of uniqueGroups) {
          await updateCarouselGroupApproval(group, 'Disapproved', { feedback: data.feedback })
        }
        const singles = bulkPosts.filter(p => !p['Carousel Group'])
        for (const single of singles) {
          await updatePostApproval(single.id as string, 'Disapproved', { feedback: data.feedback })
        }
        onSuccess?.({ type: 'disapproved-bulk', feedback: data.feedback })
      } else if (isCarousel && data.carouselAction === 'all') {
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
        <div className="bg-[var(--modal-surface)] rounded-lg p-4 border border-[var(--modal-border)]">
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
          <label htmlFor="feedback" className="block text-sm font-medium text-[var(--text)] mb-2">
            Feedback <span className="text-destructive">*</span>
          </label>
          <textarea
            id="feedback"
            rows={12}
            {...register('feedback')}
            className="w-full px-3 py-2 border border-[var(--modal-border)] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--surface)] focus:border-transparent bg-[var(--modal-surface)] text-[var(--text)] placeholder:text-[var(--muted-text)] resize min-h-[10rem] max-h-[60vh] transition-all duration-200"
            placeholder="Please provide specific feedback on why this content is being disapproved..."
          />
          {errors.feedback && (
            <p className="mt-1 text-sm text-destructive">{errors.feedback.message}</p>
          )}
          <p className="mt-1 text-sm text-[var(--muted-text)]">
            {watchedFeedback.length} characters
          </p>
        </div>

        {/* Carousel Options */}
        {isCarousel && (
          <div>
            <label className="block text-sm font-medium text-[var(--text)] mb-3">
              Carousel Action:
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="current"
                  {...register('carouselAction')}
                  className="text-[var(--surface)] focus:ring-[var(--surface)]"
                />
                <div>
                  <div className="font-medium text-[var(--text)]">Disapprove current slide</div>
                  <div className="text-sm text-[var(--muted-text)]">Only disapprove this slide ({post['Carousel Order']} of {carouselPosts.length})</div>
                </div>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="radio"
                  value="all"
                  {...register('carouselAction')}
                  className="text-[var(--surface)] focus:ring-[var(--surface)]"
                />
                <div>
                  <div className="font-medium text-[var(--text)]">Disapprove all slides</div>
                  <div className="text-sm text-[var(--muted-text)]">Disapprove all {carouselPosts.length} slides in this carousel</div>
                </div>
              </label>
            </div>
            {errors.carouselAction && (
              <p className="mt-1 text-sm text-destructive">{errors.carouselAction.message}</p>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="bg-[var(--modal-surface)] border border-[var(--modal-border)] rounded-[12px] p-4">
          <h4 className="font-medium text-[var(--text)] mb-2">Summary</h4>
          <p className="text-sm text-[var(--muted-text)]">
            {isCarousel && watchedCarouselAction === 'all' 
              ? `Disapprove all ${carouselPosts.length} carousel slides with feedback`
              : `Disapprove ${isCarousel ? 'current slide' : 'post'} with feedback`
            }
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[var(--modal-border)]">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-10 px-6 py-2 rounded-[999px] border border-[var(--modal-border)] text-[var(--text)] bg-transparent transition-all duration-200 hover:bg-[var(--hover)] hover:border-[var(--modal-border)] disabled:opacity-50"
          >
            Cancel
          </button>
          <BrandedButton
            type="submit"
            disabled={isLoading}
            className="h-10 px-6 py-2 rounded-[999px] bg-[var(--surface)] text-[var(--foreground)] border border-[var(--modal-border)] transition-all duration-200 hover:bg-[var(--hover)] disabled:opacity-50"
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

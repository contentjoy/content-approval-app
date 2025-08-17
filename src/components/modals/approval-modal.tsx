'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { BrandedButton } from '@/components/ui/branded-button'
import { useToast } from '@/components/ui/toast'
import { updatePostApproval, updateCarouselGroupApproval } from '@/lib/database'
import type { SocialMediaPost } from '@/types'

const approvalSchema = z.object({
  approvalType: z.enum(['story', 'post']),
  carouselAction: z.enum(['current', 'all']).optional(),
})

type ApprovalFormData = z.infer<typeof approvalSchema>

interface ApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  post: SocialMediaPost
  carouselPosts: SocialMediaPost[]
  onSuccess?: (detail?: any) => void
  bulkPosts?: SocialMediaPost[]
}

export function ApprovalModal({ isOpen, onClose, post, carouselPosts, onSuccess, bulkPosts = [] }: ApprovalModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { showToast } = useToast()
  
  const isCarousel = post['Carousel Group'] && carouselPosts.length > 1

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ApprovalFormData>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      approvalType: 'post',
      carouselAction: isCarousel ? 'current' : undefined,
    },
  })

  const watchedApprovalType = watch('approvalType')
  const watchedCarouselAction = watch('carouselAction')

  const onSubmit = async (data: ApprovalFormData) => {
    setIsLoading(true)
    
    try {
      // Only set Content Type to Story if user selected Story; otherwise leave unchanged
      const contentTypeOverride = data.approvalType === 'story' ? 'Story' : undefined

      if (bulkPosts.length > 1) {
        // Bulk approval across mixed selection (carousels + singles)
        const allIds: string[] = []
        for (const p of bulkPosts) {
          if (p['Carousel Group']) {
            // In bulk, approve entire group for any carousel item
            // We rely on updateCarouselGroupApproval for each unique group
          }
        }
        const uniqueGroups = Array.from(new Set(bulkPosts.filter(p => p['Carousel Group']).map(p => p['Carousel Group'] as string)))
        for (const group of uniqueGroups) {
          await updateCarouselGroupApproval(group, 'Approved', { contentType: contentTypeOverride })
        }
        const singles = bulkPosts.filter(p => !p['Carousel Group'])
        for (const single of singles) {
          await updatePostApproval(single.id as string, 'Approved', { contentType: contentTypeOverride })
        }
        onSuccess?.({ type: 'approved-bulk' })
      } else if (isCarousel && data.carouselAction === 'all') {
        // Approve all carousel posts in group, keep content type unchanged unless approving as Story
        await updateCarouselGroupApproval(post['Carousel Group'] as string, 'Approved', {
          contentType: contentTypeOverride
        })
        showToast({
          type: 'success',
          title: 'Carousel approved',
          message: `Approved all ${carouselPosts.length} slides${contentTypeOverride ? ' as Story' : ''}`
        })
        onSuccess?.({ type: 'approved-group', group: post['Carousel Group'] })
      } else {
        // Approve single post or current carousel slide
        await updatePostApproval(post.id as string, 'Approved', {
          contentType: contentTypeOverride
        })
        showToast({
          type: 'success',
          title: 'Post approved',
          message: `Approved${contentTypeOverride ? ' as Story' : ''}`
        })
        onSuccess?.({ type: 'approved', id: post.id })
      }
      onClose()
    } catch (error) {
      console.error('Error approving post:', error)
      showToast({
        type: 'error',
        title: 'Approval failed',
        message: 'Unable to approve post. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Approve Content"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Post Preview */}
        <div className="bg-[var(--modal-surface)] rounded-2xl p-4 border border-[var(--modal-border)]">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-accent rounded-2xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground leading-tight">
                {post['Content Type'] || 'Social Media Post'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {post['Asset Type'] || 'Image'} • {isCarousel ? `Carousel (${carouselPosts.length} slides)` : 'Single'}
              </p>
            </div>
          </div>
          
          {post['Post Caption'] && (
            <p className="text-sm text-muted-text line-clamp-2">
              {post['Post Caption']}
            </p>
          )}
        </div>

        {/* Approval Type */}
        <div>
          <label className="block text-sm font-medium text-text mb-3">
            Approve as:
          </label>
          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                value="post"
                {...register('approvalType')}
                className="text-accent focus:ring-accent"
              />
              <div>
                <div className="font-medium text-text">Post</div>
                <div className="text-sm text-muted-text">Regular social media post</div>
              </div>
            </label>
            <label className="flex items-center space-x-3">
              <input
                type="radio"
                value="story"
                {...register('approvalType')}
                className="text-accent focus:ring-accent"
              />
              <div>
                <div className="font-medium text-text">Story</div>
                <div className="text-sm text-muted-text">24-hour story content</div>
              </div>
            </label>
          </div>
          {errors.approvalType && (
            <p className="mt-1 text-sm text-destructive">{errors.approvalType.message}</p>
          )}
        </div>

        {/* Carousel Options */}
        {isCarousel && (
          <div>
            <label className="block text-sm font-medium text-text mb-3">
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
                  <div className="font-medium text-text">Approve current slide</div>
                  <div className="text-sm text-muted-text">Only approve this slide ({post['Carousel Order']} of {carouselPosts.length})</div>
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
                  <div className="font-medium text-text">Approve all slides</div>
                  <div className="text-sm text-muted-text">Approve all {carouselPosts.length} slides in this carousel</div>
                </div>
              </label>
            </div>
            {errors.carouselAction && (
              <p className="mt-1 text-sm text-destructive">{errors.carouselAction.message}</p>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="bg-[var(--modal-surface)] rounded-2xl p-4 border border-[var(--modal-border)]">
          <h4 className="font-medium text-text mb-2">Summary</h4>
          <p className="text-sm text-muted-text">
            {isCarousel && watchedCarouselAction === 'all' 
              ? `Approve all ${carouselPosts.length} carousel slides as ${watchedApprovalType}`
              : `Approve ${isCarousel ? 'current slide' : 'post'} as ${watchedApprovalType}`
            }
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="h-12 px-6 py-3 rounded-[999px] bg-transparent border border-[var(--border)] text-[var(--text)] transition-all duration-200 hover:bg-[var(--modal-surface)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="h-12 px-6 py-3 rounded-[999px] bg-[#111113] dark:bg-[#FCFCFC] text-[#FCFCFC] dark:text-[#111113] transition-all duration-200 hover:opacity-90 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#FCFCFC] dark:border-[#111113]"></div>
                <span>Approving...</span>
              </div>
            ) : (
              'Approve Content'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

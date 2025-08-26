'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import type { SocialMediaPost } from '@/types'
import { updatePostReason, updateCarouselGroupReason } from '@/lib/database'
import { cn } from '@/lib/utils'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
  post: SocialMediaPost
  carouselPosts?: SocialMediaPost[]
  onSuccess?: (detail?: any) => void
}

export function FeedbackModal({ isOpen, onClose, post, carouselPosts = [], onSuccess }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState(post['Reason'] || '')
  const [isLoading, setIsLoading] = useState(false)
  const isCarousel = post['Carousel Group'] && (carouselPosts?.length || 0) > 1

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      if (isCarousel) {
        await updateCarouselGroupReason(post['Carousel Group'] as string, feedback)
        onSuccess?.({ type: 'reason-group', group: post['Carousel Group'], feedback })
      } else {
        await updatePostReason(post.id, feedback)
        onSuccess?.({ type: 'reason', id: post.id, feedback })
      }
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Feedback</h2>
      </div>

      <div className="space-y-4">
        <textarea
          rows={8}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Add or edit feedback (Reason) for this post or carousel group"
          className={cn(
            "w-full px-3 py-2 border border-border rounded-xl",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "bg-muted text-foreground placeholder:text-muted-foreground",
            "resize min-h-[8rem] max-h-[50vh]"
          )}
        />
        <div className="flex justify-end space-x-3">
          <button
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
            onClick={handleSubmit}
            disabled={isLoading || !feedback.trim()}
            className={cn(
              "h-12 px-6 py-3 rounded-full",
              "bg-primary text-primary-foreground",
              "transition-all duration-200 hover:bg-primary/90 disabled:opacity-50"
            )}
          >
            {isLoading ? 'Saving…' : 'Save Feedback'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
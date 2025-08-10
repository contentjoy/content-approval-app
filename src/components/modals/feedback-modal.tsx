'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { BrandedButton } from '@/components/ui/branded-button'
import type { SocialMediaPost } from '@/types'
import { updatePostReason, updateCarouselGroupReason } from '@/lib/database'

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
    <Modal isOpen={isOpen} onClose={onClose} title="Feedback" size="md">
      <div className="space-y-4">
        <textarea
          rows={6}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Add or edit feedback (Reason) for this post or carousel group"
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-bg text-text placeholder:text-muted-text"
        />
        <div className="flex justify-end space-x-3">
          <BrandedButton variant="outline" onClick={onClose}>Cancel</BrandedButton>
          <BrandedButton onClick={handleSubmit} disabled={isLoading || !feedback.trim()}>
            {isLoading ? 'Saving…' : 'Save Feedback'}
          </BrandedButton>
        </div>
      </div>
    </Modal>
  )
}



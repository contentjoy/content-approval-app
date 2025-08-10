'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { BrandedButton } from '@/components/ui/branded-button'
import type { SocialMediaPost } from '@/types'
import { sendRegenerateRequest } from '@/lib/database'

interface RegenerateModalProps {
  isOpen: boolean
  onClose: () => void
  post: SocialMediaPost
  onSuccess?: () => void
}

export function RegenerateModal({ isOpen, onClose, post, onSuccess }: RegenerateModalProps) {
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await sendRegenerateRequest({
        feedback: feedback.trim(),
        gymName: post['Gym Name'],
        postId: post.id,
        templateId: post['Template ID'] || null,
      })
      onSuccess?.()
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Regenerate" size="md">
      <div className="space-y-4">
        <p className="text-sm text-muted-text">
          Describe how you want the new version to look (text direction, vibe, layout, etc.).
        </p>
        <textarea
          rows={6}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="e.g., Use bold white headline over the first frame, add subtle drop shadow, keep text under 12 words."
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-bg text-text placeholder:text-muted-text"
        />
        <div className="flex justify-end space-x-3">
          <BrandedButton variant="outline" onClick={onClose}>Cancel</BrandedButton>
          <BrandedButton onClick={handleSubmit} disabled={isLoading || !feedback.trim()}>
            {isLoading ? 'Sending…' : 'Regenerate'}
          </BrandedButton>
        </div>
      </div>
    </Modal>
  )
}



'use client'

import React, { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import type { SocialMediaPost } from '@/types'
import { sendRegenerateRequest } from '@/lib/database'
import { cn } from '@/lib/utils'

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
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Regenerate</h2>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Describe how you want the new version to look (text direction, vibe, layout, etc.).
        </p>
        <textarea
          rows={8}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="e.g., Use bold white headline over the first frame, add subtle drop shadow, keep text under 12 words."
          className={cn(
            "w-full px-3 py-2 border border-border rounded-xl",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "bg-muted text-foreground placeholder:text-muted-foreground",
            "resize min-h-[8rem] max-h-[50vh]"
          )}
        />
        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
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
            {isLoading ? 'Sending…' : 'Regenerate'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
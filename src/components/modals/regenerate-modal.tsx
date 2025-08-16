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
          rows={8}
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="e.g., Use bold white headline over the first frame, add subtle drop shadow, keep text under 12 words."
          className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-bg text-text placeholder:text-muted-text resize min-h-[8rem] max-h-[50vh]"
        />
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-transparent border border-[#FCFCFC] dark:border-[#111113] text-[#FCFCFC] dark:text-[#111113] rounded-lg hover:bg-[#FCFCFC] dark:hover:bg-[#111113] hover:text-[#111113] dark:hover:text-[#FCFCFC] transition-all duration-200 font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isLoading || !feedback.trim()}
            className="px-4 py-2 bg-[#FCFCFC] dark:bg-[#111113] text-[#111113] dark:text-[#FCFCFC] rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            {isLoading ? 'Sending…' : 'Regenerate'}
          </button>
        </div>
      </div>
    </Modal>
  )
}



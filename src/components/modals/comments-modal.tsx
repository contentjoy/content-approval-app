'use client'

import React, { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { BrandedButton } from '@/components/ui/branded-button'
import { getCommentsForPost, addCommentToPost } from '@/lib/database'
import type { SocialMediaPost } from '@/types'

interface CommentsModalProps {
  isOpen: boolean
  onClose: () => void
  post: SocialMediaPost
  onSuccess?: () => void
}

export function CommentsModal({ isOpen, onClose, post, onSuccess }: CommentsModalProps) {
  const [comments, setComments] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    getCommentsForPost(post.id).then(setComments)
  }, [isOpen, post.id])

  const handleAdd = async () => {
    if (!input.trim()) return
    setIsLoading(true)
    const newComment = {
      post_id: post.id,
      gym_id: post.gym_id,
      author_first_name: 'Team',
      author_last_name: 'Member',
      comment: input.trim()
    }
    const res = await addCommentToPost(newComment)
    if (res.success && res.comment) {
      setComments((prev) => [...prev, res.comment])
      setInput('')
      onSuccess?.()
    }
    setIsLoading(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Comments" size="md">
      <div className="space-y-4">
        <div className="max-h-72 overflow-auto space-y-3 pr-1">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-text">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="border border-border rounded-xl p-3">
                <div className="text-sm font-medium text-text">
                  {c.author_first_name} {c.author_last_name}
                  <span className="text-muted-text text-xs ml-2">{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <div className="text-sm text-text mt-1 whitespace-pre-wrap">{c.comment}</div>
              </div>
            ))
          )}
        </div>
        <div className="flex items-center space-x-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 h-11 rounded-full border border-border px-4 bg-bg focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <BrandedButton onClick={handleAdd} disabled={isLoading || !input.trim()}>
            {isLoading ? 'Adding...' : 'Add'}
          </BrandedButton>
        </div>
      </div>
    </Modal>
  )
}



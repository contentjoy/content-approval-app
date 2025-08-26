'use client'

import React, { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { getCommentsForPost, addCommentToPost } from '@/lib/database'
import { cn } from '@/lib/utils'
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
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Comments</h2>
      </div>

      <div className="space-y-4">
        <div className="max-h-72 overflow-auto space-y-3 pr-1">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="border border-border rounded-xl p-3">
                <div className="text-sm font-medium text-foreground">
                  {c.author_first_name} {c.author_last_name}
                  <span className="text-muted-foreground text-xs ml-2">{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <div className="text-sm text-foreground mt-1 whitespace-pre-wrap">{c.comment}</div>
              </div>
            ))
          )}
        </div>
        <div className="space-y-2">
          <textarea
            rows={4}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add a comment..."
            className={cn(
              "w-full border border-border rounded-lg px-3 py-2 bg-muted",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "resize-y min-h-[8rem] max-h-[50vh]"
            )}
          />
          <div className="flex justify-end">
            <button 
              onClick={handleAdd} 
              disabled={isLoading || !input.trim()}
              className={cn(
                "h-12 px-6 py-3 rounded-full",
                "bg-primary text-primary-foreground",
                "hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200 font-medium"
              )}
            >
              {isLoading ? 'Adding...' : 'Add Comment'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
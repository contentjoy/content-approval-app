'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EllipsisHorizontalIcon, ShareIcon, ArrowDownTrayIcon, PencilIcon, ChatBubbleLeftEllipsisIcon, HandThumbUpIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/hooks/use-toast'
import { useModalStore } from '@/hooks/use-modal-store'
import type { SocialMediaPost } from '@/types'

interface PostActionsProps {
  post: SocialMediaPost
  carouselPosts?: SocialMediaPost[]
  isLoading?: boolean
  mode?: 'full' | 'menu-only'
}

export function PostActions({ post, carouselPosts = [], isLoading = false, mode = 'full' }: PostActionsProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { showToast } = useToast()
  const { openModal } = useModalStore()

  const status = post['Approval Status']?.toLowerCase()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleApprove = () => {
    openModal('approve', post, carouselPosts)
  }

  const handleReject = () => {
    openModal('disapprove', post, carouselPosts)
  }

  const handleComments = () => {
    openModal('comments', post, carouselPosts)
  }

  const handleRegenerate = () => {
    openModal('regenerate', post, carouselPosts)
  }

  const handleFeedback = () => {
    openModal('feedback', post, carouselPosts)
  }

  const handleEditCaption = () => {
    openModal('edit-caption', post, carouselPosts)
    setShowMenu(false)
  }

  const handleShare = () => {
    if (navigator.share && post['Asset URL']) {
      navigator.share({
        title: post['Post Caption'] || 'Check out this post',
        url: post['Asset URL'],
      }).then(() => {
        showToast({
          type: 'success',
          title: 'Shared successfully',
          message: 'Post has been shared'
        })
      }).catch(() => {
        showToast({
          type: 'error',
          title: 'Share failed',
          message: 'Unable to share post'
        })
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(post['Asset URL'] || '').then(() => {
        showToast({
          type: 'success',
          title: 'Link copied',
          message: 'Post URL copied to clipboard'
        })
      }).catch(() => {
        showToast({
          type: 'error',
          title: 'Copy failed',
          message: 'Unable to copy link'
        })
      })
    }
    setShowMenu(false)
  }

  const handleDownload = () => {
    if (post['Asset URL']) {
      const link = document.createElement('a')
      link.href = post['Asset URL']
      link.download = `post-${post.id}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      showToast({
        type: 'success',
        title: 'Download started',
        message: 'Post is being downloaded'
      })
    } else {
      showToast({
        type: 'error',
        title: 'Download failed',
        message: 'No media available for download'
      })
    }
    setShowMenu(false)
  }

  const menuItems = [
    {
      label: 'Share',
      icon: ShareIcon,
      onClick: handleShare,
    },
    {
      label: 'Download',
      icon: ArrowDownTrayIcon,
      onClick: handleDownload,
    },
    {
      label: 'Edit Caption',
      icon: PencilIcon,
      onClick: handleEditCaption,
    },
    { label: 'Regenerate', icon: PencilIcon, onClick: handleRegenerate },
  ]

  return (
    <div className="flex items-center space-x-3">
      {/* Approval Actions */}
      {mode === 'full' && status === 'pending' && (
        <>
          <button
            onClick={handleApprove}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-accent hover:bg-accent/90 text-background shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HandThumbUpIcon className="w-4 h-4 mr-2" /> Approve
          </button>
          
          <button
            onClick={handleReject}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 border-accent text-accent bg-transparent hover:bg-accent hover:text-background shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <XMarkIcon className="w-4 h-4 mr-2" /> Disapprove
          </button>
        </>
      )}

      {/* Status-specific actions */}
      {mode === 'full' && status === 'approved' && (
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold bg-accent/10 text-accent">Approved</span>
          <button onClick={handleReject} className="text-accent text-sm underline">Disapprove</button>
          <button onClick={handleFeedback} className="text-text text-sm underline">Feedback</button>
        </div>
      )}

      {mode === 'full' && (status === 'rejected' || status === 'disapproved') ? (
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold bg-destructive/10 text-destructive">Disapproved</span>
          <button onClick={handleApprove} className="text-accent text-sm underline">Approve</button>
          <button onClick={handleFeedback} className="text-text text-sm underline">Feedback</button>
        </div>
      ) : null}

      {/* Three-dot Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2.5 text-muted-text hover:text-text hover:bg-bg-elev-1 rounded-full transition-all duration-200 hover:shadow-sm"
        >
          <EllipsisHorizontalIcon className="w-4 h-4" />
        </button>

        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="absolute right-0 top-full mt-2 w-48 bg-bg rounded-xl shadow-large border border-border py-2 z-[99999] overflow-visible"
              style={{ 
                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' 
              }}
            >
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="w-full flex items-center px-4 py-3 text-sm text-text hover:bg-bg-elev-1 transition-colors duration-150"
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.label}
                </button>
              ))}
              <button
                onClick={handleComments}
                className="w-full flex items-center px-4 py-3 text-sm text-text hover:bg-bg-elev-1 transition-colors duration-150"
              >
                <ChatBubbleLeftEllipsisIcon className="w-4 h-4 mr-3" /> Comments
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

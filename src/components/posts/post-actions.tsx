'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EllipsisHorizontalIcon, ShareIcon, ArrowDownTrayIcon, PencilIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/toast'
import { useModalStore } from '@/hooks/use-modal-store'
import type { SocialMediaPost } from '@/types'

interface PostActionsProps {
  post: SocialMediaPost
  carouselPosts?: SocialMediaPost[]
  isLoading?: boolean
}

export function PostActions({ post, carouselPosts = [], isLoading = false }: PostActionsProps) {
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
  ]

  return (
    <div className="flex items-center space-x-3">
      {/* Approval Actions */}
      {status === 'pending' && (
        <>
          <button
            onClick={handleApprove}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-green-600 hover:bg-green-700 text-white shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Approve
          </button>
          
          <button
            onClick={handleReject}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Reject
          </button>
        </>
      )}

      {/* Status-specific actions */}
      {status === 'approved' && (
        <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Approved
        </span>
      )}

      {status === 'rejected' || status === 'disapproved' ? (
        <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-semibold bg-red-100 text-red-800">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Rejected
        </span>
      ) : null}

      {/* Three-dot Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 hover:shadow-sm"
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
              className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
            >
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, X as XIcon, MessageCircle, MoreVertical, Download, Grid3X3, Image as ImageIcon, Video } from 'lucide-react'
import { MediaDisplay } from './index'
import type { SocialMediaPost } from '@/types'
import { useBranding } from '@/contexts/branding-context'
import { useModalStore } from '@/hooks/use-modal-store'
import { useToast } from '@/components/ui/toast'
import { updatePostApproval } from '@/lib/database'
import { useDownload } from '@/hooks/use-download'

interface PostCardProps {
  post: SocialMediaPost
  carouselPosts?: SocialMediaPost[]
  className?: string
  priority?: boolean
  // Bulk selection props
  isSelected?: boolean
  onSelectionChange?: (postId: string, selected: boolean) => void
  isBulkMode?: boolean
}

export function PostCard({
  post,
  carouselPosts = [],
  className = '',
  priority = false,
  isSelected = false,
  onSelectionChange,
  isBulkMode = false
}: PostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { gymName, gymPrimaryColor } = useBranding()
  const { openModal } = useModalStore()
  const { showToast } = useToast()
  const { downloadMedia, isDownloading } = useDownload()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const getAssetTypeBadge = () => {
    const assetType = post['Asset Type']?.toLowerCase() || 'photo'
    const isCarousel = post['Carousel Group']
    if (isCarousel) {
      return { label: 'Carousel', icon: <Grid3X3 className="w-3 h-3" /> }
    }
    switch (assetType) {
      case 'video':
        return { label: 'Video', icon: <Video className="w-3 h-3" /> }
      case 'photo':
      default:
        return { label: 'Photo', icon: <ImageIcon className="w-3 h-3" /> }
    }
  }

  const isApproved = (post['Approval Status'] || '').toLowerCase() === 'approved'

  const handleApproveToggle = async () => {
    try {
      if (!isApproved) {
        await updatePostApproval(post.id, 'Approved')
        window.dispatchEvent(new CustomEvent('post-updated', { detail: { type: 'approved', id: post.id } }))
        showToast({ type: 'success', title: 'Approved', message: 'Post approved' })
      } else {
        await updatePostApproval(post.id, 'Pending')
        window.dispatchEvent(new CustomEvent('post-updated', { detail: { type: 'pending', id: post.id } }))
        showToast({ type: 'success', title: 'Pending', message: 'Post moved back to pending' })
      }
    } catch {
      showToast({ type: 'error', title: 'Update failed', message: 'Could not update approval status' })
    }
  }

  const handleDisapprove = () => openModal('disapprove', post, carouselPosts)
  const handleComments = () => openModal('comments', post, carouselPosts)
  const handleEditCaption = () => { openModal('edit-caption', post, carouselPosts); setIsMenuOpen(false) }
  const handleRegenerate = () => { openModal('regenerate', post, carouselPosts); setIsMenuOpen(false) }

  const handleShare = () => {
    if (navigator.share && post['Asset URL']) {
      navigator.share({ title: post['Post Caption'] || 'Post', url: post['Asset URL'] }).catch(() => {})
    } else if (post['Asset URL']) {
      navigator.clipboard.writeText(post['Asset URL']).then(() => {
        showToast({ type: 'success', title: 'Link copied', message: 'Post URL copied to clipboard' })
      })
    }
    setIsMenuOpen(false)
  }

  const handleDownload = async () => {
    const assetUrl = post['Asset URL']
    if (!assetUrl) return
    try {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      if (isMobile && (navigator as any).share) {
        await (navigator as any).share({ url: assetUrl, title: post['Post Caption'] || 'Post' })
        setIsMenuOpen(false)
        return
      }
      const response = await fetch(assetUrl, { mode: 'cors' })
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const filenameFromUrl = assetUrl.split('/').pop() || `post-${post.id}`
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filenameFromUrl
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(objectUrl)
    } catch {
      window.open(assetUrl, '_blank', 'noopener,noreferrer')
    }
    setIsMenuOpen(false)
  }

  const formatTimestamp = (dateString?: string) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const badge = getAssetTypeBadge()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        whileHover={{ y: -2, scale: 1.02 }}
        className={`group ${className}`}
        style={{ backgroundColor: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--card-border)' }}
      >
        {/* Top Section */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <div className="profile-icon profile-icon-md">
              {(post['Gym Name'] || gymName || 'G').charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-text">{post['Gym Name'] || gymName || 'Gym'}</span>
          </div>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 rounded-[999px] hover:bg-[var(--hover)] text-[var(--text)] hover:text-[var(--accent)] transition-all duration-200">
              <MoreVertical className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-[var(--modal-surface)] rounded-[24px] border border-[var(--border)] shadow-xl z-[99999]"
                >
                  <button onClick={handleShare} className="w-full flex items-center px-4 py-3 text-sm text-[var(--text)] hover:bg-[var(--hover)] transition-all duration-200">
                    <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                    Share
                  </button>
                  <button onClick={handleDownload} className="w-full flex items-center px-4 py-3 text-sm text-[var(--text)] hover:bg-[var(--hover)] transition-all duration-200">
                    <Download className="w-4 h-4 mr-3" />
                    Download
                  </button>
                  <button onClick={handleEditCaption} className="w-full flex items-center px-4 py-3 text-sm text-[var(--text)] hover:bg-[var(--hover)] transition-all duration-200">
                    <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                    Edit Caption
                  </button>
                  <button onClick={handleRegenerate} className="w-full flex items-center px-4 py-3 text-sm text-[var(--text)] hover:bg-[var(--hover)] transition-all duration-200">
                    <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
                    Regenerate
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Media Section */}
        <div className="relative group overflow-hidden">
          <MediaDisplay post={post} carouselPosts={carouselPosts} priority={priority} />

          {/* Bulk Selection Checkbox - Top Right */}
          {isBulkMode && onSelectionChange && (
            <div className="absolute top-2 right-2 z-30">
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSelectionChange(post.id || '', e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200
                    ${isSelected ? 'bg-[var(--surface)] border-[var(--surface)]' : 'bg-black/40 border-white/80 text-white'}
                  `}>
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </label>
              </motion.div>
            </div>
          )}

          {/* Asset Type Badge - hover */}
          <div className="absolute top-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-[24px] text-xs font-semibold bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)]`}>
              <span className="mr-1.5">{badge.icon}</span>
              {post['Carousel Group'] ? 'Carousel' : (post['Asset Type'] || 'Post')}
            </span>
          </div>

          {/* Carousel Indicator */}
          {post['Carousel Group'] && post['Carousel Order'] && (
            <div className="absolute bottom-2 left-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="inline-flex items-center px-3 py-1.5 rounded-[24px] text-xs font-semibold bg-background text-foreground border border-border">
                {post['Carousel Order']} of {post['Carousel Group']}
              </span>
            </div>
          )}
        </div>

        {/* Action Icons */}
        <div className="px-4 mt-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={handleApproveToggle} className={`transition-colors ${isApproved ? 'text-[var(--surface)]' : 'text-gray-500 hover:text-[var(--surface)]'}`} aria-label="Approve">
              <Heart className={`w-5 h-5 ${isApproved ? 'fill-current' : ''}`} />
            </button>
            <button onClick={handleDisapprove} className="text-gray-500 hover:text-destructive transition-colors" aria-label="Disapprove">
              <XIcon className="w-6 h-6" />
            </button>
            <button onClick={handleComments} className="text-gray-500 hover:text-[var(--surface)] transition-colors" aria-label="Comments">
              <MessageCircle className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={async () => {
              const assetUrl = post['Asset URL']
              if (!assetUrl) return
              const fileName = `${(post['Post Caption'] || 'post').slice(0, 24).replace(/\s+/g, '-')}.${(post['Asset Type'] || '').toLowerCase() === 'video' ? 'mp4' : 'jpg'}`
              await downloadMedia(assetUrl, fileName)
            }}
            disabled={isDownloading}
            className={`text-gray-500 hover:text-[var(--surface)] transition-colors ${isDownloading ? 'opacity-50' : ''}`}
            aria-label="Download"
          >
            <Download className="w-6 h-6" />
          </button>
        </div>

        {/* Caption + Timestamp */}
        <div className="px-4 py-4">
          {post['Post Caption'] && (
            <div className="mb-2">
              <p
                className={`text-text text-sm leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}
                dangerouslySetInnerHTML={{
                  __html: (post['Post Caption'] || '')
                    .replace(/(#[\w\p{L}\p{Mn}\p{Pd}\d_]+)/gu, '<span class="text-muted-text">$1</span>')
                    .replace(/\n/g, '<br/>')
                }}
              />
              {post['Post Caption'].length > 150 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-text text-xs font-semibold mt-1 hover:underline transition-colors"
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}
          <div className="text-xs text-muted-text mt-1">
            {formatTimestamp(post.created_at || post.updated_at)}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// duplicate old implementation removed

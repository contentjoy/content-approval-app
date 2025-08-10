'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Image as ImageIcon, Grid3X3 } from 'lucide-react'
import { MediaDisplay, PostActions, PostStatus } from './index'
import type { SocialMediaPost } from '@/types'

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
  
  const getAssetTypeBadge = () => {
    const assetType = post['Asset Type']?.toLowerCase() || 'photo'
    const isCarousel = post['Carousel Group']
    
    if (isCarousel) {
      return {
        label: 'Carousel',
        color: 'bg-accent-soft text-accent border-accent',
        icon: <Grid3X3 className="w-3 h-3" />
      }
    }
    
    switch (assetType) {
      case 'video':
        return {
          label: 'Video',
          color: 'bg-accent-soft text-accent border-accent',
          icon: <Video className="w-3 h-3" />
        }
      case 'photo':
      default:
        return {
          label: 'Photo',
          color: 'bg-accent-soft text-accent border-accent',
          icon: <ImageIcon className="w-3 h-3" />
        }
    }
  }

  const badge = getAssetTypeBadge()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        whileHover={{ y: -4, scale: 1.02 }}
        className={`card card-hover group ${className}`}
      >
        {/* Media Section with proper aspect ratios */}
        <div className="relative group overflow-hidden rounded-t-2xl">
          <MediaDisplay post={post} carouselPosts={carouselPosts} priority={priority} />
          
          {/* Bulk Selection Checkbox - Top Right */}
          {isBulkMode && onSelectionChange && (
            <div className="absolute top-2 right-2 z-20">
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
                    ${isSelected 
                      ? 'bg-accent border-accent' 
                      : 'bg-background/80 border-border/60 backdrop-blur-sm hover:border-accent'
                    }
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
          
          {/* Asset Type Badge - Shows on hover - Top Left */}
          <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${badge.color} shadow-medium backdrop-blur-sm`}>
              <span className="mr-1.5">{badge.icon}</span>
              {badge.label}
            </span>
          </div>

          {/* Carousel Indicator - Shows on hover - Bottom Left */}
          {post['Carousel Group'] && post['Carousel Order'] && (
            <div className="absolute bottom-8 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-background/80 text-foreground backdrop-blur-sm shadow-medium">
                {post['Carousel Order']} of {post['Carousel Group']}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5">
          {/* Post Caption */}
          {post['Post Caption'] && (
            <div className="mb-4">
              <p className={`text-foreground text-sm leading-relaxed font-medium ${isExpanded ? '' : 'line-clamp-3'}`}>
                {post['Post Caption']}
              </p>
              {post['Post Caption'].length > 150 && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-accent text-xs font-semibold mt-2 hover:underline transition-colors"
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}

          {/* Status and Actions */}
          <div className="flex items-center justify-between">
            <PostStatus status={post['Approval Status']} />
            
            <PostActions
              post={post}
              carouselPosts={carouselPosts}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

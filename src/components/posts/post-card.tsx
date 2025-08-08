'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { MediaDisplay, PostActions, PostStatus } from './index'
import type { SocialMediaPost } from '@/types'

interface PostCardProps {
  post: SocialMediaPost
  carouselPosts?: SocialMediaPost[]
  className?: string
  priority?: boolean
}

export function PostCard({ post, carouselPosts = [], className = '', priority = false }: PostCardProps) {
  const getAssetTypeBadge = () => {
    const assetType = post['Asset Type']?.toLowerCase() || 'photo'
    const isCarousel = post['Carousel Group']
    
    if (isCarousel) {
      return {
        label: 'Carousel',
        color: 'bg-purple-100 text-purple-800',
        icon: '🖼️'
      }
    }
    
    switch (assetType) {
      case 'video':
        return {
          label: 'Video',
          color: 'bg-blue-100 text-blue-800',
          icon: '🎥'
        }
      case 'photo':
      default:
        return {
          label: 'Photo',
          color: 'bg-green-100 text-green-800',
          icon: '📷'
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
        className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl hover:border-gray-200 transition-all duration-300 group ${className}`}
      >
        {/* Media Section with proper aspect ratios */}
        <div className="relative">
          <MediaDisplay post={post} priority={priority} />
          
          {/* Asset Type Badge */}
          <div className="absolute top-3 left-3 z-10">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${badge.color} shadow-sm backdrop-blur-sm`}>
              <span className="mr-1.5">{badge.icon}</span>
              {badge.label}
            </span>
          </div>

          {/* Carousel Indicator */}
          {post['Carousel Group'] && post['Carousel Order'] && (
            <div className="absolute top-3 right-3 z-10">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-black bg-opacity-60 text-white backdrop-blur-sm">
                {post['Carousel Order']} of {post['Carousel Group']}
              </span>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5">
          {/* Caption */}
          {post['Post Caption'] && (
            <div className="mb-4">
              <p className="text-gray-700 text-sm leading-relaxed line-clamp-3 font-medium">
                {post['Post Caption']}
              </p>
              {post['Post Caption'].length > 150 && (
                <button className="text-[var(--brand-primary)] text-xs font-semibold mt-2 hover:underline transition-colors">
                  Read more
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

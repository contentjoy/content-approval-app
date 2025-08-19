'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { CarouselDisplay } from './carousel-display'
import { VideoPlayer } from '@/components/ui/video-player'
import type { SocialMediaPost } from '@/types'

interface MediaDisplayProps {
  post: SocialMediaPost
  className?: string
  priority?: boolean // Add priority prop for LCP images
  carouselPosts?: SocialMediaPost[] // Add carousel posts for swiping
}

export function MediaDisplay({ post, className = '', priority = false, carouselPosts = [] }: MediaDisplayProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isVideo, setIsVideo] = useState(false)

  useEffect(() => {
    const assetType = post['Asset Type']?.toLowerCase()
    const assetUrl = (post['Asset URL'] || '').toLowerCase().trim()
    const looksLikeVideo = /\.(mp4|mov|m4v|webm|ogg)(\?|#|$)/.test(assetUrl)
    setIsVideo(assetType === 'video' || looksLikeVideo)
    setHasError(false)
    setIsLoading(true)
  }, [post])

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleImageError = async () => {
    console.log('🖼️ Image failed to load, deleting post:', post.id)
    setIsLoading(false)
    setHasError(true)
    if (post?.id) {
      try {
        const response = await fetch('/api/posts/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post.id })
        })
        
        if (response.ok) {
          console.log('✅ Post deleted successfully, dispatching refresh event')
          // Dispatch event to refresh parent lists
          window.dispatchEvent(new CustomEvent('post-deleted', { detail: { id: post.id } }))
        } else {
          console.error('❌ Failed to delete post:', response.status)
        }
      } catch (error) {
        console.error('❌ Error deleting post:', error)
      }
    }
  }

  const handleVideoError = async () => {
    console.log('🎥 Video failed to load (non-destructive):', post.id)
    setIsLoading(false)
    setHasError(true)
  }

  // If it's a carousel, use the CarouselDisplay component (4:5)
  if (post['Carousel Group']) {
    return <CarouselDisplay post={post} carouselPosts={carouselPosts} className={className} priority={priority} />
  }

  // Handle video with 9:16 aspect ratio
  if (isVideo && post['Asset URL']) {
    return (
      <VideoPlayer
        src={post['Asset URL']}
        poster={post['Asset URL'] + '#t=0.1'}
        aspect="9/16"
        className={className}
        onLoaded={() => setIsLoading(false)}
        onError={handleVideoError}
      />
    )
  }

  // Handle image with 4:5 aspect ratio
  if (post['Asset URL']) {
    return (
      <div className={`relative w-full bg-bg-elev-1 ${className}`} style={{ aspectRatio: '4/5' }}>
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
            </motion.div>
          )}
        </AnimatePresence>

        {hasError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-elev-1">
            <div className="text-center">
              <svg className="w-12 h-12 text-muted-text mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-muted-text">Image not available</p>
            </div>
          </div>
        ) : (
          <Image
            src={post['Asset URL']}
            alt={post['Post Caption'] || 'Post content'}
            fill
            className="object-cover"
            priority={priority}
            onLoad={handleImageLoad}
            onError={handleImageError}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            quality={85}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxAAPwCdABmX/9k="
          />
        )}
      </div>
    )
  }

  // Fallback for no media with 4:5 aspect ratio
  return (
    <div className={`w-full bg-gray-100 flex items-center justify-center ${className}`} style={{ aspectRatio: '4/5' }}>
      <div className="text-center">
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm text-gray-500">No media</p>
      </div>
    </div>
  )
}

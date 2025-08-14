'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { VideoPlayer } from '@/components/ui/video-player'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import type { SocialMediaPost } from '@/types'

interface CarouselDisplayProps {
  post: SocialMediaPost
  className?: string
  carouselPosts?: SocialMediaPost[]
  priority?: boolean
}

export function CarouselDisplay({ post, className = '', carouselPosts = [], priority = false }: CarouselDisplayProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Get all posts in the same carousel group
  const allCarouselPosts = carouselPosts.length > 0 
    ? carouselPosts 
    : [post] // Fallback to just the current post if no carousel posts provided

  const totalSlides = allCarouselPosts.length
  const currentPost = allCarouselPosts[currentSlide] || post

  useEffect(() => {
    // Set initial slide based on carousel order
    if (post['Carousel Order']) {
      const order = parseInt(post['Carousel Order'].toString()) - 1
      setCurrentSlide(Math.max(0, Math.min(order, totalSlides - 1)))
    }
  }, [post, totalSlides])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const handleImageLoad = () => {
    setIsLoading(false)
  }

  const handleImageError = async () => {
    console.log('🖼️ Carousel image failed to load, deleting post:', currentPost.id)
    setIsLoading(false)
    setHasError(true)
    if (currentPost?.id) {
      try {
        const response = await fetch('/api/posts/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: currentPost.id })
        })
        
        if (response.ok) {
          console.log('✅ Carousel post deleted successfully, dispatching refresh event')
          // Dispatch event to refresh parent lists
          window.dispatchEvent(new CustomEvent('post-deleted', { detail: { id: currentPost.id } }))
        } else {
          console.error('❌ Failed to delete carousel post:', response.status)
        }
      } catch (error) {
        console.error('❌ Error deleting carousel post:', error)
      }
    }
  }

  const isVideoSlide = (p: SocialMediaPost) => {
    const t = (p['Asset Type'] || '').toLowerCase()
    const url = (p['Asset URL'] || '').toLowerCase()
    return t === 'video' || /\.(mp4|mov|m4v|webm|ogg)(\?|#|$)/.test(url)
  }

  const handleVideoError = async () => {
    console.log('🎥 Carousel video failed to load, deleting post:', currentPost.id)
    setIsLoading(false)
    setHasError(true)
    if (currentPost?.id) {
      try {
        const response = await fetch('/api/posts/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: currentPost.id })
        })
        
        if (response.ok) {
          console.log('✅ Carousel post deleted successfully, dispatching refresh event')
          // Dispatch event to refresh parent lists
          window.dispatchEvent(new CustomEvent('post-deleted', { detail: { id: currentPost.id } }))
        } else {
          console.error('❌ Failed to delete carousel post:', response.status)
        }
      } catch (error) {
        console.error('❌ Error deleting carousel post:', error)
      }
    }
  }

  // Touch swipe support
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0]
    touchStartX.current = t.clientX
    touchStartY.current = t.clientY
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || touchStartY.current == null) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStartX.current
    const dy = t.clientY - touchStartY.current
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)
    const threshold = 40
    if (absDx > absDy && absDx > threshold) {
      if (dx < 0) nextSlide()
      else prevSlide()
    }
    touchStartX.current = null
    touchStartY.current = null
  }

  // Carousels use 4:5
  return (
    <div
      className={`relative w-full bg-bg-elev-1 overflow-hidden ${className}`}
      style={{ aspectRatio: '4/5' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Carousel Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-bg-elev-1">
              <div className="text-center">
                <svg className="w-12 h-12 text-muted-text mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-muted-text">Image not available</p>
              </div>
            </div>
          ) : currentPost['Asset URL'] ? (
            isVideoSlide(currentPost) ? (
              <VideoPlayer
                src={currentPost['Asset URL']!}
                poster={(currentPost['Asset URL'] || '') + '#t=0.1'}
                aspect="4/5"
                onLoaded={handleImageLoad}
                onError={handleVideoError}
              />
            ) : (
              <Image
                src={currentPost['Asset URL']}
                alt={currentPost['Post Caption'] || `Carousel slide ${currentSlide + 1}`}
                fill
                className="object-cover"
                priority={priority}
                onLoad={handleImageLoad}
                onError={handleImageError}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                quality={85}
              />
            )
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">No media</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {totalSlides > 1 && (
        <>
          {/* Previous Button */}
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-all duration-200 z-20"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>

          {/* Next Button */}
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-all duration-200 z-20"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Slide Indicators */}
      {totalSlides > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
          {Array.from({ length: totalSlides }, (_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentSlide
                  ? 'bg-white scale-125'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {totalSlides > 1 && (
        <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs font-medium z-20">
          {currentSlide + 1} of {totalSlides}
        </div>
      )}
    </div>
  )
}

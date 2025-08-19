'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'

interface VideoPlayerProps {
  src: string
  poster?: string
  className?: string
  aspect?: '1/1' | '4/5' | '9/16'
  onError?: () => void
  onLoaded?: () => void
}

export function VideoPlayer({ src, poster, className = '', aspect = '4/5', onError, onLoaded }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Reset state when src changes
  useEffect(() => {
    setIsPlaying(false)
    setIsLoading(true)
    setHasError(false)
    setIsReady(false)
  }, [src])

  // Intersection Observer to optimize video loading during scroll
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting)
        })
      },
      {
        rootMargin: '50px', // Start loading when within 50px of viewport
        threshold: 0.1
      }
    )

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Only load video when visible
  useEffect(() => {
    if (!isVisible) {
      setIsLoading(false)
      setIsReady(false)
      return
    }

    // Reset loading state when becoming visible
    if (!isReady && !hasError) {
      setIsLoading(true)
    }
  }, [isVisible, isReady, hasError])

  const handlePlay = useCallback(async () => {
    try {
      if (!videoRef.current) return
      
      // Reset any error state
      setHasError(false)
      
      // Ensure video is ready
      if (videoRef.current.readyState < 2) {
        setIsLoading(true)
        await new Promise((resolve) => {
          const handleCanPlay = () => {
            videoRef.current?.removeEventListener('canplay', handleCanPlay)
            resolve(true)
          }
          videoRef.current?.addEventListener('canplay', handleCanPlay)
        })
      }
      
      await videoRef.current.play()
      setIsPlaying(true)
      setIsLoading(false)
    } catch (error) {
      console.error('Video play error:', error)
      setHasError(true)
      setIsLoading(false)
    }
  }, [])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const handleVideoReady = useCallback(() => {
    setIsLoading(false)
    setIsReady(true)
    onLoaded?.()
  }, [onLoaded])

  const handleVideoError = useCallback(() => {
    console.log('🎥 Video error detected in VideoPlayer')
    setIsLoading(false)
    // Retry up to 3 times with backoff
    setRetryCount((prev) => {
      const next = prev + 1
      if (next <= 3) {
        setTimeout(() => {
          const v = videoRef.current
          if (!v) return
          try {
            v.load()
            v.play().catch(() => {})
          } catch {}
        }, next * 500)
        return next
      }
      setHasError(true)
      onError?.()
      return next
    })
  }, [onError])

  // Handle video element events
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      // Try to seek to a small offset to force poster-like first frame
      try {
        video.currentTime = 0.1
      } catch {}
    }

    const handleCanPlay = () => {
      handleVideoReady()
    }

    const handleSeeked = () => {
      if (!isReady) {
        handleVideoReady()
      }
    }

    const handleLoadStart = () => {
      setIsLoading(true)
    }

    const handleLoadedData = () => {
      handleVideoReady()
    }

    const handleError = (event: Event) => {
      console.log('🎥 Video element error event:', event)
      console.log('🎥 Video error details:', video.error)
      handleVideoError()
    }

    const handleAbort = () => {
      console.log('🎥 Video load aborted')
      handleVideoError()
    }

    const handleStalled = () => {
      console.log('🎥 Video stalled')
      handleVideoError()
    }

    const handleSuspend = () => {
      console.log('🎥 Video suspended')
      // Don't treat suspend as an error, it's normal for paused videos
    }

    // Add event listeners
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('canplay', handleCanPlay)
    video.addEventListener('seeked', handleSeeked)
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('loadeddata', handleLoadedData)
    video.addEventListener('error', handleError)
    video.addEventListener('abort', handleAbort)
    video.addEventListener('stalled', handleStalled)
    video.addEventListener('suspend', handleSuspend)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('canplay', handleCanPlay)
      video.removeEventListener('seeked', handleSeeked)
      video.removeEventListener('loadstart', handleLoadStart)
      video.removeEventListener('loadeddata', handleLoadedData)
      video.removeEventListener('error', handleError)
      video.removeEventListener('abort', handleAbort)
      video.removeEventListener('stalled', handleStalled)
      video.removeEventListener('suspend', handleSuspend)
    }
  }, [handleVideoReady, handleVideoError, isReady])

  // Reset loading state if it gets stuck
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading && !hasError && isVisible) {
        console.warn('Video loading timeout, resetting state')
        setIsLoading(false)
        setIsReady(true)
      }
    }, 10000) // 10 second timeout

    return () => clearTimeout(timeout)
  }, [isLoading, hasError, isVisible])

  // Network error detection - check if video actually loaded after a delay
  useEffect(() => {
    if (!isVisible || hasError || isReady) return

    const networkTimeout = setTimeout(() => {
      const video = videoRef.current
      if (video && video.readyState === 0 && !hasError) {
        console.log('🎥 Video network timeout - readyState is 0, treating as error')
        handleVideoError()
      }
    }, 5000) // 5 second network timeout

    return () => clearTimeout(networkTimeout)
  }, [isVisible, hasError, isReady, handleVideoError])

  return (
    <div ref={containerRef} className={`relative w-full bg-bg-elev-1 ${className}`} style={{ aspectRatio: aspect }}>
      {/* Loading spinner - only show when actually loading and not ready */}
      {isLoading && !isReady && !hasError && isVisible && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      )}

      {/* Play button - show when not playing, ready, and not loading */}
      {!isPlaying && isReady && !isLoading && !hasError && isVisible && (
        <button
          onClick={handlePlay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-12 w-12 z-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/60 transition-all duration-200"
          aria-label="Play video"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}

      {/* Error state */}
      {hasError && isVisible && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-bg-elev-1">
          <div className="text-center">
            <svg className="w-8 h-8 text-muted-text mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-xs text-muted-text">Video unavailable</p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        controls={isPlaying}
        preload="metadata"
        poster={poster}
        muted
        onPlay={() => setIsPlaying(true)}
        onPause={handlePause}
        onEnded={handlePause}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}



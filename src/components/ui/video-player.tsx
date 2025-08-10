'use client'

import React, { useEffect, useRef, useState } from 'react'

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
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const handlePlay = async () => {
    try {
      if (!videoRef.current) return
      await videoRef.current.play()
      setIsPlaying(true)
    } catch {
      // ignore
    }
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  useEffect(() => {
    setIsPlaying(false)
    setIsLoading(true)
    const v = videoRef.current
    if (!v) return
    const onLoadedMetadata = () => {
      // Try to seek to a small offset to force poster-like first frame
      try {
        v.currentTime = 0.1
      } catch {}
    }
    const onSeeked = () => {
      setIsLoading(false)
      onLoaded?.()
    }
    v.addEventListener('loadedmetadata', onLoadedMetadata)
    v.addEventListener('seeked', onSeeked)
    return () => {
      v.removeEventListener('loadedmetadata', onLoadedMetadata)
      v.removeEventListener('seeked', onSeeked)
    }
  }, [src])

  return (
    <div className={`relative w-full bg-bg-elev-1 ${className}`} style={{ aspectRatio: aspect }}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      )}
      {!isPlaying && !isLoading && (
        <button
          onClick={handlePlay}
          className="absolute inset-0 flex items-center justify-center h-12 w-12 m-auto z-10 rounded-full bg-black/50 text-white hover:bg-black/60"
          aria-label="Play video"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}

      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        playsInline
        controls={isPlaying}
        preload="metadata"
        poster={poster}
        onLoadedData={() => {
          setIsLoading(false)
          onLoaded?.()
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={handlePause}
        onError={() => {
          setIsLoading(false)
          onError?.()
        }}
      >
        <source src={src} />
        Your browser does not support the video tag.
      </video>
    </div>
  )
}



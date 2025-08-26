'use client'

import React, { useState, useEffect } from 'react'
import { Image, Video, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilePreviewProps {
  file: File
  onRemove: () => void
}

async function generateVideoThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }
    
    video.onloadedmetadata = () => {
      canvas.width = 120
      canvas.height = 90
      video.currentTime = 1
    }
    
    video.onseeked = () => {
      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8)
        resolve(thumbnail)
      } catch (error) {
        reject(error)
      }
    }
    
    video.onerror = () => {
      reject(new Error('Failed to load video for thumbnail generation'))
    }
    
    const videoUrl = URL.createObjectURL(file)
    video.src = videoUrl
    video.load()
    
    video.onended = () => {
      URL.revokeObjectURL(videoUrl)
    }
  })
}

async function getFilePreview(file: File): Promise<string> {
  if (file.type.startsWith('image/')) {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })
  } else if (file.type.startsWith('video/')) {
    try {
      return await generateVideoThumbnail(file)
    } catch (error) {
      console.warn('Failed to generate video thumbnail:', error)
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTIwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjMTA3MzNhIi8+CjxwYXRoIGQ9Ik00OCAzMkw0OCA1OEw2OCA0NUw0OCAzMloiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo='
    }
  }
  
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiB2aWV3Qm94PSIwIDAgMTIwIDkwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjkwIiBmaWxsPSIjNmI3MjgwIi8+CjxwYXRoIGQ9Ik02MCA0NUw2MCA2MEw3NSA1Mi41TDYwIDQ1WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg=='
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  const [preview, setPreview] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const loadPreview = async () => {
      try {
        setIsLoading(true)
        setError('')
        const previewUrl = await getFilePreview(file)
        setPreview(previewUrl)
      } catch (err) {
        console.error('Failed to load file preview:', err)
        setError('Failed to load preview')
      } finally {
        setIsLoading(false)
      }
    }

    loadPreview()
  }, [file])

  const isVideo = file.type.startsWith('video/')
  const isImage = file.type.startsWith('image/')

  return (
    <div className="relative group bg-muted rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-all duration-200">
      {/* File Preview */}
      <div className="aspect-video w-full relative">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground text-sm">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-2 text-muted-foreground">
                {isVideo ? <Video className="w-full h-full" /> : <Image className="w-full h-full" />}
              </div>
              <div className="text-xs">Preview failed</div>
            </div>
          </div>
        ) : (
          <>
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[12px] border-l-white border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1" />
                </div>
              </div>
            )}
            <img 
              src={preview} 
              alt={file.name}
              className="w-full h-full object-cover"
              onError={() => setError('Failed to load preview')}
            />
          </>
        )}
      </div>

      {/* File Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
        <div className="text-xs font-medium truncate">{file.name}</div>
        <div className="text-xs opacity-80">
          {(file.size / (1024 * 1024)).toFixed(1)} MB
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className={cn(
          "absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full",
          "flex items-center justify-center text-white opacity-0 group-hover:opacity-100",
          "transition-opacity duration-200"
        )}
        title="Remove file"
      >
        <X className="w-3 h-3" />
      </button>

      {/* File Type Badge */}
      <div className="absolute top-2 left-2 px-2 py-1 bg-primary/90 text-primary-foreground text-xs rounded-md font-medium">
        {isVideo ? 'VIDEO' : isImage ? 'IMAGE' : 'FILE'}
      </div>
    </div>
  )
}

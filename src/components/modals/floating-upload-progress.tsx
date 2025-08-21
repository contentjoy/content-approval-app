'use client'

import React from 'react'
import { X, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloatingUploadProgressProps {
  isVisible: boolean
  progress: number
  currentFile: string
  totalFiles: number
  onClose: () => void
  onMinimize: () => void
  isMinimized: boolean
}

export function FloatingUploadProgress({
  isVisible,
  progress,
  currentFile,
  totalFiles,
  onClose,
  onMinimize,
  isMinimized
}: FloatingUploadProgressProps) {
  if (!isVisible) return null

  // Determine progress phase and message
  const getProgressPhase = () => {
    if (progress <= 10) {
      return { phase: 'Setup', message: 'Preparing upload session...', color: 'bg-blue-500' }
    } else if (progress < 100) {
      return { phase: 'Uploading', message: 'Uploading files...', color: 'bg-green-500' }
    } else {
      return { phase: 'Complete', message: 'Upload finished!', color: 'bg-green-600' }
    }
  }

  const { phase, message, color } = getProgressPhase()

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-background border border-border rounded-lg shadow-xl p-3 min-w-[200px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">{phase}</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={onMinimize}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Expand"
            >
              <Maximize2 className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-muted rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div 
            className={cn(
              "h-2 rounded-full transition-all duration-300 ease-out",
              color,
              progress <= 10 ? 'progress-bar-setup' : 'progress-bar-smooth'
            )}
            style={{ width: `${Math.round(progress)}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {Math.round(progress)}% • {currentFile || message}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background border border-border rounded-lg shadow-xl p-4 min-w-[320px] max-w-[400px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", color)}></span>
            {phase}
          </h3>
          <p className="text-sm text-muted-foreground">
            {currentFile || message}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onMinimize}
            className="p-2 hover:bg-muted rounded transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <div 
            className={cn(
              "h-3 rounded-full transition-all duration-500 ease-out",
              color,
              progress <= 10 ? 'progress-bar-setup' : 'progress-bar-smooth'
            )}
            style={{ width: `${Math.round(progress)}%` }}
          />
        </div>
        
        {/* Progress Details */}
        {progress <= 10 ? (
          // Setup Phase
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Setting up upload session...
            </div>
            <div className="text-xs text-muted-foreground">
              Creating folder structure and preparing files
            </div>
          </div>
        ) : progress < 100 ? (
          // Upload Phase
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current File</span>
              <span className="font-medium">{currentFile}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {Math.ceil((progress - 10) / 90 * totalFiles)} of {totalFiles} files processed
            </div>
          </div>
        ) : (
          // Complete Phase
          <div className="text-sm text-green-600 font-medium text-center">
            🎉 Upload completed successfully!
          </div>
        )}

        {/* Estimated Time */}
        {progress > 10 && progress < 100 && (
          <div className="text-xs text-muted-foreground">
            Estimated time remaining: {Math.ceil((100 - progress) / 10)} minutes
          </div>
        )}
      </div>
    </div>
  )
}

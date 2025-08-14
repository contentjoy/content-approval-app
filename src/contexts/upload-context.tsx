'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface UploadState {
  isUploading: boolean
  progress: number
  currentFile: string
  totalFiles: number
  showProgress: boolean
  isMinimized: boolean
}

interface UploadContextType {
  uploadState: UploadState
  startUpload: (totalFiles: number) => void
  updateProgress: (progress: number, currentFile: string) => void
  completeUpload: () => void
  minimizeProgress: () => void
  closeProgress: () => void
}

const UploadContext = createContext<UploadContextType | undefined>(undefined)

export function UploadProvider({ children }: { children: ReactNode }) {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    currentFile: '',
    totalFiles: 0,
    showProgress: false,
    isMinimized: false
  })

  const startUpload = (totalFiles: number) => {
    setUploadState({
      isUploading: true,
      progress: 0,
      currentFile: '',
      totalFiles,
      showProgress: true,
      isMinimized: false
    })
  }

  const updateProgress = (progress: number, currentFile: string) => {
    setUploadState(prev => ({
      ...prev,
      progress,
      currentFile
    }))
  }

  const completeUpload = () => {
    setUploadState(prev => ({
      ...prev,
      isUploading: false,
      progress: 100,
      showProgress: false
    }))
  }

  const minimizeProgress = () => {
    setUploadState(prev => ({
      ...prev,
      isMinimized: !prev.isMinimized
    }))
  }

  const closeProgress = () => {
    setUploadState(prev => ({
      ...prev,
      showProgress: false
    }))
  }

  return (
    <UploadContext.Provider value={{
      uploadState,
      startUpload,
      updateProgress,
      completeUpload,
      minimizeProgress,
      closeProgress
    }}>
      {children}
    </UploadContext.Provider>
  )
}

export function useUpload() {
  const context = useContext(UploadContext)
  if (!context) {
    throw new Error('useUpload must be used within an UploadProvider')
  }
  return context
}

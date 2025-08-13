'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { X, Upload, Image, Video, Building2, Camera } from 'lucide-react'
import { Dashboard } from '@uppy/react'
import Uppy from '@uppy/core'
import { useBranding } from '@/contexts/branding-context'
import { useAuth } from '@/contexts/auth-context'
import { useParams } from 'next/navigation'
import { SLOT_NAMES } from '@/lib/slots'
import { initUpload, uploadFile, completeUpload } from '@/lib/contentUploadClient'
import type { SlotName } from '@/lib/slots'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (detail?: any) => void
}

// File type restrictions for each slot
const SLOT_CONFIG = {
  'Photos': {
    maxFiles: 20,
    allowedTypes: ['.jpg', '.jpeg', '.png', '.heic'] as string[],
    icon: Image,
    description: 'Upload photos for social media content'
  },
  'Videos': {
    maxFiles: 20,
    allowedTypes: ['.mov', '.mp4'] as string[],
    icon: Video,
    description: 'Upload videos for social media content'
  },
  'Facility Photos': {
    maxFiles: 15,
    allowedTypes: ['.jpg', '.jpeg', '.png', '.heic'] as string[],
    icon: Building2,
    description: 'Upload facility photos for marketing'
  },
  'Facility Videos': {
    maxFiles: 15,
    allowedTypes: ['.mov', '.mp4'] as string[],
    icon: Camera,
    description: 'Upload facility videos for marketing'
  }
} as const

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const { gymName } = useBranding()
  const { user } = useAuth()
  const params = useParams()
  const gymSlug = typeof params.gymSlug === 'string' ? params.gymSlug : null
  
  const [activeSlot, setActiveSlot] = useState<typeof SLOT_NAMES[number]>('Photos')
  const [isUploading, setIsUploading] = useState(false)
  
  // Create Uppy instances for each slot
  const [uppyInstances] = useState(() => {
    const instances: Record<string, Uppy> = {}
    
    SLOT_NAMES.forEach(slotName => {
      const config = SLOT_CONFIG[slotName]
      const uppy = new Uppy({
        restrictions: {
          maxNumberOfFiles: config.maxFiles,
          allowedFileTypes: config.allowedTypes,
          maxFileSize: 100 * 1024 * 1024, // 100MB limit
        },
        autoProceed: false,
        allowMultipleUploadBatches: false,
      })
      
      instances[slotName] = uppy
    })
    
    return instances
  })

  // Cleanup Uppy instances on unmount
  useEffect(() => {
    return () => {
      // Cleanup will happen automatically when component unmounts
      console.log('Cleaning up Uppy instances')
    }
  }, [uppyInstances])

  const handleUpload = useCallback(async () => {
    if (!gymSlug || !gymName || !user?.gymId) {
      console.error('Missing gym information or user not authenticated')
      return
    }

    setIsUploading(true)

    try {
      // Collect files from all slots
      const filesBySlot: Record<SlotName, File[]> = {
        'Photos': [],
        'Videos': [],
        'Facility Photos': [],
        'Facility Videos': []
      }

      SLOT_NAMES.forEach(slotName => {
        const uppy = uppyInstances[slotName]
        const files = uppy.getFiles().map(file => file.data as File)
        filesBySlot[slotName] = files
      })

      // Check if we have any files to upload
      const totalFiles = Object.values(filesBySlot).flat().length
      if (totalFiles === 0) {
        console.log('No files to upload')
        return
      }

      console.log(`Starting upload of ${totalFiles} files...`)
      
      // Step 1: Initialize upload
      const uploadId = await initUpload(user.gymId)
      console.log('Upload initialized with ID:', uploadId)
      
      // Step 2: Upload files to respective slots
      const uploadResults: Record<SlotName, string[]> = {
        'Photos': [],
        'Videos': [],
        'Facility Photos': [],
        'Facility Videos': []
      }
      const errors: string[] = []

      for (const [slotName, files] of Object.entries(filesBySlot)) {
        if (files.length === 0) continue
        
        console.log(`Uploading ${files.length} files to slot: ${slotName}`)
        
        // Upload files serially for safety
        for (const file of files) {
          try {
            const result = await uploadFile(uploadId, slotName, file)
            uploadResults[slotName as SlotName].push(result.driveFileId)
            console.log(`✅ Uploaded ${file.name} to ${slotName}`)
          } catch (error) {
            const errorMessage = `Failed to upload ${file.name} to ${slotName}: ${error instanceof Error ? error.message : 'Unknown error'}`
            console.error(errorMessage)
            errors.push(errorMessage)
            // Stop the batch if any file fails
            throw new Error(errorMessage)
          }
        }
      }

      // Step 3: Complete upload
      await completeUpload(uploadId)
      console.log('Upload completed successfully')
      
      onSuccess?.({ 
        uploadId, 
        timestamp: new Date().toISOString(),
        uploadedFiles: uploadResults,
        totalFiles
      })
      onClose()
      
    } catch (error) {
      console.error('Upload failed:', error)
      // TODO: Show error toast/notification
    } finally {
      setIsUploading(false)
    }
  }, [gymSlug, gymName, user?.gymId, uppyInstances, onSuccess, onClose])

  const getActiveUppy = () => uppyInstances[activeSlot]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-6xl mx-4 bg-[var(--bg)] rounded-3xl border border-border shadow-soft max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text)]">Upload Content</h2>
            <p className="text-[var(--muted-text)] mt-1">
              Upload content to {gymName || 'your gym'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-10 w-10 rounded-full border border-border flex items-center justify-center text-[var(--text)] hover:bg-[var(--hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row h-[calc(90vh-120px)]">
          {/* Slot Selector */}
          <div className="lg:w-64 p-4 border-r border-border bg-[var(--bg-elev-1)]">
            <h3 className="font-semibold text-[var(--text)] mb-4">Content Types</h3>
            <div className="space-y-2">
              {SLOT_NAMES.map((slotName) => {
                const config = SLOT_CONFIG[slotName]
                const Icon = config.icon
                const isActive = activeSlot === slotName
                const uppy = uppyInstances[slotName]
                const fileCount = uppy.getFiles().length
                
                return (
                  <button
                    key={slotName}
                    onClick={() => setActiveSlot(slotName)}
                    className={`w-full p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                      isActive 
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10' 
                        : 'border-border hover:border-[var(--accent)]/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${
                        isActive ? 'text-[var(--accent)]' : 'text-[var(--muted-text)]'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${
                          isActive ? 'text-[var(--text)]' : 'text-[var(--text)]/80'
                        }`}>
                          {slotName}
                        </div>
                        <div className="text-xs text-[var(--muted-text)] mt-1">
                          {fileCount} / {config.maxFiles} files
                        </div>
                        <div className="text-xs text-[var(--muted-text)] mt-1">
                          {config.allowedTypes.join(', ')}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Upload Area */}
          <div className="flex-1 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[var(--text)] mb-2">
                {activeSlot}
              </h3>
              <p className="text-[var(--muted-text)] text-sm">
                {SLOT_CONFIG[activeSlot].description}
              </p>
            </div>

            {/* Uppy Dashboard */}
            <div className="bg-[var(--bg-elev-1)] rounded-xl border border-border p-4">
              <Dashboard
                uppy={getActiveUppy()}
                plugins={[]}
                width="100%"
                height="400px"
                showProgressDetails={true}
                proudlyDisplayPoweredByUppy={false}
                theme="light"
              />
            </div>

            {/* Upload Button */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleUpload}
                disabled={isUploading || getActiveUppy().getFiles().length === 0}
                className="px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-medium hover:bg-[var(--accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload to Google Drive</span>
                  </>
                  )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

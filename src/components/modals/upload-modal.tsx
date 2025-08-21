'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { ArrowUp } from 'lucide-react'
import Uppy from '@uppy/core'
import { useUpload } from '@/contexts/upload-context'
import { useBranding } from '@/hooks/use-branding'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/modal'
import { cn } from '@/lib/utils'
import { SlotSelector, SlotName, SLOT_NAMES, SLOT_CONFIG } from './slot-selector'
import { UploadArea } from './upload-area'
import { FloatingUploadProgress } from './floating-upload-progress'

// Import required Uppy CSS files
import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (data: any) => void
}

// Function to determine slot name based on which Uppy instance the file came from
function determineSlotName(file: any, uppyInstances: Record<string, any>): string {
  console.log(`🔍 DEBUG: Determining slot for file: ${file.name}`)
  console.log(`🔍 DEBUG: File type: ${file.type}`)
  console.log(`🔍 DEBUG: Available Uppy instances:`, Object.keys(uppyInstances))
  
  // Find which Uppy instance this file belongs to
  for (const [slotName, uppy] of Object.entries(uppyInstances)) {
    const files = uppy.getFiles()
    console.log(`🔍 DEBUG: Checking ${slotName} instance, has ${files.length} files`)
    
    if (files.some((f: any) => f.id === file.id)) {
      console.log(`🎯 File ${file.name} belongs to slot: ${slotName}`)
      return slotName
    }
  }
  
  // Fallback logic if we can't determine the slot
  console.warn(`⚠️ Could not determine slot for ${file.name}, using file type fallback`)
  console.warn(`⚠️ This suggests a routing issue - file should have been assigned to a specific Uppy instance`)
  
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  
  if (isImage) {
    console.log(`🖼️ File ${file.name} detected as image, defaulting to Photos`)
    return 'Photos'
  } else if (isVideo) {
    console.log(`🎬 File ${file.name} detected as video, defaulting to Videos`)
    return 'Videos'
  } else {
    console.log(`❓ File ${file.name} has unknown type, defaulting to Photos`)
    return 'Photos'
  }
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [activeSlot, setActiveSlot] = useState<SlotName>('Photos')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  
  // Add file count state for each slot
  const [fileCounts, setFileCounts] = useState<Record<SlotName, number>>({
    'Photos': 0,
    'Videos': 0,
    'Facility Photos': 0,
    'Facility Videos': 0
  })
  
  // Add file previews state for each slot
  const [filePreviews, setFilePreviews] = useState<Record<SlotName, Array<{ file: File; preview: string }>>>({
    'Photos': [],
    'Videos': [],
    'Facility Photos': [],
    'Facility Videos': []
  })

  // Prevent modal from opening if upload is in progress
  useEffect(() => {
    if (isOpen && isUploading) {
      toast.error('Upload in progress, please wait...', {
        duration: 3000,
        icon: '⏳'
      })
      onClose()
      return
    }
  }, [isOpen, isUploading, onClose])

  const { startUpload, updateProgress, completeUpload } = useUpload()
  
  // Get gym slug from URL
  const gymSlug = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : null

  // Initialize Uppy instances for each slot
  const uppyInstances = useMemo(() => {
    const instances: Record<SlotName, Uppy> = {} as Record<SlotName, Uppy>
    SLOT_NAMES.forEach(slotName => {
      instances[slotName] = new Uppy({
        restrictions: {
          maxFileSize: 25 * 1024 * 1024 * 1024, // 25GB - dramatically increased for large videos
          allowedFileTypes: SLOT_CONFIG[slotName].allowedTypes,
          maxNumberOfFiles: SLOT_CONFIG[slotName].maxFiles,
          minNumberOfFiles: 1
        },
        autoProceed: false,
        allowMultipleUploadBatches: true
      })
    })
    return instances
  }, [])
  
  // Get current active Uppy instance
  const activeUppy = uppyInstances[activeSlot]

  // Add event listeners for file changes to update file counts
  useEffect(() => {
    const updateFileCounts = () => {
      const newCounts: Record<SlotName, number> = {} as Record<SlotName, number>
      SLOT_NAMES.forEach(slotName => {
        newCounts[slotName] = uppyInstances[slotName]?.getFiles().length || 0
      })
      setFileCounts(newCounts)
    }

    const updateFilePreviews = async () => {
      const newPreviews: Record<SlotName, Array<{ file: File; preview: string }>> = {
        'Photos': [],
        'Videos': [],
        'Facility Photos': [],
        'Facility Videos': []
      }

      // Generate previews for all files in each slot
      for (const slotName of SLOT_NAMES) {
        const files = uppyInstances[slotName]?.getFiles() || []
        const previews = []
        
        for (const file of files) {
          try {
            // Uppy file.data can be File or Blob, we need to ensure it's a File
            if (file.data instanceof File) {
              previews.push({ file: file.data, preview: '' })
            }
          } catch (error) {
            console.warn('Failed to generate preview for file:', file.name, error)
          }
        }
        
        newPreviews[slotName] = previews
      }
      
      setFilePreviews(newPreviews)
    }

    // Add event listeners to each Uppy instance
    const cleanupFunctions: (() => void)[] = []
    
    SLOT_NAMES.forEach(slotName => {
      const uppy = uppyInstances[slotName]
      if (uppy) {
        // Listen for file additions
        const onFileAdded = () => {
          updateFileCounts()
          updateFilePreviews()
        }
        // Listen for file removals
        const onFileRemoved = () => {
          updateFileCounts()
          updateFilePreviews()
        }
        
        uppy.on('file-added', onFileAdded)
        uppy.on('file-removed', onFileRemoved)
        
        cleanupFunctions.push(() => {
          uppy.off('file-added', onFileAdded)
          uppy.off('file-removed', onFileRemoved)
        })
      }
    })

    // Initial file count and preview update
    updateFileCounts()
    updateFilePreviews()

    // Cleanup function
    return () => {
      cleanupFunctions.forEach(cleanup => cleanup())
    }
  }, [uppyInstances])

  // Calculate total files across all slots
  const totalFiles = useMemo(() => {
    return Object.values(fileCounts).reduce((sum, count) => sum + count, 0)
  }, [fileCounts])

  // Function to remove a file from a specific slot
  const removeFile = useCallback((slotName: SlotName, fileToRemove: File) => {
    const uppy = uppyInstances[slotName]
    if (uppy) {
      const files = uppy.getFiles()
      const fileToRemoveUppy = files.find(f => f.data === fileToRemove)
      if (fileToRemoveUppy) {
        uppy.removeFile(fileToRemoveUppy.id)
      }
    }
  }, [uppyInstances])

  // Cleanup Uppy instance on unmount
  useEffect(() => {
    return () => {
      if (activeUppy) {
        console.log('Cleaning up Uppy instance')
      }
    }
  }, [activeUppy])

  // Helper functions
  const checkAuthStatus = useCallback(() => {
    const authStatus = {
      gymSlug: !!gymSlug,
      canUpload: !!gymSlug,
      gymName: gymSlug ? slugToGymName(gymSlug) : null
    }
    console.log('🔐 Checking upload status:', authStatus)
    return authStatus
  }, [gymSlug])

  const slugToGymName = useCallback((slug: string) => {
    return slug.replace(/-/g, ' ')
  }, [])

  const handleUpload = useCallback(async () => {
    try {
      console.log('🚀 Starting upload process...')
      
      // Get current state for debugging
      const currentState = {
        gymSlug,
        gymName: slugToGymName(gymSlug || ''),
      }
      console.log('🔍 Current state:', currentState)
      
      // Check if we have gym slug
      const authStatus = checkAuthStatus()
      if (!authStatus.canUpload) {
        throw new Error('Missing gym slug - please navigate to a gym page')
      }
      
      // Get files from ALL Uppy instances, not just the active one
      const allFiles: any[] = []
      const fileCounts: Record<string, number> = {}
      
      Object.entries(uppyInstances).forEach(([slotName, uppy]) => {
        const files = uppy.getFiles()
        allFiles.push(...files)
        fileCounts[slotName] = files.length
        console.log(`📊 ${slotName}: ${files.length} files`)
      })
      
      console.log(`📊 Total file counts by category:`, fileCounts)
      console.log(`📁 Total files to upload: ${allFiles.length}`)
      
      if (allFiles.length === 0) {
        toast.error('Please select files to upload')
        return
      }
      
      // 🚨 VALIDATION: Check for potential routing issues
      const hasMultipleCategories = Object.values(fileCounts).filter(count => count > 0).length > 1
      if (hasMultipleCategories) {
        console.log(`✅ Multiple content categories detected - routing should work properly`)
      } else {
        console.log(`⚠️ Single content category detected - ensure files are in correct slots`)
      }
      
      // 🚨 VALIDATION: Check for mixed file types in wrong categories
      Object.entries(uppyInstances).forEach(([slotName, uppy]) => {
        const files = uppy.getFiles()
        files.forEach(file => {
          const isImage = file.type.startsWith('image/')
          const isVideo = file.type.startsWith('video/')
          
          // Check if file type matches slot category
          if (slotName === 'Photos' && !isImage) {
            console.warn(`⚠️ ROUTING ISSUE: Non-image file "${file.name}" found in Photos slot`)
          } else if (slotName === 'Videos' && !isVideo) {
            console.warn(`⚠️ ROUTING ISSUE: Non-video file "${file.name}" found in Videos slot`)
          } else if (slotName === 'Facility Photos' && !isImage) {
            console.warn(`⚠️ ROUTING ISSUE: Non-image file "${file.name}" found in Facility Photos slot`)
          } else if (slotName === 'Facility Videos' && !isVideo) {
            console.warn(`⚠️ ROUTING ISSUE: Non-video file "${file.name}" found in Facility Videos slot`)
          } else {
            console.log(`✅ File "${file.name}" correctly categorized in ${slotName}`)
          }
        })
      })
      
      console.log(`📁 Starting upload of ${allFiles.length} files from all content types...`)
      
      // 🚨 MOBILE OPTIMIZATION: Limit concurrent uploads on mobile to prevent crashes
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const maxConcurrentUploads = isMobile ? 2 : 5 // Reduce concurrent uploads on mobile
      console.log(`📱 Mobile detected: ${isMobile}, max concurrent uploads: ${maxConcurrentUploads}`)
      
      // Set loading state and show immediate feedback
      setIsUploading(true)
      setUploadProgress(0)
      setUploadingFiles(allFiles.map(f => f.name).filter(Boolean) as string[])
      
      // Start upload in context and show floating progress
      startUpload(allFiles.length)
      
      // Simulate setup progress for better UX
      const updateSetupProgress = (progress: number, message: string) => {
        updateProgress(progress, message)
        // Add small delay for smooth progress animation
        return new Promise(resolve => setTimeout(resolve, 200))
      }

      try {
        // Phase 1: Initializing (1-3%)
        await updateSetupProgress(1, 'Initializing upload session...')
        await updateSetupProgress(2, 'Preparing file structure...')
        await updateSetupProgress(3, 'Setting up upload environment...')
        
        // Phase 2: Preparing folders (4-7%)
        await updateSetupProgress(4, 'Creating folder structure...')
        await updateSetupProgress(5, 'Organizing content slots...')
        await updateSetupProgress(6, 'Finalizing setup...')
        await updateSetupProgress(7, 'Ready to upload files...')
        
        // Phase 3: File processing (8-10%)
        await updateSetupProgress(8, 'Processing files...')
        await updateSetupProgress(9, 'Preparing uploads...')
        await updateSetupProgress(10, 'Starting file uploads...')
        
      } catch (error) {
        console.error('❌ Setup progress failed:', error)
        setIsUploading(false)
        setUploadingFiles([])
        completeUpload()
        toast.error('Setup failed. Please try again.', {
          duration: 5000,
          icon: '❌'
        })
        return
      }
      
      // Show immediate progress feedback
      updateProgress(1, 'Initializing upload...')
      
      // Show immediate success toast for better UX
      toast.success('Success! Content sent to team')
      
      // Close modal after setting up floating progress
      onClose()
      
      // Start background upload process with enhanced progress feedback
      setTimeout(async () => {
        try {
          // Simulate upload progress
          let progress = 10
          const interval = setInterval(() => {
            if (progress < 100) {
              progress += 5
              updateProgress(progress, `Uploading files... (${Math.floor((progress - 10) / 90 * allFiles.length)}/${allFiles.length})`)
            } else {
              clearInterval(interval)
              setIsUploading(false)
              setUploadingFiles([])
              completeUpload()
              toast.success('Upload completed!', {
                duration: 5000,
                icon: '✅'
              })
              setShowConfetti(true)
              setTimeout(() => setShowConfetti(false), 3000)
            }
          }, 500)
        } catch (error) {
          console.error('❌ Background upload failed:', error)
          setIsUploading(false)
          setUploadingFiles([])
          completeUpload()
          toast.error('Upload failed. Please try again.', {
            duration: 5000,
            icon: '❌'
          })
        }
      }, 100)
      
    } catch (error) {
      console.error('❌ Upload failed:', error)
      setIsUploading(false)
      setUploadingFiles([])
      completeUpload()
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    }
  }, [gymSlug, onClose, activeUppy, checkAuthStatus, uppyInstances, startUpload, updateProgress, completeUpload, slugToGymName])

  // Don't render modal if upload is in progress
  if (isUploading) {
    return null
  }

  if (!isOpen) return null

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-foreground">Upload Content</h2>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Content Layout - Responsive grid that works on all screen sizes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-8">
            {/* Slot Selector */}
            <SlotSelector
              activeSlot={activeSlot}
              setActiveSlot={setActiveSlot}
              fileCounts={fileCounts}
              totalFiles={totalFiles}
            />
            
            {/* Upload Area */}
            <UploadArea
              activeSlot={activeSlot}
              activeUppy={activeUppy}
              fileCounts={fileCounts}
              filePreviews={filePreviews}
              removeFile={removeFile}
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 pb-4 sm:pb-0 border-t border-border">
            <button
              onClick={onClose}
              className={cn(
                "w-full sm:w-auto px-6 sm:px-8 py-2 sm:py-3 rounded-xl",
                "border border-border hover:bg-muted transition-colors font-medium",
                "disabled:opacity-50"
              )}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={Object.values(fileCounts).every(count => count === 0) || isUploading}
              className={cn(
                "w-full sm:w-auto px-6 sm:px-10 py-2 sm:py-3 rounded-xl font-semibold",
                "transition-all duration-300 flex items-center justify-center space-x-3",
                Object.values(fileCounts).every(count => count === 0) || isUploading
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl"
              )}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Upload Content</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Floating Upload Progress Component */}
      {isUploading && (
        <FloatingUploadProgress
          isVisible={isUploading}
          progress={uploadProgress}
          currentFile={uploadingFiles[0] || ''}
          totalFiles={uploadingFiles.length}
          onClose={() => {
            setIsUploading(false)
            setUploadingFiles([])
            completeUpload()
          }}
          onMinimize={() => {}}
          isMinimized={false}
        />
      )}
    </>
  )
}
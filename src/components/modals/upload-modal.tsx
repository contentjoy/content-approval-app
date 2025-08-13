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
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/modal'
import { motion, AnimatePresence } from 'framer-motion'

// Import required Uppy CSS files
import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

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
  
  // Debug logging
  useEffect(() => {
    console.log('UploadModal debug:', { 
      isOpen, 
      gymName, 
      user: user ? { gymId: user.gymId, gymName: user.gymName } : 'null',
      gymSlug,
      params 
    })
  }, [isOpen, gymName, user, gymSlug, params])
  
  const [activeSlot, setActiveSlot] = useState<typeof SLOT_NAMES[number]>('Photos')
  const [isUploading, setIsUploading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  
  // Create Uppy instances for each slot
  const [uppyInstances] = useState(() => {
    const instances: Record<string, Uppy> = {}
    
    SLOT_NAMES.forEach(slotName => {
      const config = SLOT_CONFIG[slotName]
      const uppy = new Uppy({
        id: `uppy-${slotName.toLowerCase().replace(/\s+/g, '-')}`,
        restrictions: {
          maxNumberOfFiles: config.maxFiles,
          minNumberOfFiles: 0,
          maxFileSize: 50 * 1024 * 1024, // 50MB limit
          allowedFileTypes: config.allowedTypes,
        },
        autoProceed: false,
        allowMultipleUploadBatches: true,
        locale: {
          strings: {
            dropHereOr: 'Drop files here or %{browse}',
            browse: 'browse files',
            uploadComplete: 'Upload complete',
            uploadFailed: 'Upload failed',
            processing: 'Processing...',
            uploadXFiles: {
              0: 'Upload %{smart_count} file',
              1: 'Upload %{smart_count} files'
            },
            addMore: 'Add more files',
            addMoreFiles: 'Add more files',
            done: 'Done',
            removeFile: 'Remove file',
            cancel: 'Cancel',
            retry: 'Retry',
            pause: 'Pause',
            resume: 'Resume'
          },
          pluralize: (count: number) => count === 1 ? 0 : 1
        }
      })
      
      // Enable better file previews
      uppy.on('file-added', (file) => {
        console.log(`File added to ${slotName}:`, file.name, file.type)
      })
      
      instances[slotName] = uppy
    })
    
    return instances
  })

  // Cleanup Uppy instances on unmount
  useEffect(() => {
    return () => {
      console.log('Cleaning up Uppy instances')
    }
  }, [uppyInstances])

  const handleUpload = useCallback(async () => {
    if (!gymSlug || !gymName || !user?.gymId) {
      console.error('Missing gym information or user not authenticated')
      console.log('Debug info:', { gymSlug, gymName, user: user ? { gymId: user.gymId } : 'null' })
      toast.error('Please log in to upload files')
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
        toast.error('Please select files to upload')
        return
      }

      console.log(`Starting upload of ${totalFiles} files...`)
      toast.success(`Starting upload of ${totalFiles} files...`)
      
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
            toast.success(`Uploaded ${file.name} to ${slotName}`)
          } catch (error) {
            const errorMessage = `Failed to upload ${file.name} to ${slotName}: ${error instanceof Error ? error.message : 'Unknown error'}`
            console.error(errorMessage)
            errors.push(errorMessage)
            toast.error(errorMessage)
            // Stop the batch if any file fails
            throw new Error(errorMessage)
          }
        }
      }

      // Step 3: Complete upload
      await completeUpload(uploadId)
      console.log('Upload completed successfully')
      
      // Show confetti and success message
      setShowConfetti(true)
      toast.success('Content uploaded!')
      
      // Hide confetti after 2 seconds
      setTimeout(() => {
        setShowConfetti(false)
      }, 2000)
      
      onSuccess?.({ 
        uploadId, 
        timestamp: new Date().toISOString(),
        uploadedFiles: uploadResults,
        totalFiles
      })
      onClose()
      
    } catch (error) {
      console.error('Upload failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      toast.error(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }, [gymSlug, gymName, user?.gymId, uppyInstances, onSuccess, onClose])

  const getActiveUppy = () => uppyInstances[activeSlot]
  const getActiveConfig = () => SLOT_CONFIG[activeSlot]

  // Get total files across all categories
  const getTotalFiles = () => {
    return SLOT_NAMES.reduce((total, slotName) => {
      const uppy = uppyInstances[slotName]
      return total + uppy.getFiles().length
    }, 0)
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Content"
      size="xl"
    >
      <div className="space-y-6">
        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Slot Selector */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-semibold text-text">Content Types</h3>
            <div className="space-y-3">
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
                    className={`w-full p-3 rounded-md border-2 transition-all duration-200 text-left ${
                      isActive 
                        ? 'border-accent bg-accent/10' 
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${
                        isActive ? 'text-accent' : 'text-muted-text'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${
                          isActive ? 'text-text' : 'text-text/80'
                        }`}>
                          {slotName}
                        </div>
                        <div className="text-xs text-muted-text mt-1">
                          {fileCount} files selected
                        </div>
                        <div className="text-xs text-muted-text mt-1">
                          Accepts {config.allowedTypes.join(', ')}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            
            {/* Total Files Summary */}
            <div className="p-3 bg-[var(--surface)] rounded-md border border-border">
              <div className="text-sm font-medium text-text">
                Total Files: {getTotalFiles()}
              </div>
              <div className="text-xs text-muted-text mt-1">
                Ready to upload
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div className="lg:col-span-3 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-text mb-2">
                {activeSlot}
              </h3>
              <p className="text-muted-text text-sm">
                {getActiveConfig().description}
              </p>
            </div>

            {/* Uppy Dashboard */}
            <div className="border border-border rounded-lg p-4">
              <Dashboard
                uppy={getActiveUppy()}
                plugins={[]}
                width="100%"
                height={450}
                showProgressDetails={true}
                proudlyDisplayPoweredByUppy={false}
                theme="light"
                showRemoveButtonAfterComplete={true}
                showLinkToFileUploadResult={false}
                note={`Accepted file types: ${getActiveConfig().allowedTypes.join(', ')}. Maximum size: 50MB.`}
                doneButtonHandler={() => {
                  console.log('Upload complete for current slot')
                }}
                hideUploadButton={true}
                showSelectedFiles={true}
              />
            </div>

            {/* Upload Button */}
            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                disabled={isUploading || getTotalFiles() === 0}
                className="px-6 py-3 bg-accent text-white rounded-md font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Uploading {getTotalFiles()} files...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload content</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Confetti Celebration */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-[60]"
          >
            <ConfettiCelebration />
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  )
}

// Confetti Celebration Component
function ConfettiCelebration() {
  const [particles, setParticles] = useState<Array<{
    id: number
    x: number
    y: number
    color: string
    size: number
    speed: number
  }>>([])

  useEffect(() => {
    const colors = ['#3b82f6', '#8b5cf6', '#ef4444', '#10b981', '#f59e0b']
    const newParticles = Array.from({ length: 150 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -20,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      speed: Math.random() * 6 + 4
    }))
    
    setParticles(newParticles)

    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          y: particle.y + particle.speed
        })).filter(particle => particle.y < window.innerHeight + 50)
      )
    }, 30)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none">
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: particle.x,
            top: particle.y,
            backgroundColor: particle.color,
            width: particle.size,
            height: particle.size
          }}
          animate={{
            rotate: [0, 360],
            scale: [1, 0.8, 1]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

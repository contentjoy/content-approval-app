'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { Image, Video, Building2, Camera, ArrowUp } from 'lucide-react'
import { Dashboard } from '@uppy/react'
import Uppy from '@uppy/core'
import { useBranding } from '@/hooks/use-branding'
import { useAuth } from '@/contexts/auth-context'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/modal'

// Import required Uppy CSS files
import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (data: any) => void
}

const SLOT_NAMES = ['Photos', 'Videos', 'Facility Photos', 'Facility Videos'] as const
type SlotName = typeof SLOT_NAMES[number]

const SLOT_CONFIG = {
  'Photos': { icon: Image, maxFiles: 50, allowedTypes: ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
  'Videos': { icon: Video, maxFiles: 30, allowedTypes: ['.mp4', '.mov', '.avi', '.mkv', '.webm'] },
  'Facility Photos': { icon: Building2, maxFiles: 40, allowedTypes: ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
  'Facility Videos': { icon: Camera, maxFiles: 20, allowedTypes: ['.mp4', '.mov', '.avi', '.mkv', '.webm'] }
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [activeSlot, setActiveSlot] = useState<SlotName>('Photos')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const { gymName: brandingGymName } = useBranding()
  const { user } = useAuth()
  const userGymName = user?.gymName
  
  // Get gym slug from URL
  const gymSlug = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : null
  
  // Create separate Uppy instances for each content type
  const uppyInstances = useMemo(() => {
    const instances: Record<SlotName, Uppy> = {} as Record<SlotName, Uppy>
    SLOT_NAMES.forEach(slotName => {
      instances[slotName] = new Uppy({
        restrictions: {
          maxFileSize: 50 * 1024 * 1024, // 50MB
          allowedFileTypes: SLOT_CONFIG[slotName].allowedTypes,
          maxNumberOfFiles: SLOT_CONFIG[slotName].maxFiles, // Use SLOT_CONFIG values
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

  // Cleanup Uppy instance on unmount
  useEffect(() => {
    return () => {
      if (activeUppy) {
        console.log('Cleaning up Uppy instance')
        // uppy.close() // Remove this line as it doesn't exist
      }
    }
  }, [activeUppy])

  // Helper functions
  const checkAuthStatus = useCallback(() => {
    const authStatus = {
      user: !!user,
      gymSlug: !!gymSlug,
      canUpload: !!(user && gymSlug),
      sessionToken: !!user?.gymId // Use gymId instead of id
    }
    console.log('🔐 Checking auth status:', authStatus)
    return authStatus
  }, [user, gymSlug])

  const slugToGymName = useCallback((slug: string) => {
    return slug.replace(/-/g, ' ')
  }, [])

  const getGymIdForUpload = useCallback(async () => {
    if (!gymSlug) return user?.gymId
    
    console.log('🔍 Getting gym ID for upload...')
    console.log('🔍 getGymIdForUpload called with:', { gymSlug, userGymId: user?.gymId, userGymName: user?.gymName })
    
    const gymName = slugToGymName(gymSlug)
    console.log('🔍 Looking up gym by name:', gymSlug, '->', `"${gymName}"`)
    
    const { data: gym, error } = await supabase
      .from('gyms')
      .select('id')
      .eq('"Gym Name"', gymName)
      .single()
    
    if (error || !gym) {
      console.log('🔍 Gym lookup failed, falling back to user.gymId')
      return user?.gymId
    }
    
    console.log('✅ Found gym by name:', gymSlug, '->', `"${gymName}" (ID: ${gym.id})`)
    return gym.id
  }, [gymSlug, user?.gymId, user?.gymName, slugToGymName])

  const handleUpload = useCallback(async () => {
    try {
      console.log('🚀 Starting upload process...')
      
      // Get current state for debugging
      const currentState = {
        gymSlug,
        gymName: brandingGymName || userGymName,
        userGymId: user?.gymId,
        userGymName: user?.gymName
      }
      console.log('🔍 Current state:', currentState)
      
      // Check authentication status
      const authStatus = checkAuthStatus()
      if (!authStatus.canUpload) {
        throw new Error('Missing gym information or user not authenticated')
      }
      
      // Get gym ID for upload
      const gymId = await getGymIdForUpload()
      if (!gymId) {
        throw new Error('Could not determine gym ID for upload')
      }
      
      console.log('✅ Got gym ID:', gymId)
      
      // Get files from ALL Uppy instances, not just the active one
      const allFiles: any[] = []
      Object.values(uppyInstances).forEach(uppy => {
        const files = uppy.getFiles()
        allFiles.push(...files)
      })
      
      if (allFiles.length === 0) {
        toast.error('Please select files to upload')
        return
      }
      
      console.log(`📁 Starting upload of ${allFiles.length} files from all content types...`)
      
      // Set loading state and show immediate feedback
      setIsUploading(true)
      setUploadProgress(0)
      setUploadingFiles(allFiles.map(f => f.name).filter(Boolean) as string[])
      
      // Show immediate success toast for better UX
      toast.success('Success! Content sent to team')
      
      // Close modal quickly for better UX
      onClose()
      
      // Start background upload process
      setTimeout(async () => {
        try {
          const uploadResults = []
          
          for (let i = 0; i < allFiles.length; i++) {
            const file = allFiles[i]
            try {
              console.log(`📤 Uploading ${file.name}...`)
              
              // Update progress
              const progress = Math.round(((i + 1) / allFiles.length) * 100)
              setUploadProgress(progress)
              
              // Show progress toast
              toast.success(`Uploading ${file.name}... (${progress}%)`, {
                duration: 2000,
                icon: '📤'
              })
              
              // For large files (>5MB), use chunked upload
              if (file.size > 5 * 1024 * 1024) {
                console.log(`📦 Large file detected (${(file.size / (1024 * 1024)).toFixed(1)}MB), using chunked upload...`)
                
                // Split large files into smaller chunks (1MB to respect server limits)
                const chunkSize = 1 * 1024 * 1024 // 1MB chunks (much smaller than 4MB)
                const chunks = []
                const buffer = Buffer.from(await file.data.arrayBuffer())
                
                for (let j = 0; j < buffer.length; j += chunkSize) {
                  chunks.push(buffer.slice(j, j + chunkSize))
                }
                
                console.log(`📦 Uploading ${chunks.length} chunks for ${file.name}...`)
                
                // Upload chunks sequentially
                for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
                  const chunk = chunks[chunkIndex]
                  const chunkData = chunk.toString('base64')
                  
                  const chunkResponse = await fetch('/api/upload-to-drive', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      files: [{
                        name: `${file.name}.part${chunkIndex + 1}`,
                        type: file.type,
                        size: chunk.length,
                        data: chunkData,
                        isChunk: true,
                        originalName: file.name,
                        chunkIndex,
                        totalChunks: chunks.length
                      }],
                      gymSlug,
                      gymName: brandingGymName || userGymName
                    })
                  })
                  
                  if (!chunkResponse.ok) {
                    throw new Error(`Chunk ${chunkIndex + 1} failed: ${chunkResponse.status}`)
                  }
                  
                  // Update progress for each chunk
                  const chunkProgress = Math.round(((i + chunkIndex + 1) / (allFiles.length + chunks.length - 1)) * 100)
                  setUploadProgress(chunkProgress)
                  
                  // Show chunk progress toast
                  toast.success(`Chunk ${chunkIndex + 1}/${chunks.length} uploaded for ${file.name}`, {
                    duration: 1500,
                    icon: '📦'
                  })
                }
                
                console.log(`✅ All chunks uploaded for ${file.name}`)
                
                uploadResults.push({
                  name: file.name,
                  success: true,
                  fileId: 'chunked-upload-complete'
                })
                
              } else {
                // Small files use regular upload
                const filesForUpload = [{
                  name: file.name,
                  type: file.type,
                  size: file.size,
                  data: await file.data.arrayBuffer().then((buffer: ArrayBuffer) => Buffer.from(buffer).toString('base64'))
                }]

                const response = await fetch('/api/upload-to-drive', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    files: filesForUpload,
                    gymSlug,
                    gymName: brandingGymName || userGymName
                  })
                })
                
                if (!response.ok) {
                  const errorData = await response.json()
                  throw new Error(errorData.error || `Upload failed: ${response.status}`)
                }
                
                const result = await response.json()
                console.log(`✅ File uploaded successfully: ${file.name}`)
                
                uploadResults.push({
                  name: file.name,
                  success: true,
                  fileId: result.results[0]?.fileId || 'unknown'
                })
              }
              
            } catch (error) {
              console.error(`❌ Failed to upload ${file.name}:`, error)
              uploadResults.push({
                name: file.name,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
              })
              
              // Show error toast
              toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                duration: 5000,
                icon: '❌'
              })
            }
          }
          
          // Upload completed
          setUploadProgress(100)
          setIsUploading(false)
          setUploadingFiles([])
          
          // Show completion message
          const successCount = uploadResults.filter(r => r.success).length
          if (successCount > 0) {
            toast.success(`🎉 Upload completed! ${successCount}/${allFiles.length} files uploaded successfully`, {
              duration: 5000,
              icon: '✅'
            })
            setShowConfetti(true)
          }
          
          // Clear ALL Uppy instances
          Object.values(uppyInstances).forEach(uppy => {
            const files = uppy.getFiles()
            files.forEach(file => {
              uppy.removeFile(file.id)
            })
          })
          
          // Hide confetti after delay
          setTimeout(() => {
            setShowConfetti(false)
          }, 3000)
          
        } catch (error) {
          console.error('❌ Background upload failed:', error)
          setIsUploading(false)
          setUploadingFiles([])
          toast.error('Upload failed. Please try again.', {
            duration: 5000,
            icon: '❌'
          })
        }
      }, 100) // Small delay to show immediate feedback
      
    } catch (error) {
      console.error('❌ Upload failed:', error)
      setIsUploading(false)
      setUploadingFiles([])
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    }
  }, [gymSlug, brandingGymName, userGymName, user, onClose, activeUppy, checkAuthStatus, getGymIdForUpload, uppyInstances])

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Content">
      <div className="space-y-8">
        {/* Content Layout - Much better desktop spacing */}
        <div className="grid grid-cols-1 2xl:grid-cols-6 gap-10">
          {/* Slot Selector - Better proportions on desktop */}
          <div className="2xl:col-span-2 space-y-6">
            <h3 className="font-semibold text-foreground text-xl">Content Types</h3>
            <div className="space-y-4">
              {SLOT_NAMES.map((slotName) => {
                const config = SLOT_CONFIG[slotName]
                const Icon = config.icon
                const isActive = activeSlot === slotName
                const fileCount = uppyInstances[slotName]?.getFiles().length || 0
                
                return (
                  <button
                    key={slotName}
                    onClick={() => setActiveSlot(slotName as SlotName)}
                    className={`w-full p-5 rounded-xl border-2 transition-all duration-300 text-left hover:scale-[1.02] ${
                      isActive 
                        ? 'border-primary bg-primary/10 shadow-xl' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <Icon className={`w-7 h-7 ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-lg ${
                          isActive ? 'text-foreground' : 'text-foreground/80'
                        }`}>
                          {slotName}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          {fileCount} files selected
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {config.allowedTypes.join(', ')}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Upload Area - Much more spacious on desktop */}
          <div className="2xl:col-span-4 space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-foreground mb-3">{activeSlot}</h3>
              <p className="text-muted-foreground text-lg">
                Upload {activeSlot.toLowerCase()} for your content library
              </p>
            </div>
            
            {/* Upload Zone - Larger and more prominent */}
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-2xl p-10 text-center hover:border-primary/50 transition-colors">
              <Dashboard
                uppy={activeUppy}
                plugins={['Webcam']}
                width="100%"
                height="400px"
                proudlyDisplayPoweredByUppy={false}
                showProgressDetails={false}
                showRemoveButtonAfterComplete={false}
                doneButtonHandler={() => {}}
                note="Drag and drop files here, or click to browse"
              />
            </div>
            
            {/* File Info */}
            <div className="text-sm text-muted-foreground text-center">
              Accepted file types: {SLOT_CONFIG[activeSlot]?.allowedTypes.join(', ')}. Maximum size: 50MB.
            </div>
            
            {/* Upload Progress - Removed since modal closes quickly */}
            {/* Progress is now shown in toast notifications */}
          </div>
        </div>
        
        {/* Action Buttons - Better spacing */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl border border-border hover:bg-muted transition-colors font-medium"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={Object.values(uppyInstances).every(uppy => uppy.getFiles().length === 0) || isUploading}
            className={`px-10 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-3 ${
              Object.values(uppyInstances).every(uppy => uppy.getFiles().length === 0) || isUploading
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl'
            }`}
          >
            {isUploading ? (
              <>
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <ArrowUp className="w-5 h-5" />
                <span>Upload Content</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="bg-green-500 text-white px-8 py-4 rounded-lg shadow-2xl text-center animate-bounce">
            <div className="text-2xl mb-2">🎉</div>
            <div className="font-bold">Upload Successful!</div>
            <div className="text-sm opacity-90">Your content has been sent to the team</div>
          </div>
        </div>
      )}
    </Modal>
  )
}

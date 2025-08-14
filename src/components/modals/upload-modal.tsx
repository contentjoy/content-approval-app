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
  'Photos': { icon: Image, maxFiles: 10, allowedTypes: ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
  'Videos': { icon: Video, maxFiles: 5, allowedTypes: ['.mp4', '.mov', '.avi', '.mkv', '.webm'] },
  'Facility Photos': { icon: Building2, maxFiles: 8, allowedTypes: ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
  'Facility Videos': { icon: Camera, maxFiles: 3, allowedTypes: ['.mp4', '.mov', '.avi', '.mkv', '.webm'] }
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [activeSlot, setActiveSlot] = useState<SlotName>('Photos')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const { gymName: brandingGymName } = useBranding()
  const { user } = useAuth()
  
  // Get gym slug from URL
  const gymSlug = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] : null
  const userGymName = user?.gymName

  // Create Uppy instance
  const uppy = useMemo(() => {
    const uppyInstance = new Uppy({
      restrictions: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedFileTypes: ['image/*', 'video/*'],
        maxNumberOfFiles: 20,
      },
      autoProceed: false,
      allowMultipleUploadBatches: true,
      locale: {
        strings: {
          dropPaste: 'Drop files here, or %{browse}',
          browse: 'browse',
          uploadComplete: 'Upload complete!',
          uploadFailed: 'Upload failed',
          processing: 'Processing...',
          uploadXFiles: {
            0: 'Upload %{smart_count} file',
            1: 'Upload %{smart_count} files'
          },
          uploadXNewFiles: {
            0: 'Upload +%{smart_count} file',
            1: 'Upload +%{smart_count} files'
          }
        },
        pluralize: (count: number) => count === 1 ? 0 : 1
      }
    })

    // Handle successful file additions
    uppyInstance.on('file-added', (file) => {
      console.log('✅ File added:', file.name)
      toast.success(`File ${file.name} added successfully!`)
    })

    // Handle file validation errors
    uppyInstance.on('upload-error', (file, error) => {
      if (file) {
        console.error('❌ File error:', error)
        toast.error(`Error with ${file.name}: ${error.message}`)
      }
    })

    // Handle upload success
    uppyInstance.on('upload-success', (file, response) => {
      if (file) {
        console.log('✅ File uploaded successfully:', file.name)
        toast.success(`File ${file.name} uploaded successfully!`)
      }
    })

    return uppyInstance
  }, [])

  // Cleanup Uppy instance on unmount
  useEffect(() => {
    return () => {
      if (uppy) {
        console.log('Cleaning up Uppy instance')
        // uppy.close() // Remove this line as it doesn't exist
      }
    }
  }, [uppy])

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
      
      // Get files from Uppy
      const uppyFiles = uppy.getFiles()
      if (uppyFiles.length === 0) {
        toast.error('Please select files to upload')
        return
      }
      
      console.log(`📁 Starting upload of ${uppyFiles.length} files...`)
      
      // Set loading state and show immediate feedback
      setIsUploading(true)
      setUploadProgress(0)
      setUploadingFiles(uppyFiles.map(f => f.name).filter(Boolean) as string[])
      
      // Show immediate success toast for better UX
      toast.success('Success! Content sent to team')
      
      // Start background upload process
      setTimeout(async () => {
        try {
          const uploadResults = []
          
          for (let i = 0; i < uppyFiles.length; i++) {
            const file = uppyFiles[i]
            try {
              console.log(`📤 Uploading ${file.name}...`)
              
              // Update progress
              const progress = Math.round(((i + 1) / uppyFiles.length) * 100)
              setUploadProgress(progress)
              
              // TEMPORARY: Use the working upload-to-drive API
              const filesForUpload = [{
                name: file.name,
                type: file.type,
                size: file.size,
                data: await file.data.arrayBuffer().then(buffer => Buffer.from(buffer).toString('base64'))
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
              
            } catch (error) {
              console.error(`❌ Failed to upload ${file.name}:`, error)
              uploadResults.push({
                name: file.name,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
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
            toast.success(`Upload completed! ${successCount}/${uppyFiles.length} files uploaded successfully`)
            setShowConfetti(true)
          }
          
          // Clear Uppy files
          uppyFiles.forEach(file => {
            uppy.removeFile(file.id)
          })
          
          // Close modal after a short delay
          setTimeout(() => {
            onClose()
            setShowConfetti(false)
          }, 2000)
          
        } catch (error) {
          console.error('❌ Background upload failed:', error)
          setIsUploading(false)
          setUploadingFiles([])
          toast.error('Upload failed. Please try again.')
        }
      }, 100) // Small delay to show immediate feedback
      
    } catch (error) {
      console.error('❌ Upload failed:', error)
      setIsUploading(false)
      setUploadingFiles([])
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    }
  }, [gymSlug, brandingGymName, userGymName, user, onClose, uppy, checkAuthStatus, getGymIdForUpload])

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Content">
      <div className="space-y-6">
        {/* Content Layout - Improved desktop spacing */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Slot Selector - Wider on desktop */}
          <div className="xl:col-span-2 space-y-4">
            <h3 className="font-semibold text-foreground text-lg">Content Types</h3>
            <div className="space-y-3">
              {SLOT_NAMES.map((slotName) => {
                const config = SLOT_CONFIG[slotName]
                const Icon = config.icon
                const isActive = activeSlot === slotName
                const fileCount = uppy.getFiles().length
                
                return (
                  <button
                    key={slotName}
                    onClick={() => setActiveSlot(slotName as SlotName)}
                    className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left hover:scale-[1.02] ${
                      isActive 
                        ? 'border-primary bg-primary/10 shadow-lg' 
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <Icon className={`w-6 h-6 ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-base ${
                          isActive ? 'text-foreground' : 'text-foreground/80'
                        }`}>
                          {slotName}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
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
          
          {/* Upload Area - More spacious on desktop */}
          <div className="xl:col-span-3 space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-2">{activeSlot}</h3>
              <p className="text-muted-foreground">
                Upload {activeSlot.toLowerCase()} for your content library
              </p>
            </div>
            
            {/* Upload Zone */}
            <div className="border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
              <Dashboard
                uppy={uppy}
                plugins={['Webcam']}
                width="100%"
                height="300px"
                proudlyDisplayPoweredByUppy={false}
                showProgressDetails={true}
                doneButtonHandler={() => {}}
              />
            </div>
            
            {/* File Info */}
            <div className="text-sm text-muted-foreground text-center">
              Accepted file types: {SLOT_CONFIG[activeSlot]?.allowedTypes.join(', ')}. Maximum size: 50MB.
            </div>
            
            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Uploading files...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                {uploadingFiles.length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Currently uploading: {uploadingFiles[0]}...
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={uppy.getFiles().length === 0 || isUploading}
            className={`px-8 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
              uppy.getFiles().length === 0 || isUploading
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
            }`}
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <ArrowUp className="w-4 h-4" />
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

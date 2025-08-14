'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { X, Upload, Image, Video, Building2, Camera } from 'lucide-react'
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
      
      // Use the existing working upload route for each file
      const uploadResults = []
      
      for (const file of uppyFiles) {
        try {
          console.log(`📤 Uploading ${file.name}...`)
          
          // TEMPORARILY DISABLED - Using the working upload-to-drive API instead
          /*
          // Call the existing working upload route with proper typing
          const uploadUrl = `/api/uploads/${gymId as string}/slots/Photos/upload?filename=${encodeURIComponent(file.name)}&mime=${encodeURIComponent(file.type)}&sizeBytes=${file.size}`
          
          const response = await fetch(uploadUrl, {
            method: 'POST',
            body: file.data
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
            fileId: result.driveFileId
          })
          */
          
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
      
      // Show success message
      const successCount = uploadResults.filter(r => r.success).length
      toast.success(`Successfully uploaded ${successCount}/${uppyFiles.length} files!`)
      setShowConfetti(true)
      
      // Clear Uppy files
      uppyFiles.forEach(file => {
        uppy.removeFile(file.id)
      })
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose()
        setShowConfetti(false)
      }, 3000)
      
    } catch (error) {
      console.error('❌ Upload failed:', error)
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    }
  }, [gymSlug, brandingGymName, userGymName, user, onClose, uppy, checkAuthStatus, getGymIdForUpload])

  // Get total files across all categories
  const getTotalFiles = () => {
    return uppy.getFiles().length
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Content">
      <div className="space-y-6">
        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Slot Selector */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="font-semibold text-foreground">Content Types</h3>
            <div className="space-y-3">
              {SLOT_NAMES.map((slotName) => {
                const config = SLOT_CONFIG[slotName]
                const Icon = config.icon
                const isActive = activeSlot === slotName
                const fileCount = uppy.getFiles().length
                
                return (
                  <button
                    key={slotName}
                    onClick={() => setActiveSlot(slotName)}
                    className={`w-full p-3 rounded-md border-2 transition-all duration-200 text-left ${
                      isActive 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className={`font-medium ${
                          isActive ? 'text-foreground' : 'text-foreground/80'
                        }`}>
                          {slotName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {fileCount} files selected
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Accepts {config.allowedTypes.join(', ')}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            
            {/* Total Files Summary */}
            <div className="p-3 bg-muted rounded-md border border-border">
              <div className="text-sm font-medium text-foreground">
                Total Files: {getTotalFiles()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Ready to upload to {brandingGymName || userGymName || 'your gym'}
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div className="lg:col-span-3 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {activeSlot}
              </h3>
              <p className="text-muted-foreground text-sm">
                Upload {activeSlot.toLowerCase()} for your content library
              </p>
            </div>

            {/* Uppy Dashboard */}
            <div className="border border-border rounded-lg p-4">
              <Dashboard
                uppy={uppy}
                plugins={[]}
                width="100%"
                height={450}
                proudlyDisplayPoweredByUppy={false}
                showProgressDetails={true}
                theme="light"
                showRemoveButtonAfterComplete={true}
                showLinkToFileUploadResult={false}
                note={`Accepted file types: ${SLOT_CONFIG[activeSlot].allowedTypes.join(', ')}. Maximum size: 50MB.`}
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
                disabled={getTotalFiles() === 0}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Content</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confetti Celebration */}
      {/* {showConfetti && <ConfettiCelebration />} */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
            🎉 Upload Successful!
          </div>
        </div>
      )}
    </Modal>
  )
}

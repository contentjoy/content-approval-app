'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { X, Upload, Image, Video, Building2, Camera } from 'lucide-react'
import { Dashboard } from '@uppy/react'
import Uppy from '@uppy/core'
import { useBranding } from '@/hooks/use-branding'
import { useAuth } from '@/contexts/auth-context'
import { toast } from '@/components/ui/toast'
import { ConfettiCelebration } from '@/components/ui/progress-bar'
import { supabase } from '@/lib/supabase'
import { Modal } from '@/components/ui/modal'

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
      },
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

    return uppyInstance
  }, [])

  // Cleanup Uppy instance on unmount
  useEffect(() => {
    return () => {
      if (uppy) {
        console.log('Cleaning up Uppy instance')
        uppy.close()
      }
    }
  }, [uppy])

  // Helper functions
  const checkAuthStatus = useCallback(() => {
    const authStatus = {
      user: !!user,
      gymSlug: !!gymSlug,
      canUpload: !!(user && gymSlug),
      sessionToken: !!user?.id
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
      const files = uppy.getFiles()
      if (files.length === 0) {
        toast.error('Please select files to upload')
        return
      }
      
      console.log(`📁 Starting upload of ${files.length} files to Google Drive...`)
      
      // TODO: Implement direct Google Drive upload using OAuth
      // For now, show success message
      toast.success(`Upload process initiated for ${files.length} files!`)
      setShowConfetti(true)
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose()
        setShowConfetti(false)
      }, 2000)
      
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
        {/* Slot Navigation */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {SLOT_NAMES.map((slotName) => {
            const config = SLOT_CONFIG[slotName]
            const Icon = config.icon
            const isActive = activeSlot === slotName
            const fileCount = uppy.getFiles().length
            
            return (
              <button
                key={slotName}
                onClick={() => setActiveSlot(slotName)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                  isActive
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="whitespace-nowrap">{slotName}</span>
                {fileCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    {fileCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* File Upload Area */}
        <div className="border border-border rounded-lg p-4">
          <Dashboard
            uppy={uppy}
            plugins={[]}
            width="100%"
            height="400px"
            proudlyDisplayPoweredByUppy={false}
          />
        </div>

        {/* Upload Button */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={getTotalFiles() === 0}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Content</span>
          </button>
        </div>
      </div>

      {/* Confetti Celebration */}
      {showConfetti && <ConfettiCelebration />}
    </Modal>
  )
}

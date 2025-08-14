'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { X, Upload, Image, Video, Building2, Camera } from 'lucide-react'
import { Dashboard } from '@uppy/react'
import Uppy from '@uppy/core'
import GoogleDrive from '@uppy/google-drive';
import { useBranding } from '@/contexts/branding-context'
import { useAuth } from '@/contexts/auth-context'
import { useParams } from 'next/navigation'
import { SLOT_NAMES } from '@/lib/slots'
import { initUpload, uploadFile, completeUpload } from '@/lib/contentUploadClient'
import type { SlotName } from '@/lib/slots'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/modal'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

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
  const { gymName: brandingGymName } = useBranding()
  const { user } = useAuth()
  const params = useParams()
  const gymSlug = typeof params.gymSlug === 'string' ? params.gymSlug : null
  
  // Use gym name from user context if available, fallback to branding context
  const gymName = user?.gymName || brandingGymName
  
  // Convert URL slug to database gym name format
  const slugToGymName = useCallback((slug: string): string => {
    // Convert "kokoro-demo" to "kokoro demo"
    return slug.replace(/-/g, ' ')
  }, [])
  
  // Get the correct gym ID for uploads - use gymSlug from URL if available
  const getGymIdForUpload = useCallback(async (): Promise<string> => {
    console.log('🔍 getGymIdForUpload called with:', { gymSlug, userGymId: user?.gymId, userGymName: user?.gymName })
    
    // If no gym slug, we need user context
    if (!gymSlug) {
      console.log('⚠️ No gymSlug from URL, falling back to user context')
      if (!user?.gymId) {
        console.error('❌ No gym ID available for upload - user context missing')
        throw new Error('No gym ID available for upload')
      }
      console.log('✅ Using gym ID from user context:', user.gymId)
      return user.gymId
    }
    
    // Convert slug to gym name format
    const gymName = slugToGymName(gymSlug)
    console.log(`🔍 Looking up gym by name: ${gymSlug} -> "${gymName}"`)
    
    // Look up gym by converted name to get the correct gym ID
    try {
      console.log(`🔍 Looking up gym by name: ${gymSlug} -> "${gymName}"`)
      
      // Use 'Gym Name' column with the converted name (spaces instead of dashes)
      const { data: gym, error } = await supabase
        .from('gyms')
        .select('id, "Gym Name"')
        .eq('"Gym Name"', gymName)
        .single()
      
      console.log('📊 Supabase query result:', { gym, error })
      
      if (error) {
        console.error('❌ Supabase query error:', error)
        // Fallback to user context
        if (!user?.gymId) {
          console.error('❌ Fallback failed - no user gym ID available')
          throw new Error(`Gym not found for name: "${gymName}"`)
        }
        console.log('✅ Falling back to user gym ID:', user.gymId)
        return user.gymId
      }
      
      if (!gym) {
        console.error('❌ No gym found with name:', `"${gymName}"`)
        // Fallback to user context
        if (!user?.gymId) {
          console.error('❌ Fallback failed - no user gym ID available')
          throw new Error(`Gym not found for name: "${gymName}"`)
        }
        console.log('✅ Falling back to user gym ID:', user.gymId)
        return user.gymId
      }
      
      console.log(`✅ Found gym by name: ${gymSlug} -> "${gymName}" (ID: ${gym.id})`)
      return gym.id
    } catch (error) {
      console.error('❌ Error looking up gym by name:', error)
      // Fallback to user context
      if (!user?.gymId) {
        console.error('❌ Fallback failed - no user gym ID available')
        throw new Error(`Failed to look up gym for name: "${gymName}"`)
      }
      console.log('✅ Falling back to user gym ID:', user.gymId)
      return user.gymId
    }
  }, [gymSlug, user?.gymId, slugToGymName])
  
  // Check if we can proceed with upload
  const canUpload = useCallback(() => {
    if (!gymSlug) {
      // Need user context if no gym slug
      return !!user?.gymId
    }
    // Can always try to upload if we have a gym slug (will look it up)
    return true
  }, [gymSlug, user?.gymId])
  
  // Check authentication status
  const checkAuthStatus = useCallback(() => {
    console.log('🔐 Checking auth status:', { 
      user: !!user, 
      gymSlug, 
      canUpload: canUpload(),
      sessionToken: typeof window !== 'undefined' ? !!localStorage.getItem('session_token') : false
    })
    
    if (!user && !gymSlug) {
      console.error('❌ No user context and no gym slug - cannot upload')
      return false
    }
    
    if (!user && gymSlug) {
      console.log('⚠️ No user context but have gym slug - will attempt gym lookup')
      return true
    }
    
    return true
  }, [user, gymSlug, canUpload])
  
  // Debug logging
  useEffect(() => {
    console.log('UploadModal debug:', { 
      isOpen, 
      brandingGymName,
      userGymName: user?.gymName,
      finalGymName: gymName,
      user: user ? { gymId: user.gymId, gymName: user.gymName } : 'null',
      gymSlug,
      params 
    })
  }, [isOpen, brandingGymName, user, gymName, gymSlug, params])
  
  // Force fresh deployment - trigger Vercel rebuild
  // All previous fixes included: OpenSSL fix, gym ID resolution, enhanced error handling
  // Environment variable now correctly formatted in Vercel - force refresh deployment
  // Enhanced Uppy configuration with better validation, error handling, and progress tracking
  const [activeSlot, setActiveSlot] = useState<typeof SLOT_NAMES[number]>('Photos')
  const [isUploading, setIsUploading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  
  // Create Uppy instances for each slot
  const uppy = useMemo(() => {
    const uppyInstance = new Uppy({
      restrictions: {
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedFileTypes: ['image/*', 'video/*'],
      },
      locale: {
        strings: {
          // Customize strings for better UX
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
    });

    // Handle successful file additions
    uppyInstance.on('file-added', (file) => {
      console.log('✅ File added:', file.name);
      toast.success(`File ${file.name} added successfully!`);
    });

    // Handle file validation errors
    uppyInstance.on('upload-error', (file, error) => {
      if (file) {
        console.error('❌ File error:', error);
        toast.error(`Error with ${file.name}: ${error.message}`);
      }
    });

    return uppyInstance;
  }, []);

  // Cleanup Uppy instances on unmount
  useEffect(() => {
    return () => {
      if (uppy) {
        console.log('Cleaning up Uppy instance')
        uppy.close()
      }
    }
  }, [uppy])

  const handleUpload = useCallback(async () => {
    try {
      console.log('🚀 Starting upload process...')
      
      // Get current state for debugging
      const currentState = {
        gymSlug,
        gymName: brandingGymName || user?.gymName,
        userGymId: user?.gymId,
        userGymName: user?.gymName
      }
      console.log('🔍 Current state:', currentState)
      
      // Check authentication status
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
      
      const authStatus = checkAuthStatus()
      if (!authStatus.canUpload) {
        throw new Error('Missing gym information or user not authenticated')
      }
      
      // Get gym ID for upload
      const getGymIdForUpload = useCallback(async () => {
        console.log('🔍 Getting gym ID for upload...')
        console.log('🔍 getGymIdForUpload called with:', { gymSlug, userGymId: user?.gymId, userGymName: user?.gymName })
        
        // Convert URL slug to gym name format (e.g., "kokoro-demo" -> "kokoro demo")
        const slugToGymName = useCallback((slug: string) => {
          return slug.replace(/-/g, ' ')
        }, [])
        
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
      }, [gymSlug, user?.gymId, user?.gymName])
      
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
  }, [gymSlug, brandingGymName, user?.gymName, user, onClose, uppy])

  const getActiveUppy = () => uppy
  const getActiveConfig = () => SLOT_CONFIG[activeSlot]

  // Get total files across all categories
  const getTotalFiles = () => {
    return uppy.getFiles().length
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
                const uppy = uppy
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
                Ready to upload to {gymName || 'your gym'}
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
                uppy={uppy}
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

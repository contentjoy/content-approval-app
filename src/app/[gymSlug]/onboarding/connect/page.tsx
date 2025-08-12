'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  ExternalLink, 
  Loader, 
  AlertCircle,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AyrshareProfile } from '@/types'
// No modal needed; we use a centered popup and a lightweight overlay while connecting

interface SocialPlatform {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  connected: boolean
  profile?: AyrshareProfile
}

export default function SocialConnectPage() {
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-accent', connected: false },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500', connected: false },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-accent', connected: false },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-accent-strong', connected: false },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-destructive', connected: false },
  ])
  
  const [error, setError] = useState('')
  const [gymId, setGymId] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  
  const router = useRouter()
  const params = useParams()
  const gymSlug = params.gymSlug as string

  useEffect(() => {
    const storedGymId = localStorage.getItem('gym_id')
    if (storedGymId) {
      setGymId(storedGymId)
      loadConnectedAccounts(storedGymId)
      console.log('🔑 Found gym ID in localStorage:', storedGymId)
    } else {
      console.error('❌ No gym_id found in localStorage')
    }
  }, [])

  const loadConnectedAccounts = async (gymId: string) => {
    try {
      const { data: gym } = await supabase
        .from('gyms')
        .select('social_accounts, ayrshare_profiles')
        .eq('id', gymId)
        .single()

      if (gym?.social_accounts || gym?.ayrshare_profiles) {
        setPlatforms(prev => prev.map(platform => {
          const profile: any = gym.ayrshare_profiles?.[platform.id as keyof typeof gym.ayrshare_profiles]
          const connected = Boolean(
            gym.social_accounts?.[platform.id as keyof typeof gym.social_accounts] || profile?.profile_key
          )
          return {
            ...platform,
            connected,
            profile: profile || undefined
          }
        }))
      }
    } catch (error) {
      console.error('Failed to load connected accounts:', error)
    }
  }

  const connectPlatform = async (platformId: string) => {
    if (!gymId) {
      console.error('No gym ID available for connection')
      return
    }

    console.log('🔗 Connecting platform:', platformId, 'for gym:', gymId)
    setIsConnecting(platformId)
    setError('')

    try {
      // Load profileKey
      const { data: gym } = await supabase
        .from('gyms')
        .select('profile_key')
        .eq('id', gymId)
        .single()
      const profileKey = gym?.profile_key
      if (!profileKey) throw new Error('Missing profile key. Please complete onboarding first.')

      // Generate JWT for Ayrshare authentication
      const response = await fetch('/api/ayrshare/generate-jwt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileKey, gymId, platform: platformId })
      })

      console.log('📡 JWT generation response status:', response.status)

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ JWT generation failed:', errorData)
        throw new Error(`Failed to generate authentication URL: ${errorData}`)
      }

      const responseData = await response.json()
      console.log('📋 JWT response data:', responseData)
      
      const { url, jwt, demo } = responseData

      if (demo) {
        console.log('🎭 Demo mode - showing Ayrshare connection flow')
        setError('🎭 Demo Mode: Ayrshare credentials not configured yet. This will work once you add your API keys on Monday!')
        return
      }

      // Store JWT for callback handling
      if (jwt) localStorage.setItem(`ayrshare_jwt_${platformId}`, jwt)
      
      // Open Ayrshare auth in a contained popup (in-app modal window)
      const width = Math.min(720, Math.floor(window.innerWidth * 0.9))
      const height = Math.min(780, Math.floor(window.innerHeight * 0.9))
      const left = Math.floor((window.screen.width - width) / 2)
      const top = Math.floor((window.screen.height - height) / 2)
      const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no`
      const authWindow = window.open(url, 'ayrshare_auth', features)

      if (!authWindow) {
        throw new Error('Popup blocked! Please allow popups for this site.')
      }

      // Poll for window closure (successful auth)
      const checkWindow = setInterval(async () => {
        if (authWindow?.closed) {
          clearInterval(checkWindow)
          try {
            // Best-effort persist mapping even if redirect callback didn't run
            await fetch('/api/ayrshare/mark-connected', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gymId, platform: platformId, profileKey })
            })
            // Then ask Ayrshare which platforms are currently linked, to fill any pre-existing ones
            await fetch('/api/ayrshare/sync-profiles', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gymId, profileKey })
            })
          } catch {}
          // Then refresh UI state
          setTimeout(() => checkConnectionStatus(platformId), 800)
        }
      }, 1000)

      // Listen for success from callback
      const listener = async (event: MessageEvent) => {
        try {
          const msg = event.data
          if (msg?.type === 'AYRSHARE_AUTH_SUCCESS' && msg.gymId === gymId) {
            // Persist minimal profile mapping
            await fetch('/api/ayrshare/mark-connected', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gymId, platform: platformId, profileKey }),
            })
            await checkConnectionStatus(platformId)
            // Close popup proactively once success is received
            try { authWindow?.close() } catch {}
          }
        } catch {}
      }
      window.addEventListener('message', listener)
      setTimeout(() => window.removeEventListener('message', listener), 120000)

    } catch (error: unknown) {
      console.error(`Failed to connect ${platformId}:`, error)
      setError((error as Error).message || `Failed to connect ${platformId}`)
    } finally {
      setIsConnecting(null)
    }
  }

  const checkConnectionStatus = async (platformId: string) => {
    if (!gymId) return

    try {
      // Check if the platform was successfully connected
      const { data: gym } = await supabase
        .from('gyms')
        .select('social_accounts, ayrshare_profiles')
        .eq('id', gymId)
        .single()

      const isConnected = !!(
        gym?.social_accounts?.[platformId as keyof typeof gym.social_accounts] ||
        gym?.ayrshare_profiles?.[platformId as keyof typeof gym.ayrshare_profiles]
      )

      if (isConnected) {
        setPlatforms(prev => prev.map(platform => 
          platform.id === platformId 
            ? { ...platform, connected: true }
            : platform
        ))
      }
    } catch (error) {
      console.error('Failed to check connection status:', error)
    }
  }

  const handleContinue = () => {
    // Cache session and redirect to main dashboard
    const gymSlugFormatted = gymSlug.toLowerCase().replace(/[^a-z0-9]/g, '-')
    router.push(`/${gymSlugFormatted}`)
  }

  const handleSkip = () => {
    // Skip social connection and go to dashboard
    handleContinue()
  }

  const connectedCount = platforms.filter(p => p.connected).length
  const hasConnections = connectedCount > 0

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-card-bg border border-card-border rounded-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-text mb-2">
              Connect Your Social Media
            </h1>
            <p className="text-text-secondary">
              Connect your social media accounts to enable content publishing and management
            </p>
          </div>

          {/* Progress Indicator */}
            {hasConnections && (
            <div className="mb-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-accent mr-2" />
                <span className="text-accent font-medium">
                  {connectedCount} platform{connectedCount !== 1 ? 's' : ''} connected
                </span>
              </div>
            </div>
          )}

          {/* Error Message */}
            {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
            >
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-destructive mr-2" />
                <span className="text-destructive">{error}</span>
              </div>
            </motion.div>
          )}

          {/* Social Platforms */}
          <div className="space-y-4 mb-8">
            {platforms.map((platform) => (
              <motion.div
                key={platform.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * platforms.indexOf(platform) }}
                className={`
                  border rounded-lg p-4 transition-all duration-200
                  ${platform.connected
                    ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-700'
                    : 'border-card-border bg-background hover:border-primary'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`
                      w-12 h-12 rounded-lg flex items-center justify-center text-white
                      ${platform.color}
                    `}>
                      <platform.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-text">{platform.name}</h3>
                      <p className="text-sm text-text-secondary">
                        {platform.connected 
                          ? 'Connected and ready to publish'
                          : 'Connect to enable publishing'
                        }
                      </p>
                    </div>
                  </div>

                  {platform.connected ? (
                    <div className="flex items-center text-accent">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="text-sm font-medium">Connected</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => connectPlatform(platform.id)}
                      disabled={isConnecting === platform.id}
                      className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      {isConnecting === platform.id ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Connect
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Information Box */}
            <div className="mb-8 p-4 bg-bg-elev-1 border border-border rounded-lg">
            <h4 className="font-semibold text-text mb-2">How it works:</h4>
            <ul className="text-sm text-muted-text space-y-1">
              <li>• Click &quot;Connect&quot; to authorize access to your social media accounts</li>
              <li>• You&apos;ll be redirected to each platform&apos;s secure login page</li>
              <li>• Once connected, you can publish content directly from your dashboard</li>
              <li>• You can connect more platforms later in your settings</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSkip}
              className="flex-1 px-6 py-3 border border-border text-muted-text hover:text-text hover:border-accent rounded-lg transition-colors"
            >
              Skip for Now
            </button>
            
            <button
              onClick={handleContinue}
              disabled={!hasConnections}
              className="flex-1 px-6 py-3 bg-accent text-background rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {hasConnections ? 'Continue to Dashboard' : 'Connect at least one platform'}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-text-secondary">
              Your social media credentials are securely stored and encrypted
            </p>
          </div>
        </div>
      </motion.div>

      {/* Overlay while connecting */}
      {isConnecting && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-[var(--surface)] border border-border rounded-lg p-6 max-w-sm text-center shadow-medium">
            <p className="text-text mb-2 font-semibold">Please click &quot;Close&quot; in the connect window</p>
            <p className="text-sm text-muted-text">After closing, we’ll update your connected accounts here automatically.</p>
          </div>
        </div>
      )}
    </div>
  )
}

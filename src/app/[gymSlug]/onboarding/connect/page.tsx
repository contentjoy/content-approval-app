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
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'bg-blue-600', connected: false },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500', connected: false },
    { id: 'twitter', name: 'Twitter', icon: Twitter, color: 'bg-sky-500', connected: false },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-blue-700', connected: false },
    { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'bg-red-600', connected: false },
  ])
  
  const [error, setError] = useState('')
  const [gymId, setGymId] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState<string | null>(null)
  
  const router = useRouter()
  const params = useParams()
  const gymSlug = params.gymSlug as string

  useEffect(() => {
    const storedGymId = localStorage.getItem('id')
    if (storedGymId) {
      setGymId(storedGymId)
      loadConnectedAccounts(storedGymId)
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
        setPlatforms(prev => prev.map(platform => ({
          ...platform,
          connected: !!(
            gym.social_accounts?.[platform.id as keyof typeof gym.social_accounts] ||
            gym.ayrshare_profiles?.[platform.id as keyof typeof gym.ayrshare_profiles]
          )
        })))
      }
    } catch (error) {
      console.error('Failed to load connected accounts:', error)
    }
  }

  const connectPlatform = async (platformId: string) => {
    if (!gymId) return

    setIsConnecting(platformId)
    setError('')

    try {
      // Generate JWT for Ayrshare authentication
      const response = await fetch('/api/ayrshare/generate-jwt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          platform: platformId,
          gymId: gymId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate authentication URL')
      }

      const { authUrl, jwt } = await response.json()

      // Store JWT for callback handling
      localStorage.setItem(`ayrshare_jwt_${platformId}`, jwt)
      
      // Open Ayrshare auth in new window
      const authWindow = window.open(
        authUrl,
        'ayrshare_auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      )

      // Poll for window closure (successful auth)
      const checkWindow = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkWindow)
          // Check if connection was successful
          setTimeout(() => checkConnectionStatus(platformId), 1000)
        }
      }, 1000)

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
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">
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
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
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
                    ? 'border-green-300 bg-green-50' 
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
                    <div className="flex items-center text-green-600">
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
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
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
              className="flex-1 px-6 py-3 border border-card-border text-text-secondary hover:text-text hover:border-primary rounded-lg transition-colors"
            >
              Skip for Now
            </button>
            
            <button
              onClick={handleContinue}
              disabled={!hasConnections}
              className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
    </div>
  )
}

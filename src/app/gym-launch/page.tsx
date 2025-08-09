'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, LogIn, UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import type { Agency } from '@/types'

export default function GymLaunchPage() {
  const [email, setEmail] = useState('')
  const [passcode, setPasscode] = useState('')
  const [showPasscode, setShowPasscode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [agencyData, setAgencyData] = useState<Agency | null>(null)
  const [loadingAgency, setLoadingAgency] = useState(true)
  
  const router = useRouter()
  const agencyPartnerName = 'Gym Launch' // This should match the "Partner name" in agencies table

  // Load agency data on component mount
  useEffect(() => {
    async function loadAgencyData() {
      try {
        const { data: agency, error } = await supabase
          .from('agencies')
          .select('*')
          .eq('Partner name', agencyPartnerName)
          .single()

        if (error) {
          console.error('Error loading agency:', error)
          setError(`Agency "${agencyPartnerName}" not found in database`)
        } else {
          setAgencyData(agency)
        }
      } catch (err) {
        console.error('Error loading agency data:', err)
        setError('Failed to load agency information')
      } finally {
        setLoadingAgency(false)
      }
    }

    loadAgencyData()
  }, [agencyPartnerName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !passcode.trim()) {
      setError('Please enter both email and passcode')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Admin bypass
      if (email === 'CJ' && passcode === 'CJ') {
        // Create admin session token
        const sessionToken = generateSessionToken()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 1) // +1 day

        localStorage.setItem('session_token', sessionToken)
        localStorage.setItem('admin_user', 'true')
        
        router.push(`/movement-society`) // Default gym for admin
        return
      }

      if (!agencyData) {
        setError('Agency data not loaded. Please try again.')
        return
      }

      if (isSignUp) {
        // Sign-up flow
        const gymName = email.toLowerCase().replace(/[^a-z0-9]/g, '-')
        
        // Check if gym name already exists
        const { data: existingGym } = await supabase
          .from('gyms')
          .select('gym_id')
          .eq('Gym Name', gymName)
          .single()

        if (existingGym) {
          setError('An account with this email already exists')
          return
        }

        // Create new gym record
        const { data: newGym, error: createError } = await supabase
          .from('gyms')
          .insert({
            'Gym Name': gymName,
            'Agency': agencyData.id, // Use the agency UUID
            'Email': email,
            'passcode': passcode,
            'Status': 'pending',
            'First name': '',
            'Last name': '',
            'Primary color': null
          })
          .select('gym_id')
          .single()

        if (createError) {
          throw createError
        }

        // Create session
        const sessionToken = generateSessionToken()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 1) // +1 day

        const { error: sessionError } = await supabase
          .from('user_sessions')
          .insert({
            user_id: newGym.gym_id,
            session_token: sessionToken,
            expires_at: expiresAt.toISOString()
          })

        if (sessionError) {
          throw sessionError
        }

        localStorage.setItem('session_token', sessionToken)
        localStorage.setItem('gym_id', newGym.gym_id)
        
        // Redirect to onboarding
        router.push(`/${gymName}/onboarding`)
      } else {
        // Sign-in flow
        const { data: gym, error: gymError } = await supabase
          .from('gyms')
          .select('*')
          .eq('Email', email)
          .eq('passcode', passcode)
          .eq('Agency', agencyData.id) // Use the agency UUID
          .single()

        if (gymError || !gym) {
          setError('Invalid email or passcode')
          return
        }

        // Create session
        const sessionToken = generateSessionToken()
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 1) // +1 day

        const { error: sessionError } = await supabase
          .from('user_sessions')
          .insert({
            user_id: gym.gym_id,
            session_token: sessionToken,
            expires_at: expiresAt.toISOString()
          })

        if (sessionError) {
          throw sessionError
        }

        localStorage.setItem('session_token', sessionToken)
        
        // Redirect to dashboard
        router.push(`/${gym['Gym Name']}`)
      }
    } catch (err: unknown) {
      console.error('Authentication error:', err)
      setError((err as Error).message || 'Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingAgency) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card-bg border border-card-border rounded-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Agency Logo */}
            {agencyData?.Logo && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="w-20 h-20 mx-auto mb-6 relative rounded-lg overflow-hidden"
              >
                <Image
                  src={agencyData.Logo}
                  alt={`${agencyData['Partner name']} Logo`}
                  fill
                  className="object-contain"
                  priority
                />
              </motion.div>
            )}
            
            {/* Fallback Icon */}
            {!agencyData?.Logo && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: agencyData?.['Primary Color'] || '#000000' }}
              >
                {isSignUp ? (
                  <UserPlus className="w-8 h-8 text-white" />
                ) : (
                  <LogIn className="w-8 h-8 text-white" />
                )}
              </motion.div>
            )}
            <h1 className="text-2xl font-bold text-text mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-text-secondary">
              {isSignUp 
                ? `Join ${agencyData?.['Partner name'] || 'Gym Launch'} and start managing your content`
                : `Sign in to your ${agencyData?.['Partner name'] || 'Gym Launch'} dashboard`
              }
            </p>
          </div>

          {/* Sign In/Up Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-text-secondary" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text placeholder-text-secondary bg-background"
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Passcode Field */}
            <div>
              <label htmlFor="passcode" className="block text-sm font-medium text-text mb-2">
                Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-text-secondary" />
                </div>
                <input
                  id="passcode"
                  type={showPasscode ? "text" : "password"}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-card-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-text placeholder-text-secondary bg-background"
                  placeholder="Enter your passcode"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPasscode(!showPasscode)}
                  disabled={isLoading}
                >
                  {showPasscode ? (
                    <EyeOff className="h-5 w-5 text-text-secondary" />
                  ) : (
                    <Eye className="h-5 w-5 text-text-secondary" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 border border-red-200 rounded-lg p-3"
              >
                <p className="text-sm text-red-600">{error}</p>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoading || !email.trim() || !passcode.trim()}
              className="w-full text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              style={{ 
                backgroundColor: agencyData?.['Primary Color'] || '#000000',
                '--tw-ring-color': agencyData?.['Primary Color'] || '#000000'
              } as React.CSSProperties}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </div>
              ) : (
                isSignUp ? 'Create Account' : 'Sign In'
              )}
            </motion.button>
          </form>

          {/* Toggle Sign In/Up */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError('')
              }}
              className="text-sm hover:underline"
              style={{ color: agencyData?.['Primary Color'] || '#000000' }}
            >
              {isSignUp 
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"
              }
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-text-secondary">
              Need help? Contact your agency administrator
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Helper function to generate session token
function generateSessionToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

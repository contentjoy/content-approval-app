'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import type { AuthUser, Gym } from '@/types'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (gymName: string, passcode: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  updateSocialAccounts: (accounts: Gym['social_accounts']) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user

  // Check for existing session on mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token')
      if (!sessionToken) {
        setIsLoading(false)
        return
      }

      // Verify session in database
      const { data: session, error } = await supabase
        .from('user_sessions')
        .select(`
          *,
          gyms!user_sessions_user_id_fkey (
            gym_id,
            "Gym Name",
            "Agency",
            "Primary color",
            "social_accounts"
          )
        `)
        .eq('session_token', sessionToken)
        .gte('expires_at', new Date().toISOString())
        .single()

      if (error || !session) {
        localStorage.removeItem('session_token')
        setIsLoading(false)
        return
      }

      const gym = session.gyms as unknown as Gym
      setUser({
        gymId: gym.gym_id,
        gymName: gym['Gym Name'],
        agency: gym['Agency'],
        socialAccounts: gym['social_accounts'],
        primaryColor: gym['Primary color']
      })
    } catch (error) {
      console.error('Session check failed:', error)
      localStorage.removeItem('session_token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (gymName: string, passcode: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)

      // Find gym by name and passcode
      const { data: gym, error: gymError } = await supabase
        .from('gyms')
        .select('*')
        .eq('Gym Name', gymName.toLowerCase())
        .eq('passcode', passcode)
        .single()

      if (gymError || !gym) {
        return {
          success: false,
          error: 'Invalid gym name or passcode'
        }
      }

      // Generate session token
      const sessionToken = generateSessionToken()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30) // 30 days

      // Create session in database
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

      // Store session token
      localStorage.setItem('session_token', sessionToken)

      // Set user
      setUser({
        gymId: gym.gym_id,
        gymName: gym['Gym Name'],
        agency: gym['Agency'],
        socialAccounts: gym['social_accounts'],
        primaryColor: gym['Primary color']
      })

      return { success: true }
    } catch (error) {
      console.error('Login failed:', error)
      return {
        success: false,
        error: 'Login failed. Please try again.'
      }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem('session_token')
      if (sessionToken) {
        // Remove session from database
        await supabase
          .from('user_sessions')
          .delete()
          .eq('session_token', sessionToken)
      }

      localStorage.removeItem('session_token')
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const updateSocialAccounts = async (accounts: Gym['social_accounts']) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('gyms')
        .update({ 'social_accounts': accounts })
        .eq('gym_id', user.gymId)

      if (error) throw error

      setUser(prev => prev ? { ...prev, socialAccounts: accounts } : null)
    } catch (error) {
      console.error('Failed to update social accounts:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        updateSocialAccounts
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper function to generate session token
function generateSessionToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

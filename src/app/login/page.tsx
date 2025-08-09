'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Lock, User, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export default function LoginPage() {
  const [gymName, setGymName] = useState('')
  const [passcode, setPasscode] = useState('')
  const [showPasscode, setShowPasscode] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push(`/${gymName || 'dashboard'}`)
    }
  }, [isAuthenticated, router, gymName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gymName.trim() || !passcode.trim()) {
      setError('Please enter both gym name and passcode')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const result = await login(gymName.trim(), passcode.trim())
      if (result.success) {
        router.push(`/${gymName.toLowerCase().replace(/\s+/g, '-')}`)
      } else {
        setError(result.error || 'Login failed')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-[#F9F9F9] border border-[#E0E0E0] rounded-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="w-16 h-16 bg-black rounded-lg flex items-center justify-center mx-auto mb-4"
            >
              <LogIn className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Sign in to your content management dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Gym Name Field */}
            <div>
              <label htmlFor="gymName" className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Gym Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="gymName"
                  type="text"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-[#1A1A1A] placeholder-gray-500"
                  placeholder="Enter your gym name"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Passcode Field */}
            <div>
              <label htmlFor="passcode" className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="passcode"
                  type={showPasscode ? "text" : "password"}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="block w-full pl-10 pr-12 py-3 border border-[#E0E0E0] rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-[#1A1A1A] placeholder-gray-500"
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
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
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
              disabled={isLoading || !gymName.trim() || !passcode.trim()}
              className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Need help? Contact your agency administrator
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

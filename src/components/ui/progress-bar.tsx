'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBranding } from '@/contexts/branding-context'

interface ProgressBarProps {
  current: number
  total: number
  goal: number
  className?: string
}

export function ProgressBar({ current, total, goal, className = '' }: ProgressBarProps) {
  const { primaryColor } = useBranding()
  const [showConfetti, setShowConfetti] = useState(false)
  const [hasReachedGoal, setHasReachedGoal] = useState(false)

  const progress = Math.min((current / goal) * 100, 100)
  const isGoalReached = current >= goal

  useEffect(() => {
    if (isGoalReached && !hasReachedGoal) {
      setHasReachedGoal(true)
      setShowConfetti(true)
      
      // Hide confetti after 5 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isGoalReached, hasReachedGoal])

  const getProgressColor = () => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-yellow-500'
    if (progress >= 50) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getProgressBgColor = () => {
    if (progress >= 100) return 'bg-green-100'
    if (progress >= 75) return 'bg-yellow-100'
    if (progress >= 50) return 'bg-orange-100'
    return 'bg-red-100'
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">
          Progress: {current}/{goal} Approved
        </h3>
        <span className="text-sm font-medium text-gray-500">
          {total} total posts
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className={`w-full h-3 rounded-full ${getProgressBgColor()} overflow-hidden`}>
          <motion.div
            className={`h-full ${getProgressColor()} rounded-full transition-all duration-500 ease-out`}
            style={{
              width: `${progress}%`,
              backgroundColor: primaryColor && progress > 0 ? `var(--brand-primary)` : undefined
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        
        {/* Progress Percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded-full shadow-sm">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Goal Achievement Message */}
      <AnimatePresence>
        {isGoalReached && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium text-green-800">
                �� Goal achieved! You&apos;ve approved {current} posts!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti Celebration */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50"
          >
            <ConfettiCelebration />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Simple confetti component (we'll enhance this later)
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
    const colors = ['#fbbf24', '#34d399', '#60a5fa', '#f87171', '#a78bfa', '#fb7185']
    const newParticles = Array.from({ length: 150 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -20,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      speed: Math.random() * 3 + 2
    }))
    
    setParticles(newParticles)

    const interval = setInterval(() => {
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          y: particle.y + particle.speed
        })).filter(particle => particle.y < window.innerHeight + 50)
      )
    }, 50)

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
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

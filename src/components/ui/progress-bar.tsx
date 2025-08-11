'use client'

import React, { useState, useEffect } from 'react'
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
      
      // Hide confetti after 1.5 seconds
      const timer = setTimeout(() => {
        setShowConfetti(false)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [isGoalReached, hasReachedGoal])

  const getProgressColor = () => {
    if (progress >= 80) return 'bg-accent'
    if (progress >= 60) return 'bg-accent-soft'
    if (progress >= 40) return 'bg-accent-strong'
    return 'bg-muted'
  }

  const getProgressBgColor = () => {
    if (progress >= 100) return 'bg-accent-soft'
    if (progress >= 75) return 'bg-accent-soft'
    if (progress >= 50) return 'bg-accent-soft'
    return 'bg-bg-elev-1'
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-text">
          Progress: {current}/{goal} Approved
        </h3>
        <span className="text-sm font-medium text-muted-text">
          {total} total posts
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className={`w-full h-3 rounded-md ${getProgressBgColor()} overflow-hidden border border-border bg-[var(--surface)]`}>
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
          <span className="text-xs font-medium text-card-foreground bg-card px-2 py-1 rounded-full shadow-soft">
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
            className="mt-3 p-3 bg-accent-soft border border-accent rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm font-medium text-text">
                🎯 Goal achieved! You&apos;ve approved {current} posts!
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
            animate={{ opacity: 0.2 }}
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
    const colors = ['var(--accent)', 'var(--accent-soft)', 'var(--accent-strong)', 'var(--destructive)']
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

'use client'

import React from 'react'
import { useBranding } from '@/contexts/branding-context'

interface CompactProgressProps {
  approved: number
  total: number
  goal: number
  className?: string
}

export function CompactProgress({ approved, total, goal, className = '' }: CompactProgressProps) {
  const { primaryColor } = useBranding()
  
  const progress = Math.min((approved / goal) * 100, 100)
  // const isGoalReached = approved >= goal

  const getProgressColor = () => {
    if (progress >= 100) return 'bg-accent'
    if (progress >= 75) return 'bg-accent-soft'
    if (progress >= 50) return 'bg-accent-strong'
    return 'bg-muted'
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Progress Bar */}
      <div className="flex items-center space-x-2">
        <div className="w-16 h-2 bg-bg-elev-1 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getProgressColor()} rounded-full transition-all duration-300`}
            style={{
              width: `${progress}%`,
              backgroundColor: primaryColor && progress > 0 ? `var(--accent)` : undefined
            }}
          />
        </div>
        <span className="text-xs font-medium text-muted-text min-w-[2.5rem]">
          {approved}/{goal}
        </span>
      </div>
      
      {/* Total Posts */}
      <span className="text-xs text-muted-text">
        {total} posts
      </span>
    </div>
  )
}

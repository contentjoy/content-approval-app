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
  const isGoalReached = approved >= goal

  const getProgressColor = () => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-yellow-500'
    if (progress >= 50) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Progress Bar */}
      <div className="flex items-center space-x-2">
        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getProgressColor()} rounded-full transition-all duration-300`}
            style={{
              width: `${progress}%`,
              backgroundColor: primaryColor && progress > 0 ? `var(--brand-primary)` : undefined
            }}
          />
        </div>
        <span className="text-xs font-medium text-gray-600 min-w-[2.5rem]">
          {approved}/{goal}
        </span>
      </div>
      
      {/* Total Posts */}
      <span className="text-xs text-gray-500">
        {total} posts
      </span>
    </div>
  )
}

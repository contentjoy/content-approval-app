'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface CheckmarkIconProps {
  active: boolean
  className?: string
}

export function CheckmarkIcon({ active, className }: CheckmarkIconProps) {
  return (
    <div
      className={cn(
        'h-8 w-8 rounded-full flex items-center justify-center transition-colors',
        active ? 'bg-primary' : 'bg-surface hover:bg-surface/80',
        className
      )}
    >
      <Check
        className={cn(
          'h-4 w-4',
          active ? 'text-background' : 'text-muted-foreground'
        )}
      />
    </div>
  )
}

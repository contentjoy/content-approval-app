'use client'

import React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'
import { cn } from '@/lib/utils'

interface ThemeToggleProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'icon' | 'button' | 'minimal'
}

export function ThemeToggle({ 
  className = '', 
  size = 'md',
  variant = 'button'
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12'
  }

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'inline-flex items-center justify-center rounded-xl border border-border bg-background text-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus-ring',
          sizeClasses[size],
          className
        )}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        <Sun className={cn(iconSizes[size], 'rotate-0 scale-100 transition-all duration-200', theme === 'dark' ? '-rotate-90 scale-0' : '')} />
        <Moon className={cn(iconSizes[size], 'absolute rotate-90 scale-0 transition-all duration-200', theme === 'dark' ? 'rotate-0 scale-100' : '')} />
      </button>
    )
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'inline-flex items-center justify-center rounded-xl text-muted-foreground transition-all duration-200 hover:text-foreground focus-ring',
          sizeClasses[size],
          className
        )}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        <Sun className={cn(iconSizes[size], 'rotate-0 scale-100 transition-all duration-200', theme === 'dark' ? '-rotate-90 scale-0' : '')} />
        <Moon className={cn(iconSizes[size], 'absolute rotate-90 scale-0 transition-all duration-200', theme === 'dark' ? 'rotate-0 scale-100' : '')} />
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground focus-ring',
        sizeClasses[size],
        className
      )}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      <Sun className={cn(iconSizes[size], 'rotate-0 scale-100 transition-all duration-200', theme === 'dark' ? '-rotate-90 scale-0' : '')} />
      <Moon className={cn(iconSizes[size], 'absolute rotate-90 scale-0 transition-all duration-200', theme === 'dark' ? 'rotate-0 scale-100' : '')} />
      <span className="hidden sm:inline">
        {theme === 'light' ? 'Dark' : 'Light'} Mode
      </span>
    </button>
  )
}

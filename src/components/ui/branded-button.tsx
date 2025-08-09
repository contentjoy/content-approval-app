'use client'

import React from 'react'
import { useBranding } from '@/contexts/branding-context'
import { cn } from '@/lib/utils'

interface BrandedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const BrandedButton = React.forwardRef<HTMLButtonElement, BrandedButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const { primaryColor, isLoading } = useBranding()

    const baseStyles = 'inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none'
    
    const getVariantStyles = () => {
      if (primaryColor && variant === 'primary') {
        return `bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)] focus-visible:ring-[var(--brand-primary)]`
      }
      
      if (primaryColor && variant === 'outline') {
        return `border border-[var(--brand-primary)] bg-transparent text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white`
      }
      
      if (primaryColor && variant === 'ghost') {
        return `hover:bg-[var(--brand-primary)] hover:text-white text-[var(--brand-primary)]`
      }

      // Default styles if no branding
      switch (variant) {
        case 'primary':
          return 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500'
        case 'secondary':
          return 'bg-gray-100 text-gray-900 hover:bg-gray-200'
        case 'outline':
          return 'border border-gray-300 bg-transparent hover:bg-gray-50'
        case 'ghost':
          return 'hover:bg-gray-100'
        case 'destructive':
          return 'bg-red-600 text-white hover:bg-red-700'
        default:
          return 'bg-blue-600 text-white hover:bg-blue-700'
      }
    }
    
    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-8 text-lg'
    }
    
    return (
      <button
        className={cn(
          baseStyles,
          getVariantStyles(),
          sizes[size],
          className
        )}
        ref={ref}
        disabled={isLoading}
        {...props}
      >
        {children}
      </button>
    )
  }
)

BrandedButton.displayName = 'BrandedButton'

export { BrandedButton }

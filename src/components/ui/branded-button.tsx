'use client'

import React from 'react'
import { useBranding } from '@/contexts/branding-context'
import { cn } from '@/lib/utils'

interface BrandedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}

const BrandedButton = React.forwardRef<HTMLButtonElement, BrandedButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const { primaryColor, isLoading } = useBranding()

    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus-ring disabled:opacity-50 disabled:pointer-events-none'
    
    const getVariantStyles = () => {
      if (primaryColor && variant === 'default') {
        return `bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-dark)] shadow-soft hover:shadow-medium focus:ring-[var(--brand-primary)]`
      }
      
      if (primaryColor && variant === 'outline') {
        return `border border-[var(--brand-primary)] bg-transparent text-[var(--brand-primary)] hover:bg-[var(--brand-primary)] hover:text-white shadow-soft hover:shadow-medium`
      }
      
      if (primaryColor && variant === 'ghost') {
        return `hover:bg-[var(--brand-primary)] hover:text-white text-[var(--brand-primary)]`
      }

      // Default styles if no branding
      switch (variant) {
        case 'default':
          return 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft hover:shadow-medium'
        case 'secondary':
          return 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
        case 'outline':
          return 'border border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
        case 'ghost':
          return 'hover:bg-accent hover:text-accent-foreground'
        case 'destructive':
          return 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-soft hover:shadow-medium'
        case 'link':
          return 'text-primary underline-offset-4 hover:underline'
        default:
          return 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft hover:shadow-medium'
      }
    }
    
    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-11 px-8 text-sm',
      xl: 'h-12 px-10 text-base'
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

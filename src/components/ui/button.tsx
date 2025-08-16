import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'pill'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  children: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-ring disabled:opacity-50 disabled:pointer-events-none'
    
    const variants = {
      // Modern design system with pill styling
      default: 'bg-surface text-foreground hover:bg-hover rounded-[12px]',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-[12px]',
      outline: 'border border-border bg-transparent text-foreground hover:bg-surface hover:border-border-strong rounded-[12px]',
      secondary: 'bg-surface text-foreground hover:bg-hover rounded-[12px]',
      ghost: 'bg-transparent border border-border text-foreground hover:bg-surface hover:border-border-strong rounded-[12px]',
      link: 'text-primary underline-offset-4 hover:underline bg-transparent',
      pill: 'bg-surface text-foreground hover:bg-hover rounded-[999px] border border-border'
    }
    
    const sizes = {
      sm: 'h-8 px-4 py-2 text-xs',
      md: 'h-10 px-6 py-3 text-sm',
      lg: 'h-11 px-8 py-3 text-sm',
      xl: 'h-12 px-10 py-4 text-base'
    }
    
    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }

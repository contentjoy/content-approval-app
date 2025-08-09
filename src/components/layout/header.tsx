'use client'

import React from 'react'
import Link from 'next/link'
import { BrandedButton } from '@/components/ui/branded-button'
import { Logo } from '@/components/ui/logo'
import { useBranding } from '@/contexts/branding-context'

export function Header() {
  const { gymName, isLoading } = useBranding()

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-3">
          {/* Agency logo only - no gym name text */}
          <Logo size="lg" fallbackText="" showFallback={false} />
        </Link>
        
        <nav className="flex items-center space-x-4">
          <Link href="/dashboard" className="text-gray-600 hover:text-[var(--brand-primary)] transition-colors">
            Dashboard
          </Link>
          <Link href="/content" className="text-gray-600 hover:text-[var(--brand-primary)] transition-colors">
            Content
          </Link>
          <Link href="/approvals" className="text-gray-600 hover:text-[var(--brand-primary)] transition-colors">
            Approvals
          </Link>
          {/* Keep only the branded button with primary color */}
          <BrandedButton 
            variant="primary" 
            size="sm"
            className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-dark)] text-white"
          >
            Sign In
          </BrandedButton>
        </nav>
      </div>
    </header>
  )
}
